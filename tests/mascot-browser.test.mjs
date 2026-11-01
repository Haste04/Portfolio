import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
import { createServer } from 'node:http';
import { readFile, stat, mkdir, writeFile } from 'node:fs/promises';
import { resolve, join, extname, sep } from 'node:path';
import { chromium } from 'playwright-core';
const artifacts=resolve('.cache/phase3-verification'), root=resolve('dist'), errors=[];
const evidence={};
let server,browser,context,base;
before(async()=>{
 await mkdir(artifacts,{recursive:true});
 server=createServer(async(req,res)=>{try{let file=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(file!==root&&!file.startsWith(root+sep))throw Error();if((await stat(file)).isDirectory())file=join(file,'index.html');res.writeHead(200,{'Content-Type':({'.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.woff2':'font/woff2','.pdf':'application/pdf'})[extname(file)]??'application/octet-stream'});res.end(await readFile(file))}catch{res.writeHead(404);res.end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;
 context=await chromium.launchPersistentContext(resolve('.cache/mascot-browser-profile'),{channel:'msedge',headless:true,args:['--no-first-run','--disable-background-networking']});browser=context.browser();
});
after(async()=>{if(browser)await writeFile(join(artifacts,'results.json'),JSON.stringify({browser:browser.version(),errors,...evidence},null,2));await context?.close();if(server)await new Promise(r=>server.close(r));assert.deepEqual(errors,[],'Unexpected browser errors');});
async function open(t,options={}){const ctx=await browser.newContext({colorScheme:'dark',viewport:{width:1366,height:900},reducedMotion:'no-preference',...options});t.after(()=>ctx.close());const p=await ctx.newPage();p.setDefaultTimeout(6000);p.setDefaultNavigationTimeout(15000);p.on('pageerror',e=>errors.push(e.message));await p.goto(base,{waitUntil:'networkidle'});return p}
async function idle(p){await p.waitForFunction(()=>document.querySelector('#fresh-companion')?.getAttribute('data-state')==='idle')}
test('one shared character completes its entrance and keyboard reactions',async t=>{
 const p=await open(t);assert.equal(await p.locator('#fresh-companion').count(),1);await idle(p);
 assert.equal(await p.locator('#fresh-companion').getAttribute('data-pose'),'default-sitting');
 await p.locator('[data-fresh-actor]').focus();await p.keyboard.press('Enter');
 await p.waitForFunction(()=>document.querySelector('#fresh-companion')?.getAttribute('data-pose')==='surprised');
 await p.locator('[data-fresh-pet]').click();
 await p.waitForFunction(()=>document.querySelector('#fresh-companion')?.getAttribute('data-pose')==='happy-content');
 assert.equal(errors.length,0);
});

test('click escalation rejects drag-generated clicks and respects swipe cooldown',async t=>{
 const p=await open(t);await idle(p);const actor=p.locator('[data-fresh-actor]');
 await actor.click();await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.pose==='surprised');
 await actor.click();await actor.click();await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.pose==='annoyed');
 await actor.click();await actor.click();await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.pose==='paw-swipe');
 await actor.click();assert.equal(await p.locator('#fresh-companion').getAttribute('data-pose'),'paw-swipe');
});
test('gentle multi-pass cursor strokes trigger happy, incidental hover does not',async t=>{
 const p=await open(t);await idle(p);const a=await p.locator('[data-fresh-actor]').boundingBox();
 const cx=a.x+a.width/2,cy=a.y+a.height*.5;
 await p.mouse.move(cx-60,cy);await p.waitForTimeout(150);
 assert.notEqual(await p.locator('#fresh-companion').getAttribute('data-state'),'petting');
 await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.pose==='curious-lean');await p.waitForTimeout(180);await p.screenshot({path:join(artifacts,'hero-curious.png')});
 // Reset the hover sample after screenshot capture, then send deliberate strokes inside the approved two-second window.
 await p.mouse.move(a.x-12,cy);const strokeStart=await p.evaluate(()=>performance.now());
 for(const x of [cx-45,cx,cx+45,cx,cx-45,cx,cx+45]){
   await p.waitForTimeout(75);await p.mouse.move(x,cy);
 }
 const strokeDuration=await p.evaluate(()=>performance.now())-strokeStart;
 assert.ok(strokeDuration<2000,'Test strokes must fit the recognition window: '+strokeDuration);
 await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.pose==='happy-content');
 await p.waitForTimeout(180);await p.screenshot({path:join(artifacts,'hero-petting.png')});
});
test('toss bounces, waits, springs to its anchor and stops frame work',async t=>{
 const p=await open(t);await idle(p);const actor=p.locator('[data-fresh-actor]');const origin=await actor.boundingBox();
 await p.evaluate(()=>{window.__states=[];new MutationObserver(()=>window.__states.push(document.querySelector('#fresh-companion').dataset.state)).observe(document.querySelector('#fresh-companion'),{attributes:true,attributeFilter:['data-state']})});
 await p.mouse.move(origin.x+origin.width*.5,origin.y+origin.height*.5);await p.mouse.down();
 await p.mouse.move(origin.x+origin.width*.5-80,origin.y+origin.height*.5-90,{steps:10});
 assert.equal(await p.locator('#fresh-companion').getAttribute('data-state'),'dragging');
 await p.mouse.up();
 try{await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.pose==='falling-tossed')}catch(error){throw new Error('Toss pose timeout: '+JSON.stringify(await p.evaluate(()=>({host:{...document.querySelector('#fresh-companion').dataset},states:window.__states,hidden:document.hidden}))),{cause:error})}
 await p.waitForTimeout(170);await p.screenshot({path:join(artifacts,'hero-toss.png')});
 await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.state==='idle',null,{timeout:10000});
 const end=await actor.boundingBox();assert.ok(Math.abs(end.x-origin.x)<1&&Math.abs(end.y-origin.y)<1);
 const states=await p.evaluate(()=>window.__states);
 for(const state of ['airborne','bouncing','settling','returning'])assert.ok(states.includes(state),state+' absent: '+states);
 assert.equal(states.includes('reacting'),false);
 assert.equal(await p.locator('#fresh-companion').getAttribute('data-frame-active'),'false');
});
test('Escape and section changes safely cancel active physics',async t=>{
 const p=await open(t);await idle(p);
 async function toss(){const a=await p.locator('[data-fresh-actor]').boundingBox();await p.mouse.move(a.x+a.width*.5,a.y+a.height*.5);await p.mouse.down();await p.mouse.move(a.x+a.width*.5+55,a.y+a.height*.5-75,{steps:5});await p.mouse.up();}
 await toss();await p.keyboard.press('Escape');await idle(p);
 assert.equal(await p.locator('#fresh-companion').getAttribute('data-frame-active'),'false');
 await toss();await p.locator('#about').evaluate(n=>n.scrollIntoView({behavior:'instant'}));
 await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.currentSection==='about');
 assert.equal(await p.locator('#fresh-companion').getAttribute('data-frame-active'),'false');
});
test('one companion follows forward, rapid and reverse section navigation',async t=>{
 const p=await open(t,{reducedMotion:'reduce'});
 for(const id of ['about','education','projects','tech-stack','experience','contact','tech-stack','about','home']){
  await p.locator('#'+id).evaluate(n=>n.scrollIntoView({behavior:'instant'}));
  await p.waitForFunction(id=>document.querySelector('#fresh-companion').dataset.currentSection===id,id);
  assert.equal(await p.locator('#fresh-companion').count(),1);
 }
 await p.evaluate(()=>{for(const id of ['projects','contact','about','home'])document.getElementById(id).scrollIntoView({behavior:'instant'})});
 await p.waitForTimeout(400);assert.equal(await p.locator('#fresh-companion').getAttribute('data-current-section'),'home');
});
test('contact bedtime can be interrupted and restarts cleanly on return',async t=>{
 const p=await open(t);await idle(p);
 async function contact(){await p.locator('[data-fresh-dock="contact"]').scrollIntoViewIfNeeded();await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.currentSection==='contact');}
 await contact();await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.pose==='walking');
 await p.locator('[data-fresh-actor]').click();await idle(p);await p.waitForTimeout(3300);
 assert.notEqual(await p.locator('#fresh-companion').getAttribute('data-pose'),'sleeping-curl');
 await p.locator('#about').evaluate(n=>n.scrollIntoView({behavior:'instant'}));
 await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.currentSection==='about');
 await contact();await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.pose==='stretching');
 await p.waitForTimeout(180);await p.screenshot({path:join(artifacts,'contact-stretching.png')});
 await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.pose==='sleeping-curl');
 await p.waitForTimeout(180);await p.screenshot({path:join(artifacts,'contact-sleeping.png')});
 assert.equal(await p.locator('#contact a[download]').isVisible(),true);
 await p.locator('#education').evaluate(n=>n.scrollIntoView({behavior:'instant'}));
 await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.currentSection==='education');
 await p.waitForTimeout(1500);assert.notEqual(await p.locator('#fresh-companion').getAttribute('data-pose'),'sleeping-curl');
});
test('pause freezes motion and reduced-motion disables physical tossing',async t=>{
 const p=await open(t);await idle(p);const actor=p.locator('[data-fresh-actor]'),a=await actor.boundingBox();
 await p.mouse.move(a.x+a.width/2,a.y+a.height/2);await p.mouse.down();await p.mouse.move(a.x+a.width/2-70,a.y+a.height/2-80,{steps:5});await p.mouse.up();
 await p.locator('[data-fresh-pause]').click();
 assert.equal(await p.locator('#fresh-companion').getAttribute('data-paused'),'true');
 assert.equal(await p.locator('#fresh-companion').getAttribute('data-frame-active'),'false');
 assert.equal(await p.locator('[data-fresh-pause]').getAttribute('aria-pressed'),'true');
 assert.equal(await p.locator('#fresh-companion').evaluate(n=>getComputedStyle(n).transitionDuration),'0s','Pause also disables section opacity transitions');
 assert.equal(await p.locator('.fresh-breath').evaluate(n=>getComputedStyle(n).animationName),'none');
 const stopped=await actor.boundingBox();
 await p.waitForTimeout(250);
 const still=await actor.boundingBox();assert.ok(Math.abs(still.x-stopped.x)<1&&Math.abs(still.y-stopped.y)<1,'Paused actor must remain still');
 await p.locator('[data-fresh-pause]').click();await idle(p);
 const resumed=await actor.boundingBox();assert.ok(Math.abs(resumed.x-stopped.x)<1&&Math.abs(resumed.y-stopped.y)<1,'Resume must not restore stale toss coordinates');
 await p.emulateMedia({reducedMotion:'reduce'});
 await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.tier==='C');
 assert.equal(await p.locator('#fresh-companion').getAttribute('data-tier'),'C');
 const box=await actor.boundingBox();await p.mouse.move(box.x+box.width/2,box.y+box.height/2);await p.mouse.down();await p.mouse.move(box.x+box.width/2+40,box.y+box.height/2-40,{steps:5});await p.mouse.up();
 assert.equal(await p.locator('#fresh-companion').getAttribute('data-frame-active'),'false');
 assert.notEqual(await p.locator('#fresh-companion').getAttribute('data-state'),'airborne');
 await p.locator('[data-fresh-pet]').click();await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.pose==='happy-content');
});
test('all six widths contain the mascot, its controls and correctly scaled artwork',async t=>{
 for(const [width,height] of [[1920,1080],[1366,900],[1024,768],[768,1024],[390,844],[320,720]]){
  const p=await open(t,{viewport:{width,height},reducedMotion:'reduce'});
  await p.locator('[data-fresh-dock="home"]').scrollIntoViewIfNeeded();await idle(p);
  await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.pose==='default-sitting');
  const result=await p.evaluate(()=>{
    const stage=document.querySelector('.fresh-playground').getBoundingClientRect(),actor=document.querySelector('[data-fresh-actor]').getBoundingClientRect(),img=document.querySelector('[data-fresh-layer]:not([hidden]) img'),b=img.getBoundingClientRect();
    const controls=[...document.querySelectorAll('.fresh-controls button')].map(n=>n.getBoundingClientRect());
    return {overflow:document.documentElement.scrollWidth>innerWidth,contained:actor.left>=stage.left&&actor.right<=stage.right+1&&actor.top>=stage.top&&actor.bottom<=stage.bottom+1,ratio:b.width/b.height,natural:Number(img.getAttribute('width'))/Number(img.getAttribute('height')),controls:controls.every(r=>r.width>=44&&r.height>=44&&r.left>=0&&r.right<=innerWidth)};
  });
  assert.equal(result.overflow,false,'Overflow at '+width);assert.equal(result.contained,true,'Bounds at '+width);assert.equal(result.controls,true,'Controls at '+width);assert.ok(Math.abs(result.ratio-result.natural)<.01);
  await p.screenshot({path:join(artifacts,'hero-default-'+width+'.png')});await p.close();
 }
});

