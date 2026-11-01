import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
const origin = 'http://127.0.0.1:4321';
const folder = '.cache/about-photo';
let browser, ownedDev;
const results = [];
before(async () => {
  await mkdir(folder, {recursive:true});
  let running=false;
  const ready=async()=>{try{return (await fetch(origin,{signal:AbortSignal.timeout(5000)})).ok}catch{return false}};
  running=await ready();
  if(!running){
    ownedDev=spawn(process.execPath,['node_modules/astro/bin/astro.mjs','dev','--host','127.0.0.1','--port','4321','--ignore-lock'],{cwd:process.cwd(),env:{...process.env,ASTRO_TELEMETRY_DISABLED:'1'},stdio:'ignore'});
    const deadline=Date.now()+90000;
    while(Date.now()<deadline&&!running){await new Promise(r=>setTimeout(r,250));running=await ready()}
    assert.ok(running,'About verification development server must respond');
  }
  browser = await chromium.launch({channel:'msedge',headless:true});
});
after(async () => {
  await browser?.close();
  ownedDev?.kill();
  await writeFile(folder+'/results.json',JSON.stringify(results,null,2));
});
async function open(t, width, motion='reduce', options={}) {
  const context = await browser.newContext({colorScheme:'dark',viewport:{width,height:900},reducedMotion:motion,...options});
  t.after(()=>context.close());
  const page = await context.newPage();
  page.setDefaultTimeout(15000);
  page.setDefaultNavigationTimeout(90000);
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  t.after(()=>assert.deepEqual(errors,[]));
  await page.goto(origin,{waitUntil:'networkidle'});
  await page.evaluate(()=>document.fonts.ready);
  await page.locator('#about').evaluate(n=>n.scrollIntoView({behavior:'instant'}));
  return page;
}

const original=JSON.parse(await readFile('tests/fixtures/about-stories.json','utf8'));
for(const width of [1920,1366,1024,768,390,320])test('About photo stories are complete, readable and responsive at '+width+'px',async t=>{
 const page=await open(t,width),panels=page.locator('#about .photo-story');
 assert.equal(await panels.count(),4);
 assert.equal(await page.locator('#about .section-introduction').textContent(),'The code is part of the story. The curiosity behind it is the rest.');
 assert.equal(await page.locator('#about .section-introduction br').count(),0);
 assert.equal(await page.locator('#about summary,#about details,#about .disclosure-symbol').count(),0);
 const boxes=await panels.evaluateAll(ns=>ns.map(n=>{const r=n.getBoundingClientRect();return {left:r.left,width:r.width,top:r.top,bottom:r.bottom,height:r.height}}));
 for(let i=0;i<4;i++){
  const panel=panels.nth(i),story=original[i];
  assert.equal(await panel.locator('h3').textContent(),story.title);
  for(const [selector,key] of [['.story-label','label'],['.story-teaser','teaser'],['.story-detail','detail']]){
   const n=panel.locator(selector);assert.equal(await n.textContent(),story[key]);assert.ok(await n.isVisible());
   assert.ok(await n.evaluate(n=>{const a=n.getBoundingClientRect(),b=n.closest('article').getBoundingClientRect();return a.width>(n.classList.contains('story-detail')?100:0)&&a.top>=b.top&&a.bottom<=b.bottom&&a.right<=b.right+1}),story.title+' '+selector+' stays inside panel');
  }
  assert.equal(await panel.locator('[data-story-photo]').getAttribute('data-story-photo'),story.title+'.jpg');
  const img=panel.locator('img');await img.scrollIntoViewIfNeeded();await img.evaluate(n=>n.decode());
  assert.ok(await img.evaluate(n=>n.naturalWidth>0&&n.hasAttribute('srcset')&&n.width>100));
  assert.equal(await img.getAttribute('loading'),'lazy');
  assert.ok(Math.abs(boxes[i].left-boxes[0].left)<1&&Math.abs(boxes[i].width-boxes[0].width)<1);
  if(i)assert.ok(boxes[i].top>boxes[i-1].bottom);
  if(width<900){
   const photo=await panel.locator('.story-media').boundingBox(),copy=await panel.locator('.story-copy').boundingBox();
   assert.ok(copy.y>=photo.y+photo.height-1,'mobile text below photography');
  }
 }
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await page.locator('#about').evaluate(n=>n.scrollIntoView({behavior:'instant'}));
 await page.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.currentSection==='about');
 assert.equal(await page.locator('#fresh-companion').count(),1);
 if([1366,390].includes(width))await page.locator('#about').screenshot({path:folder+'/about-photo-'+width+'.png',style:'[data-navigation],.skip-link,astro-dev-toolbar{visibility:hidden!important}'});
 results.push({width,panels:boxes,allTextVisible:true,overflow:false});
});
test('About panels alternate visibly while its heading stays static, and Pause restores readable final geometry',async t=>{
 const p=await open(t,1366,'no-preference');await p.waitForFunction(()=>document.querySelector('#about').dataset.aboutMotion==='active');
 const background=()=>p.locator('#about .section-heading,#about .section-echo,#about .section-depth-shape').evaluateAll(ns=>ns.map(n=>({transform:getComputedStyle(n).transform,opacity:getComputedStyle(n).opacity})));
 const a=await background();
 for(let i=0;i<4;i++){
  const panel=p.locator('#about .photo-story').nth(i),top=await panel.evaluate(n=>n.getBoundingClientRect().top+scrollY);
  await p.evaluate(top=>scrollTo({top,behavior:'instant'}),top-700);await p.waitForTimeout(200);
  const x=await panel.evaluate(n=>new DOMMatrix(getComputedStyle(n).transform).m41);
  assert.ok(x*(i%2===0?1:-1)>50);
  assert.deepEqual(await background(),a);
 }
 const ink=await p.locator('#home .hero-name').evaluate(n=>getComputedStyle(n).transform);
 await p.locator('[data-fresh-pause]').evaluate(n=>n.click());
 await p.waitForFunction(()=>document.querySelector('[data-fresh-pause]').getAttribute('aria-pressed')==='true');
 for(const n of await p.locator('#about .photo-story').all())assert.equal(await n.evaluate(n=>getComputedStyle(n).opacity),'1');
 assert.equal(await p.locator('#home .hero-name').evaluate(n=>getComputedStyle(n).transform),ink);
 assert.deepEqual(await background(),a);
});

test('No JavaScript exposes all four complete stories and correctly assigned photographs',async t=>{
 const p=await open(t,390,'reduce',{javaScriptEnabled:false});
 for(const [i,story]of original.entries()){
  const panel=p.locator('#about .photo-story').nth(i);
  assert.equal(await panel.locator('.story-detail').textContent(),story.detail);
  assert.ok(await panel.locator('.story-detail').isVisible());assert.ok(await panel.locator('img').isVisible());
 }
 assert.equal(await p.locator('#about summary,#about details').count(),0);
 assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
});
