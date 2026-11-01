import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {readFile,stat,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join,extname,sep} from 'node:path';
import {chromium} from 'playwright-core';

export const sections=['home','about','education','projects','tech-stack','experience','contact'];
export const layers={
 home:['.hero-name','.hero-role','.hero-scene-halo','.hero-scene-type','.hero-scene-grid','.hero-scene .scene-orbit-depth'],
 about:['#about .section-heading','#about .section-echo','#about .story-gallery'],
 education:['#education .section-heading','#education .education-map-grid','#education .section-echo'],
 projects:['#projects .section-heading','.orbit-depth-plane','.project-detail-depth','#projects .section-echo'],
 'tech-stack':['#tech-stack .section-heading','.toolkit-editorial-layer','.toolkit-contour','.technology-category-heading','.tech-gallery-rule'],
 experience:['#experience .section-heading','.experience-info-depth','.experience-visual-depth','.experience-contributions details'],
 contact:['#contact .section-heading','.closing-scene-halo','.closing-scene-type','.contact-main','#contact .contact-links']
};
/** Static-layout regressions begin after the separately tested, once-only Home entrance. */
export async function homeReady(page){
 await page.waitForFunction(()=>[...document.querySelectorAll('#home [data-component-reveal]')].every(n=>!n.getAnimations().some(a=>a.id.startsWith('component-reveal:'))));
}
export async function harness(folder,{development=false,rootDirectory='dist'}={}){
 const root=resolve(rootDirectory),errors=[],warnings=[],measurements=[];
 await mkdir(folder,{recursive:true});
 const server=createServer(async(req,res)=>{try{
  let file=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));
  if(file!==root&&!file.startsWith(root+sep))throw Error('Outside build');
  if((await stat(file)).isDirectory())file=join(file,'index.html');
  res.writeHead(200,{'Content-Type':({'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2','.pdf':'application/pdf'})[extname(file)]??'application/octet-stream'});
  res.end(await readFile(file));
 }catch{res.writeHead(404);res.end()}});
 await new Promise(done=>server.listen(0,'127.0.0.1',done));
 const production='http://127.0.0.1:'+server.address().port,dev='http://127.0.0.1:4321/';
 let ownedDev;
 if(development){
  const responds=async()=>{try{return(await fetch(dev,{signal:AbortSignal.timeout(5000)})).ok}catch{return false}};
  if(!await responds()){
   ownedDev=spawn(process.execPath,['node_modules/astro/bin/astro.mjs','dev','--host','127.0.0.1','--port','4321','--ignore-lock'],{stdio:'ignore',env:{...process.env,ASTRO_TELEMETRY_DISABLED:'1'}});
   const deadline=Date.now()+90000;let ready=false;
   while(Date.now()<deadline){if(await responds()){ready=true;break}await new Promise(done=>setTimeout(done,250));}
   assert.ok(ready,'Development server must respond at 4321');
  }
 }
 const browser=await chromium.launch({channel:'msedge',headless:true});
 return{
  browser,production,errors,warnings,measurements,
  async open(t,{mode='production',width=1366,height=900,init,beforeLoad,waitForHome=true,...options}={}){
   const context=await browser.newContext({colorScheme:'dark',viewport:{width,height},reducedMotion:'no-preference',...options});
   t.after(()=>context.close());
   if(init)await context.addInitScript(init);
   const page=await context.newPage();page.setDefaultTimeout(8000);page.setDefaultNavigationTimeout(90000);
   page.on('pageerror',error=>errors.push({mode,message:error.message}));
   page.on('console',message=>{if(message.type()==='warning')warnings.push({mode,message:message.text()})});
   if(beforeLoad)await beforeLoad(page);
   await page.goto(mode==='development'?dev:production,{waitUntil:'networkidle'});
   await page.evaluate(()=>document.fonts.ready);
   if(options.javaScriptEnabled!==false){await page.waitForFunction(()=>document.querySelector('#fresh-companion')?.dataset.ready==='true');if(waitForHome)await homeReady(page)}
   return page;
  },
  async shot(page,name,selector){
   const capture=selector?page.locator(selector):page;
   await capture.screenshot({path:join(folder,name+'.png'),style:'.floating-navigation,.skip-link,astro-dev-toolbar{visibility:hidden!important}'});
  },
  async close(){
   await writeFile(join(folder,'results.json'),JSON.stringify({browser:browser.version(),errors,warnings,measurements},null,2));
   await browser.close();await new Promise(done=>server.close(done));ownedDev?.kill();
   assert.deepEqual(errors,[],'Browser JavaScript errors');
  }
 };
}
export async function go(page,y){
 await page.evaluate(top=>scrollTo({top:Math.max(0,top),behavior:'instant'}),y);
 await page.waitForTimeout(120);
 await page.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>requestAnimationFrame(done))));
}
export async function sample(page,selectors){
 return page.evaluate(selectors=>({scrollY,layers:selectors.map(selector=>{
  const n=document.querySelector(selector);if(!n)throw Error('Missing layer '+selector);
  const css=getComputedStyle(n),r=n.getBoundingClientRect();
  return{selector,transform:css.transform,opacity:css.opacity,visibility:css.visibility,documentTop:n.getClientRects().length?r.top+scrollY:null,left:r.left,width:r.width,height:r.height};
 })}),selectors);
}
export function stable(a,b){
 for(const [index,first]of a.layers.entries()){
  const last=b.layers[index];
  for(const key of ['transform','opacity','visibility'])assert.equal(last[key],first[key],first.selector+' '+key+' must remain static');
  for(const key of ['documentTop','left','width','height'])assert.ok(Math.abs(last[key]-first[key])<.8,first.selector+' '+key+': '+first[key]+' -> '+last[key]);
 }
}
/** Only approved About wrappers may own parallax; all functional and mascot transforms stay isolated. */
export async function noDriver(page){
 assert.equal(await page.locator('[data-page-motion-target],.pin-spacer,html[data-page-motion],html[data-motion-tier],[data-hero-depth]').count(),0);
 const owners=await page.locator('main *').evaluateAll(ns=>ns.filter(n=>'_gsap'in n).map(n=>({
  about:!!n.closest('#about')&&n.matches('.photo-story,[data-about-entry]')
 })));
 for(const owner of owners)assert.ok(owner.about,'GSAP owns only designated About scroll wrappers or geometry slots');
 assert.ok(owners.length<=8);
 assert.equal(await page.locator('#fresh-companion,#fresh-companion *').evaluateAll(ns=>ns.some(n=>'_gsap'in n)),false,'No mascot-owned GSAP transform');
 assert.equal(await page.locator('#home').getAttribute('data-hero-triggers'),null);
 assert.equal(await page.locator('#home').evaluate(n=>getComputedStyle(n).transform),'none');
 const triggers=await page.evaluate(()=>window.gsap?.core?.globals?.().ScrollTrigger?.getAll?.().map(t=>({id:t.vars.id,section:t.trigger?.closest('[data-section]')?.id}))??[]);
 assert.ok(triggers.length<=4);
 for(const t of triggers)assert.ok(/^about-story-[0-3]$/.test(t.id)&&t.section==='about');
}
