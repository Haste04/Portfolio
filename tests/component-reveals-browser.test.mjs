import assert from 'node:assert/strict';
import{test,before,after}from'node:test';
import{harness,go}from'./helpers/scroll-reset.mjs';
import{readFile}from'node:fs/promises';
let app;const mode=process.env.REVEAL_TEST_MODE??'development';
before(async()=>app=await harness('.cache/component-reveals/browser',{development:true}));after(async()=>app?.close());
async function instrument(page){await page.addInitScript(()=>{
 window.revealEvents=[];window.revealAnimations=[];window.revealUnobserved=[];
 const animate=Element.prototype.animate,unobserve=IntersectionObserver.prototype.unobserve;
 Element.prototype.animate=function(keyframes,options){const a=animate.call(this,keyframes,options);if(this.hasAttribute('data-component-reveal')){const t=a.effect.getTiming();window.revealEvents.push({id:this.dataset.componentReveal,started:performance.now(),delay:t.delay,duration:t.duration,keyframes:a.effect.getKeyframes()});window.revealAnimations.push(a)}return a};
 IntersectionObserver.prototype.unobserve=function(node){if(node.hasAttribute('data-component-reveal'))window.revealUnobserved.push(node.dataset.componentReveal);return unobserve.call(this,node)};
})}
const open=(t,options={})=>app.open(t,{mode,beforeLoad:instrument,waitForHome:false,...options});
async function finish(p){await p.evaluate(()=>{for(const a of window.revealAnimations)if(a.playState==='running'||a.playState==='paused')a.finish()});await p.waitForTimeout(50)}

test('Home starts four ordered real 40px fades on load and never replays after returning',async t=>{
 const p=await open(t);const events=await p.evaluate(()=>window.revealEvents.filter(e=>e.id.startsWith('home:')));
 assert.deepEqual(events.map(e=>e.id),['home:0','home:1','home:2','home:3']);
 for(let i=0;i<4;i++){assert.ok(events[i].duration>=800&&events[i].duration<=900);if(i)assert.ok(events[i].started+events[i].delay-events[i-1].started-events[i-1].delay>=120&&events[i].started+events[i].delay-events[i-1].started-events[i-1].delay<=180)}
 const at=async time=>p.evaluate(time=>{const a=window.revealAnimations[0];a.pause();a.currentTime=time;const s=getComputedStyle(document.querySelector('[data-component-reveal="home:0"]'));return{y:new DOMMatrix(s.transform).m42,opacity:Number(s.opacity)}},time);
 const initial=await at(0),middle=await at(425);assert.equal(initial.y,40);assert.equal(initial.opacity,0);assert.ok(middle.y>0&&middle.y<40);assert.ok(middle.opacity>0&&middle.opacity<1);
 await finish(p);const settled=await p.locator('#home [data-component-reveal]').evaluateAll(ns=>ns.every(n=>getComputedStyle(n).opacity==='1'&&getComputedStyle(n).transform==='none'));assert.equal(settled,true);
 await go(p,await p.locator('#education').evaluate(n=>n.offsetTop));await go(p,0);await p.waitForTimeout(1000);
 assert.deepEqual(await p.evaluate(()=>window.revealEvents.filter(e=>e.id.startsWith('home:')).map(e=>e.id)),['home:0','home:1','home:2','home:3']);
 assert.equal(await p.locator('#about [data-component-reveal],#contact [data-component-reveal]').count(),0);
});

const ids=['home:0','home:1','home:2','home:3','education:0','education:1','projects:0','projects:1','tech-stack:0','tech-stack:1','tech-stack:2','tech-stack:3','experience:0','experience:1'];
async function enter(p,id){await go(p,await p.locator('[data-component-reveal="'+id+'"]').evaluate(n=>n.getBoundingClientRect().top+scrollY-innerHeight+100));await p.waitForFunction(id=>window.revealEvents.some(e=>e.id===id),id)}
async function visitAll(p){for(const id of ids.slice(4))await enter(p,id);await finish(p)}
const visible=p=>p.locator('[data-component-reveal]').evaluateAll(ns=>ns.length===14&&ns.every(n=>getComputedStyle(n).opacity==='1'&&getComputedStyle(n).transform==='none'));
for(const theme of['dark','light'])test(theme+' reveals all five section sequences exactly once and unobserves every triggered component',async t=>{
 const p=await open(t,{colorScheme:theme});assert.deepEqual(await p.locator('[data-component-reveal]').evaluateAll(ns=>ns.map(n=>n.dataset.componentReveal)),ids);
 await visitAll(p);const events=await p.evaluate(()=>window.revealEvents);assert.equal(events.length,14);
 for(const section of['home','education','projects','tech-stack','experience'])assert.deepEqual(events.filter(e=>e.id.startsWith(section+':')).map(e=>e.id),ids.filter(id=>id.startsWith(section+':')));
 assert.deepEqual((await p.evaluate(()=>window.revealUnobserved)).sort(),[...ids].sort());assert.equal(await visible(p),true);
 for(const id of ['experience','tech-stack','projects','education','home'])await go(p,await p.locator('#'+id).evaluate(n=>n.offsetTop));await finish(p);assert.equal(await p.evaluate(()=>window.revealEvents.length),14);
 assert.equal(await p.locator('#about [data-component-reveal],#contact [data-component-reveal]').count(),0);
});

