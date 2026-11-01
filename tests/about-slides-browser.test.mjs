import assert from 'node:assert/strict';
import {before,after,test} from 'node:test';
import {harness,go,noDriver} from './helpers/scroll-reset.mjs';
let app;const mode=process.env.ABOUT_TEST_MODE??'development';
before(async()=>app=await harness('.cache/about-slides/browser',{development:true}));
after(async()=>app?.close());
const pose=panel=>panel.evaluate(n=>{const c=getComputedStyle(n),r=n.getBoundingClientRect();return{x:new DOMMatrix(c.transform).m41,opacity:Number(c.opacity),width:r.width,height:r.height,top:r.top+scrollY}});
for(const theme of ['dark','light'])test(theme+' whole About panels sweep right-left-right-left and finish before the reading area, reversing exactly',async t=>{
 const p=await app.open(t,{mode,colorScheme:theme,width:1366,height:900});
 for(let i=0;i<4;i++){
  const panel=p.locator('#about .photo-story').nth(i),initial=await pose(panel),start=initial.top-900,end=initial.top-495,sign=i%2===0?1:-1;
  await go(p,start+2);await p.waitForFunction(()=>document.querySelector('#about').dataset.aboutMotion==='active');
  const a=await pose(panel);assert.ok(a.x*sign>a.width*.55&&a.x*sign<a.width*.70,'Panel '+(i+1)+' has a pronounced '+(sign>0?'RIGHT':'LEFT')+' entrance: '+JSON.stringify(a));
  await go(p,(start+end)/2);const mid=await pose(panel);
  assert.ok(mid.x*sign>mid.width*.25&&mid.x*sign<mid.width*.38);assert.ok(mid.opacity>.5&&mid.opacity<.9);
  await go(p,end+2);const final=await pose(panel);
  assert.ok(Math.abs(final.x)<.5);assert.equal(final.opacity,1);
  assert.equal(final.width,initial.width);assert.equal(final.height,initial.height);
  await go(p,start+2);const reversed=await pose(panel);assert.ok(Math.abs(reversed.x-a.x)<1,'Reverse restores the same position');
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  app.measurements.push({theme,index:i,start,end,a,mid,final,reversed});
 }
 await noDriver(p);
});
test('About Pause/reduced motion exposes full panels, resume restores current scroll, and no JavaScript preserves content',async t=>{
 const p=await app.open(t,{mode}),panel=p.locator('#about .photo-story').first();
 const top=(await pose(panel)).top;await go(p,top-700);await p.waitForFunction(()=>document.querySelector('#about').dataset.aboutMotion==='active');
 assert.ok((await pose(panel)).x>50);
 await p.locator('[data-fresh-pause]').evaluate(n=>n.click());await p.waitForTimeout(100);
 assert.ok(Math.abs((await pose(panel)).x)<.5);assert.equal((await pose(panel)).opacity,1);
 await p.locator('[data-fresh-pause]').evaluate(n=>n.click());await p.waitForFunction(()=>document.querySelector('#about').dataset.aboutMotion==='active');
 assert.ok((await pose(panel)).x>50);
 await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(100);
 for(const n of await p.locator('#about .photo-story').all()){assert.ok(Math.abs((await pose(n)).x)<.5);assert.equal((await pose(n)).opacity,1)}
 const fallback=await app.open(t,{mode,javaScriptEnabled:false,width:390});
 assert.equal(await fallback.locator('#about .story-detail:visible').count(),4);
 for(const n of await fallback.locator('#about .photo-story').all()){assert.ok(Math.abs((await pose(n)).x)<.5);assert.equal((await pose(n)).opacity,1)}
});
test('Six responsive widths retain final photo geometry and bounded horizontal entrances in both themes',async t=>{
 for(const theme of ['dark','light'])for(const width of [1920,1366,1024,768,390,320]){
  const height=width===1920?1080:900,p=await app.open(t,{mode,colorScheme:theme,width,height});
  const panel=p.locator('#about .photo-story').first(),initial=await pose(panel);
  await go(p,initial.top-height+2);await p.waitForFunction(()=>document.querySelector('#about').dataset.aboutMotion==='active');const entry=await pose(panel);
  const fraction=entry.x/entry.width;
  assert.ok(width>=1024?fraction>.55&&fraction<.70:fraction>.15&&fraction<.45,JSON.stringify({width,fraction}));
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await go(p,initial.top-height*.5);const final=await pose(panel);
  assert.ok(Math.abs(final.x)<.5);assert.equal(final.opacity,1);
  assert.equal(final.width,initial.width);assert.equal(final.height,initial.height);
  assert.equal(await p.locator('#about .story-detail:visible').count(),4);
  await noDriver(p);await p.context().close();
 }
});

