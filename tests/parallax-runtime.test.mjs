import assert from 'node:assert/strict';
import {before,after,test} from 'node:test';
import {harness,sections,layers,go,sample,stable,noDriver} from './helpers/scroll-reset.mjs';
let app;
before(async()=>{app=await harness('.cache/global-parallax-reset/runtime',{development:true})});
after(async()=>{await app?.close()});
for(const mode of ['development','production']){
 test(mode+' Hero stays static through ordinary desktop scrolling, reload and wide resizing',async t=>{
  const p=await app.open(t,{mode,width:1366,height:768});
  for(const width of [1366,1920]){
   await p.setViewportSize({width,height:width===1920?1080:768});await go(p,0);
   const a=await sample(p,layers.home);await p.mouse.move(8,700);await p.mouse.wheel(0,360);await p.waitForFunction(()=>scrollY>=350);await p.waitForTimeout(150);
   const b=await sample(p,layers.home);stable(a,b);await go(p,0);stable(a,await sample(p,layers.home));
   await p.reload({waitUntil:'networkidle'});stable(a,await sample(p,layers.home));
   app.measurements.push({mode,section:'home',width,a,b});
  }
  await noDriver(p);await app.shot(p,mode+'-hero-desktop');
 });
 test(mode+' all four project selections animate independently of static backgrounds and preserve details',async t=>{
  const p=await app.open(t,{mode});
  for(const id of ['anthea','lifevent','seek-first-books','philchan-cebu']){
   await p.locator('[data-orbit-item="'+id+'"]').click();
   await p.waitForFunction(()=>document.querySelector('[data-project-orbit]').dataset.orbitMoving==='false');
   assert.equal(await p.locator('[data-project]:visible').getAttribute('data-project'),id);
   assert.equal(await p.locator('[data-orbit-item][aria-pressed="true"]').getAttribute('data-orbit-item'),id);
   const y=await p.locator('[data-orbit-surface]').evaluate(n=>n.getBoundingClientRect().top+scrollY-260);
   await go(p,y);const a=await sample(p,layers.projects);await go(p,y+360);const b=await sample(p,layers.projects);stable(a,b);await go(p,y);stable(a,await sample(p,layers.projects));
   app.measurements.push({mode,section:'projects',id,a,b});
  }
  await noDriver(p);
 });
 test(mode+' Education, Tech Stack, Experience and Contact have zero decorative scroll displacement',async t=>{
  const p=await app.open(t,{mode});
  for(const id of ['education','tech-stack','experience','contact']){
   const y=await p.locator('#'+id).evaluate(n=>n.getBoundingClientRect().top+scrollY-300);
   await go(p,y);const a=await sample(p,layers[id]);await go(p,y+360);const b=await sample(p,layers[id]);stable(a,b);await go(p,y);stable(a,await sample(p,layers[id]));
   app.measurements.push({mode,section:id,a,b});
  }
  await noDriver(p);await app.shot(p,mode+'-contact-desktop');
 });
 test(mode+' reduced motion and saved Pause persist across reload with functioning resume',async t=>{
  const reduced=await app.open(t,{mode,reducedMotion:'reduce'});await noDriver(reduced);
  const p=await app.open(t,{mode});await p.locator('[data-fresh-pause]').click();
  assert.equal(await p.evaluate(()=>localStorage.getItem('fresh-paused')),'true');
  await p.reload({waitUntil:'networkidle'});
  await p.waitForFunction(()=>document.querySelector('[data-fresh-pause]')?.getAttribute('aria-pressed')==='true');
  assert.equal(await p.locator('#fresh-companion').getAttribute('data-frame-active'),'false');
  await p.locator('[data-fresh-pause]').click();await p.waitForFunction(()=>document.querySelector('[data-fresh-pause]').getAttribute('aria-pressed')==='false');
  // Resume is clicked near magnetic artwork. Compare resting geometry, not its 650ms cursor response.
  await p.mouse.move(2,2);
  await p.waitForFunction(()=>[...document.querySelectorAll('[data-living-ring]')].every(n=>
   Number(n.style.getPropertyValue('--near'))===0&&!n.getAnimations().some(a=>a instanceof CSSTransition&&a.playState==='running')));
  await go(p,0);const a=await sample(p,layers.home);await go(p,360);stable(a,await sample(p,layers.home));await noDriver(p);
 });
 test(mode+' mobile maintains readable static layouts, one mascot and native scrolling',async t=>{
  for(const width of [390,320]){
   const p=await app.open(t,{mode,width,height:844});
   for(const id of sections){await p.locator('#'+id).evaluate(n=>n.scrollIntoView({behavior:'instant'}));assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,id+' overflow '+width);}
   assert.equal(await p.locator('#fresh-companion').count(),1);await noDriver(p);
   await app.shot(p,mode+'-contact-'+width,'#contact');await p.context().close();
  }
 });
}
