import assert from 'node:assert/strict';
import {before,after,test} from 'node:test';
import {harness,sections,layers,go,sample,stable,noDriver,homeReady} from './helpers/scroll-reset.mjs';
let app;
before(async()=>{app=await harness('.cache/global-parallax-reset/browser')});
after(async()=>{await app?.close()});

test('After its once-only entrance Hero stays fixed during wheel scrolling, reverse and reload',async t=>{
 const p=await app.open(t);await go(p,0);
 const a=await sample(p,layers.home);
 await p.mouse.move(8,700);await p.mouse.wheel(0,360);await p.waitForFunction(()=>scrollY>=350);await p.waitForTimeout(150);
 const b=await sample(p,layers.home);stable(a,b);assert.equal(new URL(p.url()).hash,'');
 await go(p,0);stable(a,await sample(p,layers.home));
 await p.reload({waitUntil:'networkidle'});await homeReady(p);stable(a,await sample(p,layers.home));
 await noDriver(p);app.measurements.push({section:'home',a,b});
});

test('Project background stays static while native case studies and manual orbit rotation remain functional',async t=>{
 const p=await app.open(t,{reducedMotion:'reduce'}),y=await p.locator('[data-orbit-surface]').evaluate(n=>n.getBoundingClientRect().top+scrollY-260);
 await go(p,y);const a=await sample(p,layers.projects);await go(p,y+340);stable(a,await sample(p,layers.projects));await go(p,y);stable(a,await sample(p,layers.projects));
 const summary=p.locator('#project-anthea .case-study summary');await summary.click();assert.equal(await p.locator('#project-anthea .case-study[open]').count(),1);await summary.click();assert.equal(await p.locator('#project-anthea .case-study[open]').count(),0);
 await p.locator('[data-orbit-next]').click();assert.equal(await p.locator('[data-project]:visible').getAttribute('data-project'),'lifevent');
 await noDriver(p);
});

test('Pause still settles active user-driven orbit animation and resume permits another rotation without a scroll driver',async t=>{
 const p=await app.open(t);await p.locator('[data-orbit-surface]').scrollIntoViewIfNeeded();
 await p.locator('[data-orbit-next]').click();
 assert.equal(await p.locator('[data-project-orbit]').getAttribute('data-orbit-moving'),'true');
 await p.locator('[data-fresh-pause]').evaluate(n=>n.click());await p.waitForFunction(()=>document.querySelector('[data-fresh-pause]').getAttribute('aria-pressed')==='true');
 assert.equal(await p.locator('[data-project-orbit]').getAttribute('data-orbit-moving'),'false');
 await p.locator('[data-fresh-pause]').evaluate(n=>n.click());await p.locator('[data-orbit-next]').click();
 assert.equal(await p.locator('[data-project-orbit]').getAttribute('data-orbit-moving'),'true');
 await p.waitForFunction(()=>document.querySelector('[data-project-orbit]').dataset.orbitMoving==='false');await noDriver(p);
});

test('Reduced motion and blocked GSAP URLs preserve all readable content without any animation-module request',async t=>{
 let requested=0;
 const p=await app.open(t,{reducedMotion:'reduce',beforeLoad:page=>page.route(/(?:engine[.-].*\.js|gsap|ScrollTrigger)/,route=>{requested++;return route.abort()})});const a=await sample(p,layers.home);
 await go(p,350);stable(a,await sample(p,layers.home));await noDriver(p);
 assert.equal(requested,0,'No animation engine was requested, even when its URLs were blocked');
 assert.equal(await p.locator('main > section').count(),7);
 assert.equal(await p.locator('#home h1').evaluate(n=>getComputedStyle(n).visibility),'visible');
 assert.equal(await p.locator('#about .photo-story').count(),4);
 await p.locator('.case-study summary').first().click();assert.equal(await p.locator('.case-study[open]').count(),1);
});

test('Rapid and reverse navigation preserves one mascot, native Pet, and complete transform isolation',async t=>{
 const p=await app.open(t,{reducedMotion:'reduce'});
 for(const id of ['projects','contact','about','tech-stack','education','home'])await p.locator('#'+id).evaluate(n=>n.scrollIntoView({behavior:'instant'}));
 await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.currentSection==='home');
 assert.equal(await p.locator('#fresh-companion').count(),1);
 await p.locator('[data-fresh-pet]').click();await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.pose==='happy-content');
 await noDriver(p);
});

test('Hidden-tab and restored-page lifecycle retain functional components without reinitializing page motion',async t=>{
 const p=await app.open(t);await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});
 assert.equal(await p.locator('#fresh-companion').getAttribute('data-frame-active'),'false');
 await p.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}))});
 await p.waitForFunction(()=>document.querySelector('#fresh-companion')?.dataset.ready==='true');
 assert.equal(await p.locator('#fresh-companion').count(),1);
 await noDriver(p);
});

