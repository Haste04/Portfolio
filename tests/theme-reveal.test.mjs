import assert from 'node:assert/strict';
import {test,before,after} from 'node:test';
import {harness} from './helpers/scroll-reset.mjs';
let app;
before(async()=>{app=await harness('.cache/theme-signature/reveal')});
after(async()=>{await app?.close()});
test('Signature symbol precedes the actual incoming-theme circular reveal',async t=>{
 const p=await app.open(t,{colorScheme:'dark'});await p.locator('[data-theme-toggle]').click();
 await p.waitForFunction(()=>document.documentElement.dataset.themeRevealing==='anticipation');
 assert.equal(await p.locator('html').getAttribute('data-theme'),'dark');
 assert.equal(await p.locator('[data-theme-emblem]').getAttribute('data-incoming'),'light');
 await p.waitForFunction(()=>document.documentElement.dataset.themeRevealing==='reveal');
 assert.equal(await p.locator('html').getAttribute('data-theme'),'light');
 await p.waitForFunction(()=>!document.documentElement.hasAttribute('data-theme-revealing'));
 assert.equal(await p.locator('[data-theme-emblem]').isVisible(),false);
});

async function idleTheme(page,theme){
 await page.waitForFunction(theme=>document.documentElement.dataset.theme===theme&&!document.documentElement.hasAttribute('data-theme-revealing'),theme);
}
for(const incoming of ['light','dark'])test(incoming+' reveal progressively changes real text and surfaces inside a centered circle, leaving outgoing content outside',async t=>{
 const {default:sharp}=await import('sharp'),{writeFile}=await import('node:fs/promises');
 const outgoing=incoming==='light'?'dark':'light';
 const p=await app.open(t,{colorScheme:outgoing,width:1366,height:900});
 await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.state==='idle');
 const before=await p.screenshot();await p.locator('[data-theme-toggle]').click();
 await p.waitForFunction(()=>document.documentElement.dataset.themeRevealing==='anticipation');
 assert.equal(await p.locator('html').getAttribute('data-theme'),outgoing);
 assert.equal(await p.locator('[data-theme-emblem]').getAttribute('data-incoming'),incoming);
 const symbol=p.locator(incoming==='dark'?'.theme-emblem-logo':'.theme-emblem-paw');
 assert.equal(await symbol.isVisible(),true);
 const symbolBox=await p.locator('[data-theme-emblem]').boundingBox(),viewport=p.viewportSize();
 assert.ok(symbolBox.width<=110,'Symbol remains bounded; it does not expand to screen size');
 assert.ok(Math.abs(symbolBox.x+symbolBox.width/2-viewport.width/2)<2&&Math.abs(symbolBox.y+symbolBox.height/2-viewport.height/2)<2,'Anticipation symbol is centered in the viewport, independent of the navigation transform');
 await p.waitForFunction(()=>document.documentElement.dataset.themeRevealing==='reveal');
 const evidence=await p.evaluate(()=>{
  const root=document.documentElement,animations=document.getAnimations();
  const reveal=animations.find(a=>a.effect?.pseudoElement==='::view-transition-new(root)');
  if(!reveal)throw Error('No incoming snapshot animation');
  reveal.pause();reveal.currentTime=410;
  for(const a of animations.filter(a=>a.effect?.pseudoElement==='::view-transition-group(theme-emblem)')){a.pause();a.currentTime=410;}
  const frames=reveal.effect.getKeyframes();
  return {frames,clip:getComputedStyle(root,'::view-transition-new(root)').clipPath,
   oldZ:getComputedStyle(root,'::view-transition-old(root)').zIndex,newZ:getComputedStyle(root,'::view-transition-new(root)').zIndex,width:innerWidth,height:innerHeight,scroll:scrollY};
 });
 assert.match(evidence.frames[0].clipPath,/circle\(0px at 50% 50%\)/);
 const finalRadius=Number(evidence.frames.at(-1).clipPath.match(/circle\(([\d.]+)px/)[1]);
 assert.ok(finalRadius>=Math.hypot(evidence.width/2,evidence.height/2),'Circle covers the farthest corner');
 assert.ok(Number(evidence.newZ)>Number(evidence.oldZ),'Incoming snapshot is above outgoing');
 await p.waitForTimeout(80);const mid=await p.screenshot();
 const radius=Number(evidence.clip.match(/circle\(([\d.]+)px/)[1]);assert.ok(radius>120&&radius<finalRadius);
 await p.evaluate(()=>{for(const a of document.getAnimations())if(a.effect?.pseudoElement?.includes('view-transition'))a.finish()});
 await idleTheme(p,incoming);const after=await p.screenshot();
 const decode=async bytes=>sharp(bytes).removeAlpha().raw().toBuffer({resolveWithObject:true});
 const [a,b,c]=await Promise.all([decode(before),decode(mid),decode(after)]);
 const near=(data,index,other)=>Math.max(...[0,1,2].map(k=>Math.abs(data[index+k]-other[index+k])))<=16;
 let inside=0,insideMatch=0,outside=0,outsideMatch=0,changedText=0;
 for(let y=140;y<750;y++)for(let x=80;x<600;x++){
  const index=(y*a.info.width+x)*a.info.channels,distance=Math.hypot(x-evidence.width/2,y-evidence.height/2);
  if(distance<radius-12){
   inside++;if(near(b.data,index,c.data))insideMatch++;
   const oldInk=incoming==='light'?a.data[index]>180&&a.data[index+1]>180:a.data[index]<100&&a.data[index+1]<100;
   const newInk=incoming==='light'?c.data[index]<100&&c.data[index+1]<100:c.data[index]>180&&c.data[index+1]>180;
   if(oldInk&&newInk&&near(b.data,index,c.data))changedText++;
  }else if(distance>radius+12){outside++;if(near(b.data,index,a.data))outsideMatch++;}
 }
 assert.ok(inside>10000&&outside>10000,'Both incoming and outgoing regions are visible at mid-reveal');
 assert.ok(insideMatch/inside>.97,'Incoming pixels, not a colored overlay: '+insideMatch/inside);
 assert.ok(outsideMatch/outside>.97,'Outgoing pixels stay outside the circle: '+outsideMatch/outside);
 assert.ok(changedText>150,'Actual foreground text changes inside the reveal: '+changedText);
 for(const [name,buffer]of [['before',before],['mid',mid],['after',after]])await writeFile('.cache/theme-signature/reveal/'+incoming+'-'+name+'.png',buffer);
 assert.equal(await p.locator('[data-theme-emblem]').isVisible(),false);
 app.measurements.push({incoming,...evidence,radius,insideMatch:insideMatch/inside,outsideMatch:outsideMatch/outside,changedText});
});

test('Rapid repeated toggles select one theme and preserve the reading position and the same mascot node',async t=>{
 const p=await app.open(t,{colorScheme:'dark'});await p.locator('#contact').evaluate(n=>n.scrollIntoView({behavior:'instant'}));
 await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.currentSection==='contact');
 const before=await p.evaluate(()=>{window['__themeMascot']=document.querySelector('#fresh-companion');const contact=document.querySelector('#contact');return {y:scrollY,top:contact.getBoundingClientRect().top,origin:contact.getBoundingClientRect().top+scrollY}});
 await p.locator('[data-theme-toggle]').evaluate(n=>{n.click();n.click();n.click();n.click()});
 await idleTheme(p,'light');
 const after=await p.locator('#contact').evaluate(n=>({y:scrollY,top:n.getBoundingClientRect().top,origin:n.getBoundingClientRect().top+scrollY}));
 assert.ok(Math.abs(after.top-before.top)<1,'The viewed section stays fixed despite different theme typography');
 assert.ok(Math.abs((after.y-before.y)-(after.origin-before.origin))<1,'Scroll adjustment only compensates the changed section origin');
 assert.equal(await p.evaluate(()=>window['__themeMascot']===document.querySelector('#fresh-companion')),true);
 assert.equal(await p.locator('#fresh-companion').count(),1);assert.equal(await p.locator('[data-theme-toggle]').getAttribute('aria-disabled'),null);
 assert.equal(await p.evaluate(()=>localStorage.getItem('portfolio-theme')),'light');
});