test('About lifecycle does not accumulate orientation listeners or run idle frame chains',async t=>{
 const p=await app.open(t,{mode,init:()=>{
  window['__aboutFrames']=0;const raf=requestAnimationFrame;window.requestAnimationFrame=f=>raf(time=>{window['__aboutFrames']++;f(time)});
  const match=window.matchMedia.bind(window);window['__aboutOrientation']=[];
  window.matchMedia=query=>{
   const mq=match(query);
   if(query==='(orientation: portrait)'){
    const addKey='add'+'Listener',removeKey='remove'+'Listener';
    const listeners=new Set(),add=mq[addKey],remove=mq[removeKey];window['__aboutOrientation'].push(listeners);
    mq[addKey]=f=>{listeners.add(f);return add.call(mq,f)};
    mq[removeKey]=f=>{listeners.delete(f);return remove.call(mq,f)};
   }
   return mq;
  };
 }});
 const panel=p.locator('#about .photo-story').first(),top=(await pose(panel)).top;
 await go(p,top-700);await p.waitForFunction(()=>document.querySelector('#about').dataset.aboutMotion==='active');
 const count=()=>p.evaluate(()=>window['__aboutOrientation'].reduce((sum,set)=>sum+set.size,0));
 const initial=await count();
 for(let i=0;i<3;i++){
  await p.locator('[data-fresh-pause]').evaluate(n=>n.click());await p.waitForFunction(()=>document.querySelector('#about').dataset.aboutMotion==='paused');
  await p.locator('[data-fresh-pause]').evaluate(n=>n.click());await p.waitForFunction(()=>document.querySelector('#about').dataset.aboutMotion==='active');
 }
 assert.equal(await count(),initial,'No new surviving plugin orientation listeners after Pause cycles');
 await p.waitForTimeout(800);const frames=await p.evaluate(()=>window['__aboutFrames']);await p.waitForTimeout(350);
 assert.equal(await p.evaluate(()=>window['__aboutFrames']),frames,'Visible resting About has no perpetual JS frame chain');
});
test('A failure after tween setup restores all original static panel styles',async t=>{
 const p=await app.open(t,{mode:'development',beforeLoad:page=>page.route(/\/src\/scripts\/about-slides\/engine\.ts(?:\?|$)/,async route=>{
  const response=await route.fetch(),body=await response.text();
  assert.match(body,/ScrollTrigger\.refresh\(\);/,'Fixture targets the actual setup refresh boundary');
  await route.fulfill({response,body:body.replace(/ScrollTrigger\.refresh\(\);/,'throw new Error("Injected setup failure");')});
 })});
 const panel=p.locator('#about .photo-story').first(),top=(await pose(panel)).top;
 await go(p,top-700);await p.waitForFunction(()=>document.querySelector('#about').dataset.aboutMotion==='fallback');
 for(const n of await p.locator('#about .photo-story').all()){
  assert.ok(Math.abs((await pose(n)).x)<.5,'Failed setup must clean its partial transform');assert.equal((await pose(n)).opacity,1);
 }
});

test('Resizing and theme changes keep scrub progress aligned with the actual panel viewport position',async t=>{
 const p=await app.open(t,{mode,width:1366,height:900}),panel=p.locator('#about .photo-story').first();
 const top=(await pose(panel)).top;await go(p,top-700);await p.waitForFunction(()=>document.querySelector('#about').dataset.aboutMotion==='active');
 await go(p,top-600);await p.setViewportSize({width:390,height:900});await p.waitForTimeout(250);
 const verify=async()=>{
  const current=await pose(panel),viewportTop=current.top-await p.evaluate(()=>scrollY);
  const progress=Math.max(0,Math.min(1,(900-viewportTop)/405));
  const distance=Math.min(current.width*.24,390*.22),expected=distance*(1-progress);
  assert.ok(Math.abs(current.x-expected)<1,JSON.stringify({current,viewportTop,expected}));
 };
 await verify();
 await p.locator('[data-theme-toggle]').evaluate(n=>n.click());
 await p.waitForFunction(()=>!document.documentElement.hasAttribute('data-theme-revealing')&&document.querySelector('#about').dataset.aboutMotion==='active');
 await verify();
});

test('A height-only viewport resize recalculates the reading-area scrub boundaries',async t=>{
 const p=await app.open(t,{mode,width:1366,height:900}),panel=p.locator('#about .photo-story').first();
 const top=(await pose(panel)).top;
 await go(p,top-700);await p.waitForFunction(()=>document.querySelector('#about').dataset.aboutMotion==='active');
 await go(p,top-600);
 await p.setViewportSize({width:1366,height:700});await p.waitForTimeout(250);
 const current=await pose(panel),viewportTop=current.top-await p.evaluate(()=>scrollY);
 const progress=Math.max(0,Math.min(1,(700-viewportTop)/(700*.45)));
 const distance=await panel.evaluate(n=>n.offsetWidth*.62),expected=distance*(1-progress);
 assert.ok(Math.abs(current.x-expected)<1,JSON.stringify({current,viewportTop,expected}));
});
