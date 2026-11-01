import assert from 'node:assert/strict';
import {before,after,test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {harness,go,layers,sample,stable,noDriver,homeReady} from './helpers/scroll-reset.mjs';
let app;
before(async()=>app=await harness('.cache/hero-parallax-removal/browser',{development:true}));
after(async()=>app?.close());

test('Home keeps its approved final geometry after its once-only entrance at six widths in both themes',async t=>{
 const baseline=JSON.parse(await readFile('tests/fixtures/home-static-baseline.json','utf8'));
 for(const mode of ['development','production'])for(const theme of ['dark','light'])for(const width of [1920,1366,1024,768,390,320]){
  const p=await app.open(t,{mode,width,height:width===1920?1080:900,colorScheme:theme});
  const expected=baseline[mode][theme+'-'+width];
  for(const [selector,original]of Object.entries(expected)){
   const current=await p.locator(selector).evaluate(n=>{const r=n.getBoundingClientRect(),c=getComputedStyle(n);return{x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height,fontSize:c.fontSize,color:c.color,opacity:c.opacity}});
   for(const k of ['x','y','width','height'])assert.ok(Math.abs(current[k]-original[k])<1,mode+' '+theme+' '+width+' '+selector+' '+k+': '+current[k]+' != '+original[k]);
   for(const k of ['fontSize','color','opacity'])assert.equal(current[k],original[k],selector+' '+k);
  }
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await noDriver(p);
  await p.context().close();
 }
});

test('After its once-only entrance Home has no scroll departure or scroll fading in either theme',async t=>{
 for(const theme of ['dark','light']){
  const p=await app.open(t,{mode:'development',colorScheme:theme});
  const requests=[];p.on('request',r=>requests.push(r.url()));
  await p.reload({waitUntil:'networkidle'});await homeReady(p);await go(p,0);
  const selectors=[...layers.home,'.hero-introduction','.hero-actions','.scroll-cue','.mascot-stage'];
  const a=await sample(p,selectors);
  await app.shot(p,theme+'-desktop-top');
  for(const y of [360,650,1000,360,0]){
   await go(p,y);stable(a,await sample(p,selectors));
   if(y===360)await app.shot(p,theme+'-desktop-scroll');
  }
  assert.equal(requests.some(url=>/hero-depth/.test(url)),false);
  await noDriver(p);
  assert.equal(await p.locator('[data-living-ring]').count(),4);
  assert.equal(await p.locator('#fresh-companion').count(),1);
 }
});

test('Home CTA links remain keyboard accessible after scrolling and under Pause and reduced motion',async t=>{
 const p=await app.open(t,{mode:'development',width:390,height:900});
 for(const paused of [false,true]){
  if(paused)await p.locator('[data-fresh-pause]').click();
  for(const [selector,target]of [['.hero-actions a[href="#projects"]','projects'],['.hero-actions a[href="#contact"]','contact'],['.scroll-cue','about']]){
   await go(p,0);await p.locator(selector).focus();await p.keyboard.press('Enter');
   await p.waitForFunction(id=>location.hash==='#'+id,target);
  }
 }
 await p.emulateMedia({reducedMotion:'reduce'});await go(p,0);
 const a=await sample(p,layers.home);await go(p,360);stable(a,await sample(p,layers.home));
 await go(p,0);await app.shot(p,'mobile-top');await noDriver(p);
});