for(const failure of ['unsupported','throwing','rejected'])test(failure+' View Transition API applies the theme with no blocking overlay',async t=>{
 const context=await app.browser.newContext({colorScheme:'dark',viewport:{width:1366,height:900}});t.after(()=>context.close());
 await context.addInitScript(mode=>{
  if(mode==='unsupported')document.startViewTransition=undefined;
  if(mode==='throwing')document.startViewTransition=()=>{throw Error('Controlled unsupported transition')};
  if(mode==='rejected')document.startViewTransition=()=>({ready:Promise.reject(Error('Controlled snapshot failure')),finished:Promise.resolve(),updateCallbackDone:Promise.resolve(),skipTransition(){}});
 },failure);
 const p=await context.newPage();await p.goto(app.production,{waitUntil:'networkidle'});await p.locator('[data-theme-toggle]').click();await idleTheme(p,'light');
 assert.equal(await p.locator('[data-theme-emblem]').isVisible(),false);
 assert.equal(await p.evaluate(()=>localStorage.getItem('portfolio-theme')),'light');
 await p.locator('[data-theme-toggle]').click();await idleTheme(p,'dark');
});
test('Reduced motion and Pause switch instantly without a signature overlay',async t=>{
 const reduced=await app.open(t,{colorScheme:'dark',reducedMotion:'reduce'});await reduced.locator('[data-theme-toggle]').click();await idleTheme(reduced,'light');
 assert.equal(await reduced.locator('[data-theme-emblem]').isVisible(),false);
 const p=await app.open(t,{colorScheme:'dark'});await p.locator('[data-fresh-pause]').click();
 await p.locator('[data-theme-toggle]').click();await idleTheme(p,'light');assert.equal(await p.locator('[data-theme-emblem]').isVisible(),false);
});
test('Hidden tabs, resizing and Pause during a reveal settle safely and allow another theme change',async t=>{
 const p=await app.open(t,{colorScheme:'dark'});
 await p.locator('[data-theme-toggle]').click();await p.waitForFunction(()=>document.documentElement.dataset.themeRevealing==='reveal');
 await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});
 await idleTheme(p,'light');assert.equal(await p.locator('[data-theme-emblem]').isVisible(),false);
 await p.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))});
 await p.locator('[data-theme-toggle]').click();await p.waitForFunction(()=>document.documentElement.dataset.themeRevealing==='reveal');
 await p.setViewportSize({width:1024,height:768});await idleTheme(p,'dark');
 await p.locator('[data-theme-toggle]').click();await p.waitForFunction(()=>document.documentElement.dataset.themeRevealing==='reveal');
 await p.locator('[data-fresh-pause]').evaluate(n=>n.click());await idleTheme(p,'light');
 assert.equal(await p.locator('[data-theme-emblem]').isVisible(),false);
 await p.locator('[data-fresh-pause]').evaluate(n=>n.click());await p.locator('[data-theme-toggle]').click();await idleTheme(p,'dark');
});
test('Changing theme during a held mascot drag does not reset its state, hitbox or controller',async t=>{
 const p=await app.open(t,{colorScheme:'dark'});await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.state==='idle');
 const actor=p.locator('[data-fresh-actor]'),a=await actor.boundingBox();
 await p.mouse.move(a.x+a.width/2,a.y+a.height/2);await p.mouse.down();await p.mouse.move(a.x+a.width/2+20,a.y+a.height/2-20,{steps:4});
 assert.equal(await p.locator('#fresh-companion').getAttribute('data-state'),'dragging');
 await p.locator('[data-theme-toggle]').evaluate(n=>n.click());await idleTheme(p,'light');
 assert.equal(await p.locator('#fresh-companion').getAttribute('data-state'),'dragging');
 await p.mouse.up();await p.keyboard.press('Escape');await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.state==='idle');
});