test('Theme changes, native component interactions and bfcache restoration cannot replay seen reveals',async t=>{
 const p=await open(t);assert.equal(await p.locator('[data-component-reveal]').count(),14);await visitAll(p);
 const mascot=await p.locator('#fresh-companion').elementHandle();
 await p.locator('[data-theme-toggle]').evaluate(n=>n.click());await p.waitForFunction(()=>document.documentElement.dataset.theme==='light'&&!document.documentElement.hasAttribute('data-theme-revealing'));
 assert.equal(await p.evaluate(n=>n===document.querySelector('#fresh-companion'),mascot),true);
 await p.locator('[data-education-next]').click();assert.equal(await p.locator('[data-education-panel]:visible').getAttribute('data-education-panel'),'kindergarten');
 await p.locator('[data-orbit-next]').click();await p.waitForFunction(()=>document.querySelector('[data-project-orbit]').dataset.orbitMoving==='false');assert.equal(await p.locator('[data-project]:visible').getAttribute('data-project'),'lifevent');
 await p.locator('button[data-technology="astro"]').focus();await p.keyboard.press('Enter');await p.waitForFunction(()=>document.querySelector('[data-tech-gallery]').dataset.galleryView==='focus');await p.locator('[data-tech-back]').click();await p.waitForFunction(()=>document.querySelector('[data-tech-gallery]').dataset.galleryView==='overview');
 await p.locator('.experience-cebu-map [data-experience-open]').click();await p.waitForFunction(()=>document.querySelector('[data-experience]').dataset.experienceMode==='gallery');await p.locator('[data-experience-back]').click();
 await p.evaluate(()=>{window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}))});await go(p,0);await p.waitForTimeout(1500);
 assert.equal(await p.evaluate(()=>window.revealEvents.length),14);assert.equal(await p.locator('#fresh-companion').count(),1);assert.equal(await visible(p),true);
});

test('Pause, reduced motion, hidden tabs and theme anticipation settle active reveals without replay',async t=>{
 const p=await open(t);assert.equal(await p.locator('[data-component-reveal]').count(),14);
 await enter(p,'education:0');await p.evaluate(()=>{for(const a of window.revealAnimations)if(a.effect.target.dataset.componentReveal.startsWith('education:')){a.pause();a.currentTime=100}});
 await p.locator('[data-fresh-pause]').evaluate(n=>n.click());assert.equal(await p.locator('[data-component-reveal="education:0"]').evaluate(n=>getComputedStyle(n).opacity),'1');
 await p.locator('[data-fresh-pause]').evaluate(n=>n.click());const before=await p.evaluate(()=>window.revealEvents.filter(e=>e.id.startsWith('education:')).length);await go(p,0);await enter(p,'education:0');assert.equal(await p.evaluate(()=>window.revealEvents.filter(e=>e.id.startsWith('education:')).length),before);
 await enter(p,'projects:0');await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(50);assert.equal(await p.locator('[data-component-reveal="projects:0"]').evaluate(n=>getComputedStyle(n).opacity),'1');
 await p.emulateMedia({reducedMotion:'no-preference'});await enter(p,'tech-stack:0');await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});assert.equal(await p.locator('[data-component-reveal="tech-stack:0"]').evaluate(n=>getComputedStyle(n).opacity),'1');
 await p.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))});await enter(p,'experience:0');await p.locator('[data-theme-toggle]').evaluate(n=>n.click());await p.waitForFunction(()=>document.documentElement.dataset.theme==='light'&&!document.documentElement.hasAttribute('data-theme-revealing'));assert.equal(await p.locator('[data-component-reveal="experience:0"]').evaluate(n=>getComputedStyle(n).opacity),'1');
 assert.equal(await p.evaluate(()=>window.revealEvents.length===new Set(window.revealEvents.map(e=>e.id)).size),true);
});