test('real inactivity timers sleep and wake without stale callbacks',async t=>{
 const ctx=await browser.newContext({colorScheme:'dark',viewport:{width:1366,height:900},reducedMotion:'no-preference'});t.after(()=>ctx.close());
 const p=await ctx.newPage();p.setDefaultTimeout(6000);p.on('pageerror',e=>errors.push(e.message));await p.clock.install();await p.goto(base,{waitUntil:'networkidle'});await idle(p);
 await p.locator('[data-fresh-reset]').click();
 await p.clock.fastForward(30050);await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.pose==='sleepy');
 await p.clock.fastForward(15000);await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.pose==='yawning');
 await p.clock.fastForward(15000);await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.pose==='sleeping-curl');
 await p.waitForTimeout(180);await p.screenshot({path:join(artifacts,'hero-sleeping.png')});
 await p.locator('[data-fresh-actor]').click();await idle(p);
 await p.clock.fastForward(15000);assert.notEqual(await p.locator('#fresh-companion').getAttribute('data-state'),'sleeping');
});
test('hidden-tab signal suspends active physics and excludes hidden inactivity time',async t=>{
 const ctx=await browser.newContext({colorScheme:'dark',viewport:{width:1366,height:900}});t.after(()=>ctx.close());
 const p=await ctx.newPage();p.setDefaultTimeout(6000);p.on('pageerror',e=>errors.push(e.message));await p.clock.install();await p.goto(base,{waitUntil:'networkidle'});await idle(p);
 const a=await p.locator('[data-fresh-actor]').boundingBox();await p.mouse.move(a.x+a.width/2,a.y+a.height/2);await p.mouse.down();await p.mouse.move(a.x+a.width/2+55,a.y+a.height/2-80,{steps:5});await p.mouse.up();
 // Headless visibility is controlled explicitly; this exercises the real lifecycle handler.
 await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});
 assert.equal(await p.locator('#fresh-companion').getAttribute('data-frame-active'),'false');
 assert.equal(await p.locator('.fresh-breath').evaluate(n=>getComputedStyle(n).animationName),'none');
 await p.clock.fastForward(70000);assert.notEqual(await p.locator('#fresh-companion').getAttribute('data-state'),'sleeping');
 await p.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))});
 await idle(p);assert.notEqual(await p.locator('#fresh-companion').getAttribute('data-pose'),'sleeping-curl');
});
test('touch swipe scrolls the page while tap and Pet remain available',async t=>{
 const p=await open(t,{viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 await p.locator('[data-fresh-dock="home"]').scrollIntoViewIfNeeded();await idle(p);
 assert.match(await p.locator('[data-fresh-actor]').evaluate(n=>getComputedStyle(n).touchAction),/pan-y/);
 const a=await p.locator('[data-fresh-actor]').boundingBox();const session=await p.context().newCDPSession(p);
 const start=await p.evaluate(()=>scrollY),x=a.x+a.width/2,y=a.y+a.height/2;
 await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
 for(let step=1;step<=7;step++){await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-step*18}]});await p.waitForTimeout(25)}
 await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(300);
 assert.ok(await p.evaluate(()=>scrollY)>start+40,'Native page did not scroll from a swipe on the mascot');
 assert.equal(await p.locator('#fresh-companion').getAttribute('data-frame-active'),'false');
 await p.locator('[data-fresh-dock="home"]').scrollIntoViewIfNeeded();await idle(p);
 await p.locator('[data-fresh-pet]').tap();await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.pose==='happy-content');
 await p.screenshot({path:join(artifacts,'mobile-pet.png')});
});
test('initial requests are limited and original character libraries are never fetched',async t=>{
 const ctx=await browser.newContext({colorScheme:'dark',viewport:{width:1366,height:900}});t.after(()=>ctx.close());const p=await ctx.newPage(),requests=[];
 p.on('request',r=>requests.push(new URL(r.url()).pathname));await p.goto(base,{waitUntil:'networkidle'});await idle(p);
 const images=[...new Set(requests.filter(u=>u.startsWith('/assets/mr-fresh/')))];
 evidence.initialMascotRequests=images;
 evidence.initialMascotEncodedBytes=await p.evaluate(()=>performance.getEntriesByType('resource').filter(e=>e.name.includes('/assets/mr-fresh/')).reduce((s,e)=>s+e.encodedBodySize,0));
 assert.ok(images.length<=4,'Too many initial mascot states: '+images);
 assert.ok(!requests.some(u=>/^\/mr-fresh\//.test(u)));
 assert.equal(await p.locator('#fresh-companion').count(),1);
});
test('changing reduced motion during a toss stops frame work immediately',async t=>{
 const p=await open(t);await idle(p);const a=await p.locator('[data-fresh-actor]').boundingBox();
 await p.mouse.move(a.x+a.width/2,a.y+a.height/2);await p.mouse.down();await p.mouse.move(a.x+a.width/2-70,a.y+a.height/2-90,{steps:5});await p.mouse.up();
 await p.emulateMedia({reducedMotion:'reduce'});await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.tier==='C');
 assert.equal(await p.locator('#fresh-companion').getAttribute('data-frame-active'),'false');
 await p.waitForTimeout(1250);
 assert.equal(await p.locator('#fresh-companion').getAttribute('data-frame-active'),'false','A delayed spring return must not restart motion in Tier C');
});

test('leaving Contact during bedtime cancels pending poses and returning starts again',async t=>{
 const p=await open(t);await idle(p);
 await p.locator('[data-fresh-dock="contact"]').scrollIntoViewIfNeeded();
 await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.pose==='walking');
 await p.locator('#about').evaluate(n=>n.scrollIntoView({behavior:'instant'}));
 await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.currentSection==='about');
 await p.waitForTimeout(3500);
 assert.equal(await p.locator('#fresh-companion').getAttribute('data-pose'),'peeking');
 await p.locator('[data-fresh-dock="contact"]').scrollIntoViewIfNeeded();
 await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.pose==='sleeping-curl');
});
test('page lifecycle cleanup supports a single restored controller and cancels pending work',async t=>{
 const p=await open(t);await idle(p);
 await p.locator('[data-fresh-pet]').click();
 await p.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true})));
 assert.equal(await p.locator('#fresh-companion').getAttribute('data-ready'),'false');
 assert.equal(await p.locator('#fresh-companion').getAttribute('data-frame-active'),'false');
 await p.waitForTimeout(1500);assert.equal(await p.locator('#fresh-companion').getAttribute('data-state'),'idle');
 await p.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));
 await idle(p);assert.equal(await p.locator('#fresh-companion').count(),1);
 await p.locator('[data-fresh-actor]').scrollIntoViewIfNeeded();
 await p.locator('[data-fresh-actor]').focus();
 // Restored controllers start idle before their visibility observer runs. Focus can scroll the stage into view and start entrance.
 await p.waitForFunction(()=>{const n=document.querySelector('#fresh-companion');return n.dataset.state==='idle'&&n.dataset.pose==='default-sitting'&&n.dataset.visible==='true'});
 await p.keyboard.press('Enter');
 await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.pose==='surprised');
 assert.equal(await p.locator('#fresh-companion').getAttribute('data-ready'),'true');
});
test('one central project dock and technology reactions preserve content controls',async t=>{
 const p=await open(t,{reducedMotion:'reduce'});
 for(const id of ['anthea','lifevent','seek-first-books','philchan-cebu']){
  await p.locator('[data-orbit-item="'+id+'"]').click();
  const dock=p.locator('[data-fresh-dock="project-orbit"]');await dock.scrollIntoViewIfNeeded();
  await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.dock==='project-orbit');
  const safe=await p.evaluate(id=>{
   const fresh=document.querySelector('#fresh-companion').getBoundingClientRect(),links=[...document.querySelectorAll('#project-'+id+' a, #project-'+id+' summary')];
   return links.every(n=>{const r=n.getBoundingClientRect();return r.right<=fresh.left||r.left>=fresh.right||r.bottom<=fresh.top||r.top>=fresh.bottom});
  },id);assert.equal(safe,true,'Mascot overlaps project controls: '+id);
 }
 await p.locator('#tech-stack .toolkit-stage').evaluate(n=>n.scrollIntoView({behavior:'instant',block:'start'}));
 await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.currentSection==='tech-stack');
 await p.locator('button[data-technology="astro"]').focus();
 await p.keyboard.press('Enter');
 assert.equal(await p.locator('[data-connection="astro"]').isVisible(),true);
 await p.locator('[data-tech-back]').click();
 await p.locator('#tech-stack .toolkit-stage').evaluate(n=>n.scrollIntoView({behavior:'instant',block:'start'}));
 await p.waitForFunction(()=>{const n=document.querySelector('#fresh-companion');return n.dataset.visible==='true'&&n.dataset.paused==='false'&&n.dataset.state==='idle'});
 await p.locator('button[data-technology="react"]').click();
 await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.pose==='paw-swipe');
 assert.equal(await p.locator('[data-connection="react"]').isVisible(),true);
});
test('all section docks keep touch controls clear of links at narrow and wide layouts',async t=>{
 for(const [width,height] of [[1920,1080],[1366,900],[1024,768],[768,1024],[390,844],[320,720]]){
  const p=await open(t,{viewport:{width,height},reducedMotion:'reduce'});
  for(const id of ['about','education','tech-stack','experience','contact']){
   await p.locator('#'+id).evaluate(n=>n.scrollIntoView({behavior:'instant'}));
   await p.waitForFunction(id=>document.querySelector('#fresh-companion').dataset.currentSection===id,id);
   await p.locator('[data-fresh-dock="'+id+'"]').scrollIntoViewIfNeeded();
   try{await p.waitForFunction(id=>document.querySelector('#fresh-companion').dataset.currentSection===id,id);}catch(error){const info=await p.evaluate(id=>({active:document.querySelector('.desktop-navigation [aria-current]')?.getAttribute('href'),mascot:document.querySelector('#fresh-companion').dataset.currentSection,sectionTop:document.getElementById(id).getBoundingClientRect().top,line:innerHeight*.35,dock:document.querySelector('[data-fresh-dock=\"'+id+'\"]').getBoundingClientRect().toJSON()}),id);throw new Error(id+' at '+width+': '+JSON.stringify(info),{cause:error});}
   const safe=await p.evaluate(()=>{
    const buttons=[...document.querySelectorAll('.fresh-controls button')].map(n=>n.getBoundingClientRect());
    const active=document.querySelector('#fresh-companion'),r=active.getBoundingClientRect();
    const clickable=[...document.querySelectorAll('main a, main summary')].filter(n=>!active.contains(n));
    return {overflow:document.documentElement.scrollWidth>innerWidth,buttons:buttons.every(b=>b.width>=44&&b.height>=44&&b.left>=0&&b.right<=innerWidth),overlap:clickable.some(n=>{const b=n.getBoundingClientRect();return b.width>0&&b.height>0&&!(b.right<=r.left||b.left>=r.right||b.bottom<=r.top||b.top>=r.bottom)})};
   });
   assert.equal(safe.overflow,false,id+' '+width);assert.equal(safe.buttons,true,id+' controls '+width);assert.equal(safe.overlap,false,id+' overlaps controls '+width);
  }await p.close();
 }
});

