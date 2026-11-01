import assert from 'node:assert/strict';
import {before,after,test} from 'node:test';
import {harness,noDriver,sections} from './helpers/scroll-reset.mjs';
let app;before(async()=>{app=await harness('.cache/living-canvas/browser',{development:true})});after(async()=>app?.close());
test('Hero reuses rings, responds meaningfully to a real pointer, springs back and isolates content',async t=>{
 const p=await app.open(t,{mode:'development'});const root=p.locator('#home [data-living-canvas]');
 await root.waitFor();await p.waitForFunction(()=>document.querySelector('#home [data-living-canvas]').dataset.running==='true');
 const heading=await p.locator('.hero-name').boundingBox();
 const ring=p.locator('[data-living-ring]').first(),box=await ring.boundingBox();
 await p.mouse.move(box.x+20,Math.min(850,box.y+box.height*.5));await p.waitForTimeout(800);
 const state=await ring.evaluate(n=>({near:Number(n.style.getPropertyValue('--near')),translate:getComputedStyle(n).translate}));
 assert.ok(state.near>.1,JSON.stringify(state));assert.notEqual(state.translate,'none');assert.ok(Math.abs(parseFloat(state.translate))>=4,'Hero response must move at least four pixels');
 const now=await p.locator('.hero-name').boundingBox();assert.ok(Math.abs(heading.x-now.x)<.5&&Math.abs(heading.y-now.y)<.5);
 await p.mouse.move(2,2);await p.waitForTimeout(850);assert.equal(await ring.evaluate(n=>Number(n.style.getPropertyValue('--near'))),0);
 await noDriver(p);app.measurements.push({hero:state});
});

for(const id of ['about','education','projects','tech-stack','experience','contact'])test(id+' has a distinct visible reactive layer behind content',async t=>{
 const p=await app.open(t,{mode:'development'});
 await p.locator('#'+id).evaluate(n=>scrollTo({top:n.offsetTop+200,behavior:'instant'}));await p.waitForTimeout(250);
 const root=p.locator('#'+id+' [data-living-canvas]');await p.waitForFunction(id=>document.querySelector('#'+id+' [data-living-canvas]').dataset.running==='true',id);
 const target=root.locator('[data-living-target]').first();assert.ok(await target.count());
 const before=await root.locator('[data-living-target]').evaluateAll(ns=>ns.map(n=>Number(getComputedStyle(n).opacity)));
 const b=await target.boundingBox();await p.mouse.move(Math.max(5,Math.min(1350,b.x+b.width*(id==='about' ? .65 : .5))),Math.max(5,Math.min(890,b.y+b.height/2)));await p.waitForTimeout(750);
 const states=await root.locator('[data-living-target]').evaluateAll(ns=>ns.map(n=>({near:Number(n.style.getPropertyValue('--near')),opacity:getComputedStyle(n).opacity})));
 assert.ok(states.some(n=>n.near>.1),JSON.stringify(states));
 if(id==='about')assert.notEqual(await target.evaluate(n=>getComputedStyle(n).translate),'0px');
 else assert.ok(states.some((n,i)=>Number(n.opacity)-before[i]>.025),'Rendered opacity must visibly respond');
 assert.equal(await root.evaluate(n=>getComputedStyle(n).pointerEvents),'none');await noDriver(p);app.measurements.push({id,states});
});

test('Pause freezes a running magnetic response, idle clocks, and hidden/offscreen effects suspend',async t=>{
 const p=await app.open(t,{mode:'development'}),ring=p.locator('[data-living-ring]').first();
 const b=await ring.boundingBox();await p.mouse.move(b.x+20,Math.min(850,b.y+b.height/2));await p.waitForTimeout(70);
 await p.locator('[data-fresh-pause]').evaluate(n=>n.click());await p.waitForTimeout(80);
 const a=await ring.evaluate(n=>getComputedStyle(n).translate);await p.waitForTimeout(320);
 assert.equal(await ring.evaluate(n=>getComputedStyle(n).translate),a,'In-flight spring response must freeze');
 assert.equal(await p.locator('[data-living-canvas][data-running="true"]').count(),0);
 await p.locator('[data-fresh-pause]').evaluate(n=>n.click());await p.waitForTimeout(800);
 await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});
 assert.equal(await p.locator('[data-living-canvas][data-running="true"]').count(),0);
 await p.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))});
 await p.locator('#contact').evaluate(n=>n.scrollIntoView({behavior:'instant'}));await p.waitForTimeout(250);
 assert.equal(await p.locator('#home [data-living-canvas]').getAttribute('data-running'),'false');
 assert.equal(await p.locator('#contact [data-living-canvas]').getAttribute('data-running'),'true');
});