test('Reduced motion or saved Pause shows all content immediately without entrance animations',async t=>{
 for(const paused of[false,true]){const p=await open(t,{reducedMotion:paused?'no-preference':'reduce',init:paused?()=>localStorage.setItem('fresh-paused','true'):undefined});assert.equal(await p.locator('[data-component-reveal]').count(),14);await go(p,await p.locator('#tech-stack').evaluate(n=>n.offsetTop));await p.waitForTimeout(150);assert.equal(await p.evaluate(()=>window.revealEvents.length),0);assert.equal(await visible(p),true);await p.context().close()}
});

test('Keyboard focus settles its outer reveal before map or zoom interaction',async t=>{
 const p=await open(t);assert.equal(await p.locator('[data-component-reveal]').count(),14);await enter(p,'education:0');
 await p.locator('[data-education-place="aloran"]').focus();assert.equal(await p.locator('[data-component-reveal="education:0"]').evaluate(n=>getComputedStyle(n).transform),'none');await p.keyboard.press('Enter');assert.equal(await p.locator('[data-education-panel]:visible').getAttribute('data-education-panel'),'kindergarten');
 await enter(p,'tech-stack:0');await p.locator('button[data-technology="astro"]').focus();assert.equal(await p.locator('[data-component-reveal="tech-stack:0"]').evaluate(n=>getComputedStyle(n).transform),'none');await p.keyboard.press('Enter');await p.waitForFunction(()=>document.querySelector('[data-tech-gallery]').dataset.galleryView==='focus');await p.keyboard.press('Escape');await p.waitForFunction(()=>document.querySelector('[data-tech-gallery]').dataset.galleryView==='overview');assert.equal(await p.locator('button[data-technology="astro"]').evaluate(n=>n===document.activeElement),true);
 assert.equal(await p.locator('#fresh-companion [data-component-reveal]').count(),0);
});

test('A direct anchor load handles tall/mobile elements and exposes skipped earlier content on scroll-up',async t=>{
 const p=await open(t,{width:390,height:844});await p.goto(p.url().split('#')[0]+'#tech-stack');await p.reload({waitUntil:'networkidle'});await p.waitForTimeout(200);
 assert.equal(await p.locator('[data-component-reveal]').count(),14);assert.equal(await p.evaluate(()=>window.revealEvents.some(e=>e.id.startsWith('home:'))),false);
 await go(p,0);await p.waitForTimeout(300);assert.equal(await p.locator('[data-component-reveal="home:0"]').evaluate(n=>getComputedStyle(n).opacity),'1');assert.equal(await p.evaluate(()=>window.revealEvents.some(e=>e.id.startsWith('home:'))),false);
 assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
});

test('No JavaScript or a failing native animation leaves every component visible',async t=>{
 const noJS=await app.open(t,{mode,javaScriptEnabled:false});assert.equal(await visible(noJS),true);await noJS.context().close();
 const p=await open(t,{beforeLoad:async page=>{await instrument(page);await page.addInitScript(()=>{const animate=Element.prototype.animate;Element.prototype.animate=function(k,o){if(this.hasAttribute('data-component-reveal'))throw Error('Simulated unavailable reveal animation');return animate.call(this,k,o)}})}});assert.equal(await visible(p),true);await go(p,await p.locator('#tech-stack').evaluate(n=>n.offsetTop));assert.equal(await visible(p),true);
});

test('Original production layouts remain exact at six widths in both themes after all reveals finish',async t=>{
 const baseline=JSON.parse(await readFile('tests/fixtures/component-reveals-layout.json','utf8'));
 for(const theme of['dark','light'])for(const width of[1920,1366,1024,768,390,320]){
  const expected=baseline[theme+'-'+width],p=await open(t,{mode:'production',width,height:expected.height,colorScheme:theme});await visitAll(p);
  for(const [selector,original]of Object.entries(expected.selectors)){
   const actual=await p.locator(selector).evaluate(n=>{const r=n.getBoundingClientRect(),c=getComputedStyle(n);return{x:r.left+scrollX,y:r.top+scrollY,width:r.width,height:r.height,color:c.color,background:c.backgroundColor,fontSize:c.fontSize}});
   for(const key of['x','y','width','height'])assert.ok(Math.abs(actual[key]-original[key])<1,theme+' '+width+' '+selector+' '+key+': '+actual[key]+' != '+original[key]);
   for(const key of['color','background','fontSize'])assert.equal(actual[key],original[key],selector+' '+key);
  }
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);await p.context().close();
 }
});

