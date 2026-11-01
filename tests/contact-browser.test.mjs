import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { resolve, join, extname, sep } from 'node:path';
import { chromium } from 'playwright-core';

const root=resolve('dist'), artifacts=resolve('.cache/contact-centerpiece');
const errors=[];
let server,browser,base;
before(async()=>{
  await mkdir(artifacts,{recursive:true});
  const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2','.pdf':'application/pdf'};
  server=createServer(async(req,res)=>{
    try {
      let file=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
      if(file!==root&&!file.startsWith(root+sep))throw Error('Invalid path');
      if((await stat(file)).isDirectory())file=join(file,'index.html');
      res.writeHead(200,{'Content-Type':mime[extname(file)]??'application/octet-stream'});
      res.end(await readFile(file));
    } catch {res.writeHead(404);res.end();}
  });
  await new Promise(done=>server.listen(0,'127.0.0.1',done));
  base='http://127.0.0.1:'+server.address().port;
  browser=await chromium.launch({channel:'msedge',headless:true});
});
after(async()=>{
  await browser?.close();
  if(server)await new Promise(done=>server.close(done));
  assert.deepEqual(errors,[],'No browser script errors');
});

test('Contact centers one large mascot above all contact actions at six widths',async()=>{
  for(const [width,height] of [[1920,1080],[1366,900],[1024,768],[768,1024],[390,844],[320,720]]){
    const context=await browser.newContext({colorScheme:'dark',viewport:{width,height},reducedMotion:'reduce'});
    try {
      const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
      await page.goto(base,{waitUntil:'networkidle'});
      await page.evaluate(()=>document.fonts.ready);
      await page.locator('[data-fresh-dock="contact"]').scrollIntoViewIfNeeded();
      await page.waitForFunction(()=>document.querySelector('#fresh-companion')?.dataset.currentSection==='contact');
      await page.waitForFunction(()=>document.querySelector('#fresh-companion')?.dataset.pose==='sleeping-curl');
      const geometry=await page.evaluate(()=>{
        const rect=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height,cx:r.left+r.width/2};};
        return {
          dock:rect('[data-fresh-dock="contact"]'),actor:rect('#contact [data-fresh-actor]'),
          main:rect('#contact .contact-main'),heading:rect('#contact .section-heading'),
          stage:rect('#contact .resting-stage'),intro:rect('#contact .section-introduction'),
          email:rect('#contact .contact-email'),links:rect('#contact .contact-links'),
          viewport:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth,
          actorOwned:document.querySelector('#contact [data-fresh-actor]').hasAttribute('data-page-motion-target')
        };
      });
      for(const name of ['dock','actor','main','heading','intro','email','links'])
        assert.ok(Math.abs(geometry[name].cx-width/2)<2,name+' centered at '+width+': '+JSON.stringify(geometry[name]));
      assert.ok(geometry.main.top>geometry.stage.bottom,'Links follow the entire mascot stage');
      assert.ok(geometry.dock.top>=geometry.intro.bottom,'Mascot follows the supporting text');
      assert.ok(geometry.actor.width>=Math.min(220,width*.65),'Mascot is prominent at '+width);
      assert.equal(geometry.actorOwned,false);
      assert.equal(geometry.overflow,false);
      assert.equal(await page.locator('#fresh-companion').count(),1);
      assert.equal(await page.locator('#contact .contact-links a').count(),5);
      assert.equal(await page.locator('#contact a[href^="mailto:"]').count(),1);
      for(const link of await page.locator('#contact .contact-main a').all()){
        const r=await link.boundingBox();
        assert.ok(r.height>=44&&r.x>=0&&r.x+r.width<=width+1,'Touch target within viewport');
        await link.focus();
        assert.equal(await link.evaluate(node=>node===document.activeElement),true);
      }
      if(width===1366||width===390){
        await page.locator('#contact').screenshot({path:join(artifacts,'contact-'+width+'.png')});
      }
      console.log(width+'px: centered mascot '+geometry.actor.width.toFixed(1)+'px; centered links below; no overflow');
    }finally{await context.close();}
  }
});

test('Contact content and all destinations remain accessible without JavaScript',async()=>{
  const context=await browser.newContext({colorScheme:'dark',javaScriptEnabled:false,viewport:{width:390,height:844}});
  try{
    const page=await context.newPage();await page.goto(base,{waitUntil:'networkidle'});
    assert.equal(await page.locator('#contact h2').getAttribute('aria-label'),"LET'S BUILD SOMETHING GREAT");
    assert.equal((await page.locator('#contact .section-introduction').textContent()).trim(),'Have a project in mind, a question, or an opportunity? Let\u2019s connect.');
    for(const href of [
      'mailto:haggaiestavilla04@gmail.com',
      'https://www.linkedin.com/in/haggai-estavilla-027702236/',
      'https://github.com/Haste04',
      'https://www.facebook.com/haggai.estavilla.5',
      'https://www.instagram.com/allivatse_iaggah/',
      '/downloads/Estavilla%20Resume.pdf',
      '#home'
    ])assert.equal(await page.locator('#contact a[href="'+href+'"]').isVisible(),true,href);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  }finally{await context.close();}
});