test('sleeping survives hidden and paused periods without exhausting future inactivity',async t=>{
 const ctx=await browser.newContext({colorScheme:'dark',viewport:{width:1366,height:900},reducedMotion:'reduce'});t.after(()=>ctx.close());
 const p=await ctx.newPage();p.setDefaultTimeout(6000);p.on('pageerror',e=>errors.push(e.message));await p.clock.install();await p.goto(base,{waitUntil:'networkidle'});await idle(p);
 await p.locator('[data-fresh-reset]').click();await p.clock.fastForward(60050);
 await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.pose==='sleeping-curl');
 await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});
 await p.clock.fastForward(90000);
 await p.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))});
 await p.waitForTimeout(200);
 assert.equal(await p.locator('#fresh-companion').getAttribute('data-pose'),'sleeping-curl','Sleeping must survive tab suspension');
 await p.locator('[data-fresh-pause]').click();await p.clock.fastForward(60000);await p.locator('[data-fresh-pause]').click();
 await p.waitForTimeout(200);
 assert.equal(await p.locator('#fresh-companion').getAttribute('data-pose'),'sleeping-curl');
 await p.locator('[data-fresh-actor]').click();await idle(p);
 await p.clock.fastForward(30050);await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.pose==='sleepy');
});
test('a queued destination cannot replace a visible toss before it completes',async t=>{
 const p=await open(t);await idle(p);const a=await p.locator('[data-fresh-actor]').boundingBox();
 await p.mouse.move(a.x+a.width/2,a.y+a.height/2);await p.mouse.down();await p.mouse.move(a.x+a.width/2-70,a.y+a.height/2-95,{steps:5});await p.mouse.up();
 // Feed the controller a new navigation destination while keeping its physical stage visible.
 await p.evaluate(()=>{for(const link of document.querySelectorAll('.desktop-navigation a'))link.removeAttribute('aria-current');document.querySelector('.desktop-navigation a[href="#about"]').setAttribute('aria-current','location')});
 await p.waitForTimeout(250);
 assert.equal(await p.locator('#fresh-companion').getAttribute('data-current-section'),'home','Visible physics owns the stage until completion');
 assert.ok(['airborne','bouncing','settling','returning'].includes(await p.locator('#fresh-companion').getAttribute('data-state')));
 await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.currentSection==='about',null,{timeout:10000});
 assert.equal(await p.locator('#fresh-companion').getAttribute('data-frame-active'),'false');
});