test('Scrolling, anchor navigation and page restoration cannot leave stale snapshots or duplicate controls',async t=>{
 const p=await app.open(t,{colorScheme:'dark'});
 await p.locator('[data-theme-toggle]').click();await p.waitForFunction(()=>document.documentElement.dataset.themeRevealing==='reveal');
 await p.evaluate(()=>scrollTo({top:300,behavior:'instant'}));await idleTheme(p,'light');
 assert.equal(await p.evaluate(()=>scrollY),300);
 await p.locator('[data-theme-toggle]').click();await p.waitForFunction(()=>document.documentElement.dataset.themeRevealing==='reveal');
 await p.evaluate(()=>{window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}))});
 await idleTheme(p,'dark');
 assert.equal(await p.locator('[data-theme-toggle]').count(),1);assert.equal(await p.locator('#fresh-companion').count(),1);
 await p.locator('[data-theme-toggle]').click();await p.waitForFunction(()=>document.documentElement.dataset.themeRevealing==='reveal');
 await p.locator('a[href="#contact"]').first().evaluate(n=>n.click());await idleTheme(p,'light');
 assert.equal(await p.locator('[data-theme-emblem]').isVisible(),false);
});
test('A stalled snapshot promise has a bounded watchdog and recovers to the requested theme',async t=>{
 const context=await app.browser.newContext({colorScheme:'dark',viewport:{width:1366,height:900}});t.after(()=>context.close());
 await context.addInitScript(()=>{document.startViewTransition=()=>({ready:new Promise(()=>{}),finished:Promise.resolve(),updateCallbackDone:Promise.resolve(),skipTransition(){}})});
 const p=await context.newPage();await p.goto(app.production,{waitUntil:'networkidle'});await p.locator('[data-theme-toggle]').click();
 await idleTheme(p,'light');assert.equal(await p.locator('[data-theme-emblem]').isVisible(),false);assert.equal(await p.locator('[data-theme-toggle]').getAttribute('aria-disabled'),null);
});

test('Native center-origin reveal remains bounded and covers all six responsive viewports',async t=>{
 for(const [width,height]of [[1920,1080],[1366,900],[1024,768],[768,1024],[390,844],[320,720]]){
  const p=await app.open(t,{width,height,colorScheme:'dark'});
  const before=await p.evaluate(()=>scrollY);await p.locator('[data-theme-toggle]').click();
  await p.waitForFunction(()=>document.documentElement.dataset.themeRevealing==='anticipation');
  const box=await p.locator('[data-theme-emblem]').boundingBox();
  assert.ok(Math.abs(box.x+box.width/2-width/2)<2&&Math.abs(box.y+box.height/2-height/2)<2,'Viewport-centered symbol '+width);
  await p.waitForFunction(()=>document.documentElement.dataset.themeRevealing==='reveal');
  const end=await p.evaluate(()=>document.getAnimations().find(a=>a.effect?.pseudoElement==='::view-transition-new(root)').effect.getKeyframes().at(-1).clipPath);
  assert.ok(Number(end.match(/circle\(([\d.]+)px/)[1])>=Math.hypot(width/2,height/2),'Full coverage '+width);
  await idleTheme(p,'light');assert.equal(await p.evaluate(()=>scrollY),before);
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  assert.equal(await p.locator('[data-theme-emblem]').isVisible(),false);
  await p.context().close();
 }
});