test('Contact proximity creates one finite outward ripple with a cooldown',async t=>{
 const p=await app.open(t,{mode:'development'});await p.locator('#contact').evaluate(n=>scrollTo({top:n.offsetTop+n.offsetHeight*.56-450,behavior:'instant'}));await p.waitForTimeout(200);
 const root=p.locator('#contact [data-living-canvas]'),b=await root.boundingBox();
 await p.mouse.move(b.x+b.width*.5,b.y+b.height*.56);
 // A native animation may still have null startTime until its first browser frame.
 await p.waitForFunction(()=>typeof document.querySelector('#contact [data-living-burst]')?.getAnimations()[0]?.startTime==='number');
 const first=await root.locator('[data-living-burst]').evaluate(n=>n.getAnimations()[0]?.startTime);assert.equal(typeof first,'number');
 await p.mouse.move(b.x+b.width*.5+10,b.y+b.height*.56);await p.waitForTimeout(100);
 assert.equal(await root.locator('[data-living-burst]').evaluate(n=>n.getAnimations()[0]?.startTime),first);
 await p.waitForTimeout(1300);assert.equal(await root.locator('[data-living-burst]').evaluate(n=>n.getAnimations().length),0);
});

test('Reduced motion and touch input never synthesize a reactive cursor; idle has no RAF chain',async t=>{
 const p=await app.open(t,{mode:'development',init:()=>{window.livingFrames=0;const raf=window.requestAnimationFrame;window.requestAnimationFrame=fn=>raf(t=>{window.livingFrames++;fn(t)})}});
 await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.state==='idle');await p.waitForTimeout(500);
 const a=await p.evaluate(()=>window.livingFrames);await p.waitForTimeout(400);assert.equal(await p.evaluate(()=>window.livingFrames),a);
 await p.evaluate(()=>document.dispatchEvent(new PointerEvent('pointermove',{pointerType:'touch',clientX:800,clientY:400})));
 assert.equal(await p.locator('[data-living-ring]').first().evaluate(n=>Number(n.style.getPropertyValue('--near'))),0);
 await p.emulateMedia({reducedMotion:'reduce'});await p.waitForFunction(()=>!document.querySelector('[data-living-canvas][data-running="true"]'));
 assert.equal(await p.locator('[data-living-canvas][data-running="true"]').count(),0);
 assert.equal(await p.locator('.living-light-breath').evaluate(n=>getComputedStyle(n).animationName),'none');
});

test('Both palettes and six widths preserve backgrounds, static content, scrolling and foreground controls',async t=>{
 for(const theme of ['dark','light'])for(const width of [1920,1366,1024,768,390,320]){
  const p=await app.open(t,{mode:'development',colorScheme:theme,width,height:width===1920?1080:900});
  assert.equal(await p.locator('[data-living-canvas]').count(),7);
  for(const id of sections){
   await p.locator('#'+id).evaluate(n=>n.scrollIntoView({behavior:'instant'}));await p.waitForTimeout(100);
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,id+' '+width+' '+theme);
   assert.equal(await p.locator('#'+id+' h1,#'+id+' h2').evaluate(n=>getComputedStyle(n).opacity),'1');
   assert.equal(await p.locator('#'+id+' [data-living-canvas]').evaluate(n=>getComputedStyle(n).pointerEvents),'none');
   if([1366,390].includes(width)){
    await app.shot(p,theme+'-'+width+'-'+id+'-idle');
    await p.mouse.move(width*.7,440);await p.waitForTimeout(700);await app.shot(p,theme+'-'+width+'-'+id+'-reactive');
   }
  }
  if(width===1366){
   await p.locator('[data-education-next]').click();assert.equal(await p.locator('[data-education-panel]:visible').getAttribute('data-education-panel'),'kindergarten');
   await p.locator('[data-orbit-next]').click();await p.waitForFunction(()=>document.querySelector('[data-project-orbit]').dataset.orbitMoving==='false');assert.equal(await p.locator('[data-project]:visible').getAttribute('data-project'),'lifevent');
   await p.locator('button[data-technology="astro"]').focus();await p.keyboard.press('Enter');await p.waitForFunction(()=>document.querySelector('[data-tech-gallery]').dataset.galleryView==='focus');
   await p.locator('[data-tech-back]').click();await p.waitForFunction(()=>document.querySelector('[data-tech-gallery]').dataset.galleryView==='overview');
   await p.locator('[data-experience-preview="1"]').click();await p.waitForFunction(()=>document.querySelector('[data-experience]').dataset.experienceMode==='gallery');
   await p.locator('[data-experience-back]').click();
   assert.equal(await p.locator('#fresh-companion').count(),1);
  }
  await noDriver(p);app.measurements.push({theme,width,overflow:false});await p.context().close();
 }
});

test('Reinitialization restores exactly seven layers and no duplicate input controller',async t=>{
 const p=await app.open(t,{mode:'development'});
 await p.evaluate(()=>{window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}))});
 await p.waitForFunction(()=>document.querySelector('#home [data-living-canvas]').dataset.running==='true');
 assert.equal(await p.locator('[data-living-canvas]').count(),7);assert.equal(await p.locator('#fresh-companion').count(),1);
});