test('Six widths retain readable headings, stable layers, natural scrolling and no horizontal overflow in all seven sections',async t=>{
 for(const [width,height]of [[1920,1080],[1366,900],[1024,768],[768,1024],[390,844],[320,720]]){
  const p=await app.open(t,{width,height});
  for(const id of sections){
   const y=await p.locator('#'+id).evaluate(n=>n.getBoundingClientRect().top+scrollY-100);
   await go(p,y);const a=await sample(p,layers[id]);await go(p,y+160);const b=await sample(p,layers[id]);stable(a,b);await go(p,y);stable(a,await sample(p,layers[id]));
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,id+' '+width);
   assert.equal(await p.locator('#'+id+' h1,#'+id+' h2').evaluate(n=>getComputedStyle(n).visibility==='visible'&&parseFloat(getComputedStyle(n).opacity)===1&&n.scrollWidth<=n.clientWidth+1),true,id+' heading '+width);
   if([1366,390].includes(width)&&['home','projects','contact'].includes(id))await app.shot(p,id+'-'+width);
  }
  await noDriver(p);app.measurements.push({width,sections:7,stable:true,overflow:false});await p.context().close();
 }
});

test('Repeated Pause, reduced-motion changes and resizing never restore decorative scroll motion',async t=>{
 const p=await app.open(t);
 for(let i=0;i<2;i++){await p.locator('[data-fresh-pause]').evaluate(n=>n.click());await noDriver(p);}
 await p.emulateMedia({reducedMotion:'reduce'});await noDriver(p);
 await p.emulateMedia({reducedMotion:'no-preference'});
 for(const width of [390,1920]){await p.setViewportSize({width,height:900});await go(p,250);await noDriver(p);}
 assert.equal(await p.locator('#fresh-companion').count(),1);
});

test('Education and gallery decorative layers are static while technology keyboard connections remain usable',async t=>{
 const p=await app.open(t,{reducedMotion:'reduce'});
 for(const id of ['education','tech-stack']){
  const y=await p.locator('#'+id).evaluate(n=>n.getBoundingClientRect().top+scrollY);
  await go(p,y-500);const a=await sample(p,layers[id]);await go(p,y+200);stable(a,await sample(p,layers[id]));await go(p,y-500);stable(a,await sample(p,layers[id]));
 }
 assert.equal(await p.locator('[data-education-place]').count(),6);assert.equal(await p.locator('[data-education-panel]:visible').count(),1);
 await p.locator('button[data-technology="astro"]').focus();await p.keyboard.press('Enter');
 await p.waitForFunction(()=>document.querySelector('[data-technology-explorer]').dataset.galleryView==='focus');
 await p.keyboard.press('Tab');assert.equal(await p.locator('[data-tech-back]').evaluate(n=>n===document.activeElement),true);
 await p.keyboard.press('Tab');assert.equal(await p.locator('[data-tech-switch]').evaluate(n=>n===document.activeElement),true);
 await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>document.activeElement.getAttribute('href')),'#project-seek-first-books');
});

test('Normal idle and paused pages schedule no scroll-driver intervals or continuous JavaScript frame loops',async t=>{
 const p=await app.open(t,{init:()=>{
  window.__resetFrames=0;window['__resetIntervals']=new Map();
  const frame=window.requestAnimationFrame,set=window.setInterval,clear=window.clearInterval;
  window.requestAnimationFrame=callback=>frame(time=>{window.__resetFrames++;callback(time)});
  window.setInterval=(callback,delay,...args)=>{const id=set(callback,delay,...args);window['__resetIntervals'].set(id,delay);return id};
  window.clearInterval=id=>{window['__resetIntervals'].delete(id);return clear(id)};
 }});
 await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.state==='idle');await p.waitForTimeout(350);
 const a=await p.evaluate(()=>window.__resetFrames);await p.waitForTimeout(400);assert.equal(await p.evaluate(()=>window.__resetFrames),a,'No idle RAF chain');
 assert.equal(await p.evaluate(()=>[...window['__resetIntervals'].values()].filter(delay=>delay===250).length),0,'No old ScrollTrigger maintenance interval');
 await p.locator('[data-fresh-pause]').click();await p.waitForTimeout(350);const b=await p.evaluate(()=>window.__resetFrames);await p.waitForTimeout(400);assert.equal(await p.evaluate(()=>window.__resetFrames),b);
 await noDriver(p);
});

test('Layout-expanding disclosures and no-JavaScript fallback stay visible without refresh observers',async t=>{
 const p=await app.open(t,{reducedMotion:'reduce'});
 await p.locator('#project-anthea .case-study summary').click();assert.equal(await p.locator('#project-anthea .case-study[open]').count(),1);
 await p.locator('[data-experience-contribution="lifevent"] summary').click();assert.equal(await p.locator('[data-experience-contribution="lifevent"]').evaluate(n=>n.open),true);
 await noDriver(p);
 const fallback=await app.open(t,{javaScriptEnabled:false,width:390});
 assert.equal(await fallback.locator('main > section').count(),7);
 assert.equal(await fallback.locator('#about .story-detail:visible').count(),4);
 assert.equal(await fallback.locator('[data-project]:visible').count(),4);
 assert.equal(await fallback.locator('#contact a[download]').isVisible(),true);
});