test('review screenshots show the complete desktop and mobile Hero plus Contact bedtime',async t=>{
 const p=await open(t,{viewport:{width:1366,height:1100}});
 await idle(p);await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.pose==='default-sitting');await p.waitForTimeout(200);
 await p.screenshot({path:join(artifacts,'review-hero-desktop.png')});
 await p.locator('#contact').evaluate(n=>n.scrollIntoView({behavior:'instant'}));
 await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.pose==='sleeping-curl');await p.waitForTimeout(200);
 await p.screenshot({path:join(artifacts,'review-contact-desktop.png')});
 const mobile=await open(t,{viewport:{width:390,height:1400},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 await idle(mobile);await mobile.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.pose==='default-sitting');
 await mobile.screenshot({path:join(artifacts,'review-hero-mobile.png')});
});

test('technology activity resets sleep even if its reaction is suspended immediately',async t=>{
 const ctx=await browser.newContext({colorScheme:'dark',viewport:{width:1366,height:1100},reducedMotion:'reduce'});t.after(()=>ctx.close());
 const p=await ctx.newPage();p.setDefaultTimeout(6000);p.on('pageerror',e=>errors.push(e.message));await p.clock.install();await p.goto(base,{waitUntil:'networkidle'});await idle(p);
 await p.locator('#tech-stack .toolkit-stage').evaluate(n=>n.scrollIntoView({behavior:'instant',block:'start'}));
 await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.currentSection==='tech-stack');
 await p.clock.fastForward(60050);await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.pose==='sleeping-curl');
 await p.evaluate(()=>{
  document.querySelector('button[data-technology="react"]').focus({preventScroll:true});
  Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));
 });
 await p.clock.fastForward(90000);
 await p.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))});
 await p.waitForTimeout(200);
 assert.notEqual(await p.locator('#fresh-companion').getAttribute('data-pose'),'sleeping-curl','Accepted technology activity must clear the old sleeping deadline');
 await p.clock.fastForward(30050);await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.pose==='sleepy');
});

