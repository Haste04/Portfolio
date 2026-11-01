import assert from 'node:assert/strict';
import {before,after,test} from 'node:test';
import {harness,noDriver} from './helpers/scroll-reset.mjs';
let app;before(async()=>{app=await harness('.cache/living-canvas/edges',{development:true})});after(async()=>app?.close());
test('Leaving Contact cancels its native ripple and stops all offscreen animation clocks',async t=>{
 const p=await app.open(t,{mode:'development'});
 await p.locator('#contact').evaluate(n=>scrollTo({top:n.offsetTop+n.offsetHeight*.56-450,behavior:'instant'}));await p.waitForTimeout(250);
 const b=await p.locator('#contact [data-living-canvas]').boundingBox();await p.mouse.move(b.x+b.width*.5,b.y+b.height*.56);await p.waitForTimeout(60);
 assert.equal(await p.locator('[data-living-burst]').evaluate(n=>n.getAnimations().length),1);
 await p.evaluate(()=>scrollTo({top:0,behavior:'instant'}));await p.waitForTimeout(150);
 assert.equal(await p.locator('[data-living-burst]').evaluate(n=>n.getAnimations().length),0,'Offscreen native burst must cancel');
 const active=await p.locator('#contact [data-living-canvas]').evaluate(n=>n.getAnimations({subtree:true}).filter(a=>a.playState==='running').length);assert.equal(active,0);
});
test('Hero rotated ellipse reacts on its rendered outline after resizing',async t=>{
 const p=await app.open(t,{mode:'development'});
 for(const width of [1366,1920]){
  await p.setViewportSize({width,height:1080});await p.waitForTimeout(300);
  const ring=p.locator('.hero-scene .scene-orbit-depth > span').first();
  const point=await ring.evaluate(n=>{
   const r=n.getBoundingClientRect(),c=getComputedStyle(n),m=new DOMMatrix(c.transform);
   for(let i=0;i<64;i++){const a=i*Math.PI/32,v=new DOMPoint(n.offsetWidth/2*Math.cos(a),n.offsetHeight/2*Math.sin(a)).matrixTransform(m),x=r.x+r.width/2+v.x,y=r.y+r.height/2+v.y;if(x>30&&x<innerWidth-30&&y>200&&y<innerHeight-30)return{x,y}}
  });assert.ok(point);await p.mouse.move(point.x,point.y);await p.waitForTimeout(700);
  assert.ok(await ring.evaluate(n=>Number(n.style.getPropertyValue('--near'))>.9),'Visible rotated edge should be inside influence');
 }
});
test('Real mobile touch scroll stays native and never creates cursor influence',async t=>{
 const p=await app.open(t,{mode:'development',width:390,height:844,isMobile:true,hasTouch:true});
 const session=await p.context().newCDPSession(p);
 await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:18,y:700}]});
 for(const y of [620,540,460,380,300]){await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:18,y}]});await p.waitForTimeout(30)}
 await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(300);
 assert.ok(await p.evaluate(()=>scrollY>100));
 assert.equal(await p.locator('[data-living-target],[data-living-ring]').evaluateAll(ns=>ns.some(n=>Number(n.style.getPropertyValue('--near'))>0)),false);
 await noDriver(p);await session.detach();
});
test('Bfcache lifecycle removes old shared pointer listeners before reinstalling',async t=>{
 const p=await app.open(t,{mode:'development',init:()=>{
  window.livePointerListeners=0;const add=EventTarget.prototype.addEventListener,remove=EventTarget.prototype.removeEventListener;
  const registered=new WeakMap();
  EventTarget.prototype.addEventListener=function(type,fn,options){if(this===document&&type==='pointermove'){window.livePointerListeners++;registered.set(fn,true);options?.signal?.addEventListener('abort',()=>{if(registered.get(fn)){window.livePointerListeners--;registered.delete(fn)}},{once:true})}return add.call(this,type,fn,options)};
  EventTarget.prototype.removeEventListener=function(type,fn,options){if(this===document&&type==='pointermove'&&registered.get(fn)){window.livePointerListeners--;registered.delete(fn)}return remove.call(this,type,fn,options)};
 }});
 const count=await p.evaluate(()=>window.livePointerListeners);
 for(let i=0;i<3;i++)await p.evaluate(()=>{window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}))});
 await p.waitForTimeout(300);assert.equal(await p.evaluate(()=>window.livePointerListeners),count);
});

test('Keyboard resume reconciles pointer exit and preserves the lightweight animation tier',async t=>{
 const p=await app.open(t,{mode:'development'}),ring=p.locator('[data-living-ring]').first(),box=await ring.boundingBox();
 await p.mouse.move(box.x+20,Math.min(850,box.y+box.height/2));await p.waitForTimeout(700);
 assert.ok(await ring.evaluate(n=>Number(n.style.getPropertyValue('--near'))>.5));
 await p.locator('[data-fresh-pause]').evaluate(n=>n.click());await p.mouse.move(2,2);
 await p.locator('[data-fresh-pause]').focus();await p.keyboard.press('Enter');await p.waitForTimeout(850);
 assert.equal(await ring.evaluate(n=>Number(n.style.getPropertyValue('--near'))),0,'Resume must reconcile pointer changes without needing another mouse event');
 await p.setViewportSize({width:390,height:844});await p.waitForTimeout(200);
 const tier=await p.locator('#home [data-living-canvas]').getAttribute('data-tier');assert.equal(tier,'light');
 await p.locator('[data-fresh-pause]').evaluate(n=>n.click());
 assert.equal(await p.locator('#home [data-living-canvas]').getAttribute('data-tier'),tier,'Pause must not change durations by changing tiers');
});

test('Ambient CSS clocks resume after page restoration, not just controller flags',async t=>{
 const p=await app.open(t,{mode:'development'});await p.locator('#about').evaluate(n=>n.scrollIntoView({behavior:'instant'}));
 await p.waitForFunction(()=>document.querySelector('#about [data-living-canvas]').dataset.running==='true');
 const layer=p.locator('.living-light-breath');assert.equal(await layer.evaluate(n=>n.getAnimations().length),1);
 await p.evaluate(()=>{window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}))});
 await p.waitForFunction(()=>document.querySelector('#about [data-living-canvas]').dataset.running==='true');
 const before=await layer.evaluate(n=>n.getAnimations()[0]?.currentTime);assert.equal(typeof before,'number','A restored background still has an actual animation');
 await p.waitForTimeout(250);assert.ok(await layer.evaluate(n=>n.getAnimations()[0]?.currentTime)>before+100);
 await p.locator('#home').evaluate(n=>n.scrollIntoView({behavior:'instant'}));
 await p.waitForFunction(()=>document.querySelector('#home [data-living-canvas]').dataset.running==='true');
 await p.evaluate(()=>{window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}))});
 await p.waitForFunction(()=>document.querySelector('#home [data-living-canvas]').dataset.running==='true');
 const ring=p.locator('[data-living-ring]').first(),clock=()=>ring.evaluate(n=>n.getAnimations({subtree:true}).find(a=>a.animationName==='living-ring-breath')?.currentTime);
 const time=await clock();assert.equal(typeof time,'number');await p.waitForTimeout(250);assert.ok(await clock()>time+100);
 await p.locator('[data-fresh-pause]').evaluate(n=>n.click());await p.waitForTimeout(100);const frozen=await clock();await p.waitForTimeout(200);assert.equal(await clock(),frozen);
});