test('A blocked reveal module preserves visible content and the other component controllers',async t=>{
 let blocked=0;const p=await open(t,{mode:'development',beforeLoad:async page=>{await instrument(page);await page.route(/\/src\/scripts\/component-reveals\.ts(?:\?|$)/,route=>{blocked++;return route.abort()})}});
 assert.ok(blocked>0,'The actual reveal module request was blocked');assert.equal(await visible(p),true);assert.equal(await p.evaluate(()=>window.revealEvents.length),0);
 await p.locator('button[data-technology="astro"]').focus();await p.keyboard.press('Enter');await p.waitForFunction(()=>document.querySelector('[data-tech-gallery]').dataset.galleryView==='focus');
});

test('Restoring an interrupted page observes unseen components without replaying the completed Home sequence',async t=>{
 const p=await open(t);await finish(p);await p.evaluate(()=>{window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}))});
 await visitAll(p);assert.deepEqual((await p.evaluate(()=>window.revealEvents.map(e=>e.id))).sort(),[...ids].sort());assert.equal(await visible(p),true);
});

test('A pointer press holds the moving wrapper in place and activates the originally pressed map control',async t=>{
 const p=await open(t);await enter(p,'education:0');
 await p.evaluate(()=>{const a=window.revealAnimations.find(a=>a.effect.target.dataset.componentReveal==='education:0');a.pause();a.currentTime=0});
 const control=p.locator('[data-education-place="aloran"]');await go(p,await control.evaluate(n=>n.getBoundingClientRect().top+scrollY-innerHeight*.5));
 const before=await control.boundingBox();await p.mouse.move(before.x+before.width/2,before.y+before.height-3);await p.mouse.down();await p.waitForTimeout(60);const held=await control.boundingBox();await p.mouse.up();
 assert.ok(Math.abs(held.y-before.y)<.5,'A held pointer must not have its target moved by the reveal: '+before.y+' -> '+held.y);
 await p.waitForFunction(()=>document.querySelector('[data-education-journey]').dataset.currentEntry==='kindergarten');
 assert.equal(await p.locator('[data-education-panel]:visible').getAttribute('data-education-panel'),'kindergarten');
 await p.waitForTimeout(1000);assert.equal(await p.locator('[data-component-reveal="education:0"]').evaluate(n=>getComputedStyle(n).transform),'none');
});

test('A real mobile vertical gesture cancels its pointer hold and preserves natural scrolling',async t=>{
 const p=await open(t,{width:390,height:844,isMobile:true,hasTouch:true});await enter(p,'tech-stack:0');
 await p.evaluate(()=>{const a=window.revealAnimations.find(a=>a.effect.target.dataset.componentReveal==='tech-stack:0');a.pause();a.currentTime=100});
 const header=p.locator('[data-tech-placement="frontend"] .technology-category-heading');await go(p,await header.evaluate(n=>n.getBoundingClientRect().top+scrollY-500));const b=await header.boundingBox(),start=await p.evaluate(()=>scrollY),cdp=await p.context().newCDPSession(p),x=b.x+b.width/2,y=b.y+b.height/2;
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});for(let i=1;i<=5;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-i*45,id:1}]});await p.waitForTimeout(35)}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
 await p.waitForTimeout(1100);assert.ok(await p.evaluate(()=>scrollY)>start+50);assert.equal(await p.locator('[data-tech-gallery]').getAttribute('data-gallery-view'),'overview');assert.equal(await p.locator('[data-component-reveal="tech-stack:0"]').evaluate(n=>getComputedStyle(n).transform),'none');
 assert.equal(await p.evaluate(()=>window.revealEvents.filter(e=>e.id==='tech-stack:0').length),1);
});

test('Losing window focus during a held pointer settles the reveal and leaves no resumable stale animation',async t=>{
 const p=await open(t);await enter(p,'projects:0');await p.evaluate(()=>{const a=window.revealAnimations.find(a=>a.effect.target.dataset.componentReveal==='projects:0');a.pause();a.currentTime=0});
 const heading=p.locator('.orbit-heading');await go(p,await heading.evaluate(n=>n.getBoundingClientRect().top+scrollY-300));const b=await heading.boundingBox();await p.mouse.move(b.x+b.width/2,b.y+b.height/2);await p.mouse.down();await p.evaluate(()=>window.dispatchEvent(new Event('blur')));
 assert.equal(await p.locator('[data-component-reveal="projects:0"]').evaluate(n=>getComputedStyle(n).transform),'none');await p.mouse.up();await p.waitForTimeout(200);assert.equal(await p.locator('[data-component-reveal="projects:0"]').evaluate(n=>getComputedStyle(n).opacity),'1');assert.equal(await p.evaluate(()=>window.revealEvents.filter(e=>e.id==='projects:0').length),1);
});