test('pausing before inactivity deadlines freezes the clock until resume',async t=>{
 const ctx=await browser.newContext({colorScheme:'dark',viewport:{width:1366,height:900},reducedMotion:'reduce'});t.after(()=>ctx.close());
 const p=await ctx.newPage();p.setDefaultTimeout(6000);p.on('pageerror',e=>errors.push(e.message));
 await p.clock.install();await p.goto(base,{waitUntil:'networkidle'});await idle(p);
 await p.locator('[data-fresh-reset]').click();await p.clock.fastForward(20000);
 await p.locator('[data-fresh-pause]').click();
 const paused=await p.locator('#fresh-companion').evaluate(n=>({state:n.dataset.state,pose:n.dataset.pose}));
 await p.clock.fastForward(90000);
 assert.deepEqual(await p.locator('#fresh-companion').evaluate(n=>({state:n.dataset.state,pose:n.dataset.pose})),paused);
 assert.equal(await p.locator('#fresh-companion').getAttribute('data-frame-active'),'false');
 await p.locator('[data-fresh-pause]').click();
 await p.clock.fastForward(9000);assert.notEqual(await p.locator('#fresh-companion').getAttribute('data-state'),'sleepy');
 await p.clock.fastForward(1200);await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.pose==='sleepy');
});
test('pausing midway through Contact bedtime cancels steps and restarts cleanly',async t=>{
 const ctx=await browser.newContext({colorScheme:'dark',viewport:{width:1366,height:1100},reducedMotion:'no-preference'});t.after(()=>ctx.close());
 const p=await ctx.newPage();p.setDefaultTimeout(6000);p.on('pageerror',e=>errors.push(e.message));
 await p.clock.install();await p.goto(base,{waitUntil:'networkidle'});await idle(p);
 await p.locator('[data-fresh-dock="contact"]').scrollIntoViewIfNeeded();
 await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.pose==='walking');
 await p.locator('[data-fresh-pause]').click();
 const paused=await p.locator('#fresh-companion').evaluate(n=>({state:n.dataset.state,pose:n.dataset.pose}));
 await p.clock.fastForward(10000);
 assert.deepEqual(await p.locator('#fresh-companion').evaluate(n=>({state:n.dataset.state,pose:n.dataset.pose})),paused);
 assert.equal(await p.locator('#fresh-companion').evaluate(n=>n.getAnimations({subtree:true}).filter(a=>a.playState==='running').length),0);
 await p.locator('[data-fresh-pause]').click();
 await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.pose==='walking');
 await p.clock.fastForward(1100);await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.pose==='stretching');
 await p.clock.fastForward(1200);await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.pose==='yawning');
 await p.clock.fastForward(1300);await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.pose==='sleeping-curl');
 assert.equal(await p.locator('#contact a[download]').isVisible(),true);
});
