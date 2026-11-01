import assert from 'node:assert/strict';
import {before,after,test} from 'node:test';
import {mkdir,writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {chromium} from 'playwright-core';
const origin='http://127.0.0.1:4321',folder='.cache/education-centered-watermark';
let browser,ownedDev;
const evidence=[];
before(async()=>{
 await mkdir(folder,{recursive:true});
 const ready=async()=>{try{return(await fetch(origin,{signal:AbortSignal.timeout(5000)})).ok}catch{return false}};
 if(!await ready()){
  ownedDev=spawn(process.execPath,['node_modules/astro/bin/astro.mjs','dev','--host','127.0.0.1','--port','4321','--ignore-lock'],{cwd:process.cwd(),env:{...process.env,ASTRO_TELEMETRY_DISABLED:'1'},stdio:'ignore'});
  const deadline=Date.now()+90000;while(Date.now()<deadline&&!await ready())await new Promise(r=>setTimeout(r,250));
  assert.ok(await ready(),'development server responds');
 }
 browser=await chromium.launch({channel:'msedge',headless:true});
});
after(async()=>{await browser?.close();ownedDev?.kill();await writeFile(folder+'/browser-results.json',JSON.stringify(evidence,null,2))});
async function open(t,width=1366,options={}){
 const context=await browser.newContext({colorScheme:'dark',viewport:{width,height:900},reducedMotion:'reduce',...options});t.after(()=>context.close());
 const page=await context.newPage();page.setDefaultTimeout(10000);page.setDefaultNavigationTimeout(90000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));t.after(()=>assert.deepEqual(errors,[]));
 await page.goto(origin,{waitUntil:'networkidle'});await page.evaluate(()=>document.fonts.ready);return page;
}
test('Education exposes six locations, seven typed stages, Nursery details and safe logo fallback',async t=>{
 const p=await open(t);const root=p.locator('[data-education-journey]');
 assert.equal(await root.count(),1);
 assert.equal(await root.locator('[data-education-place]').count(),6);
 assert.equal(await root.locator('[data-education-stage]').count(),7);
 assert.equal(await root.locator('[data-education-panel]:visible').count(),1);
 assert.match(await root.locator('[data-education-panel]:visible').textContent(),/Not yet confirmed/);
 assert.equal(await root.locator('[data-education-panel]:visible li').count(),0);
 assert.equal(await p.locator('#education .section-introduction').textContent(),'A foundation in Computer Science. A habit of showing up and learning.');
 assert.equal(await p.locator('#education .section-introduction br').count(),0);
 for(const src of await root.locator('img[data-education-logo]').evaluateAll(ns=>ns.map(n=>n.getAttribute('src'))))assert.ok(existsSync('public'+src),'only present school-logo files are referenced');
 assert.equal(await root.locator('.school-mark,.school-mark-fallback').count(),0,'boxed logo and fallback icon are removed');
 assert.equal(await root.locator('[data-education-panel]:visible .school-watermark').count(),0,'Nursery has a clean background');
});
test('Education hotspots, repeat-location stages and keyboard access stay synchronized',async t=>{
 const p=await open(t),root=p.locator('[data-education-journey]');
 await root.locator('[data-education-place="aloran"]').click();
 assert.equal(await root.locator('[data-education-stage]:visible').count(),1);
 assert.equal(await root.locator('[data-education-panel]:visible').getAttribute('data-education-panel'),'kindergarten');
 await root.locator('[data-education-stage="kindergarten"]').focus();await p.keyboard.press('Enter');
 assert.equal(await root.locator('[data-education-panel]:visible').getAttribute('data-education-panel'),'kindergarten');
 await root.locator('[data-education-place="argao"]').click();
 assert.equal(await root.locator('[data-education-stage]:visible').count(),2);
 await root.locator('[data-education-stage="grade-10"]').click();
 assert.match(await root.locator('[data-education-panel]:visible h3').textContent(),/Christian Learning Center/);
 await root.locator('[data-education-place="aloran"]').click();
 assert.equal(await root.locator('[data-education-panel]:visible').getAttribute('data-education-panel'),'kindergarten','returning to a place remembers its selected chapter');
 const before=await p.evaluate(()=>scrollY);
 await root.locator('[data-education-location-select]').selectOption('boracay');
 assert.equal(await root.locator('[data-education-panel]:visible').getAttribute('data-education-panel'),'grade-3-5');
 assert.equal(await p.evaluate(()=>scrollY),before,'native selection does not force a page jump');
 assert.equal(await root.locator('[data-education-place][aria-current="location"]').getAttribute('data-education-place'),'boracay');
 await root.locator('[data-education-place="cagayan-de-oro"]').focus();await p.keyboard.press('Enter');
 assert.match(await root.locator('[data-education-panel]:visible h3').textContent(),/Not yet confirmed/);
 assert.equal(await root.locator('[data-education-panel]:visible li').count(),0);
 assert.ok(await p.evaluate(()=>getComputedStyle(document.activeElement).outlineStyle!=='none'),'keyboard focus remains visible');
});
for(const width of [1920,1366,1024,768,390,320]){
 test('Education map, touch targets and details fit at '+width+'px',async t=>{
  const p=await open(t,width),root=p.locator('[data-education-journey]');
  await p.locator('#education').evaluate(n=>n.scrollIntoView({behavior:'instant'}));
  const layout=await root.evaluate(n=>{
   const map=n.querySelector('.education-atlas').getBoundingClientRect(),details=n.querySelector('.education-details').getBoundingClientRect();
   const buttons=[...n.querySelectorAll('[data-education-place]')].map(a=>a.getBoundingClientRect());
   return {map:map.toJSON(),details:details.toJSON(),targets:buttons.map(r=>({width:r.width,height:r.height,left:r.left,right:r.right})),overlap:buttons.some((a,i)=>buttons.slice(i+1).some(b=>!(a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top)))};
  });
  assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal overflow');
  if(width>=1024)assert.ok(layout.details.left>=layout.map.right,'desktop split');
  else assert.ok(layout.details.top>=layout.map.bottom,'tablet/mobile stacked');
  assert.ok(layout.targets.every(r=>r.width>=44&&r.height>=44&&r.left>=0&&r.right<=width),'comfortable targets stay inside viewport');
  assert.equal(layout.overlap,false,'nearby places have separated touch labels');
  await root.locator('[data-education-location-select]').selectOption('cebu-city');
  const panel=root.locator('[data-education-panel]:visible');
  assert.ok(await panel.locator('li').last().isVisible());
  assert.ok(await panel.evaluate(n=>n.scrollWidth<=n.clientWidth),'long school and stage names wrap');
  assert.equal(await root.getAttribute('data-map-view'),'zoomed');
  assert.equal(await root.getAttribute('data-map-moving'),'false','reduced-motion view changes are immediate');
  const camera=await root.locator('[data-education-camera]').first().evaluate(n=>n.transform.baseVal.consolidate().matrix.a);assert.ok(Math.abs(camera-1.85)<.00001,'SVG camera scale');
  if(width===390)await root.screenshot({path:folder+'/zoomed-mobile.png',timeout:20000,style:'astro-dev-toolbar,.floating-navigation,.skip-link {visibility:hidden!important}'});
  if([1920,390].includes(width)){
   await p.locator('#education').evaluate(n=>n.scrollIntoView({behavior:'instant'}));await p.evaluate(()=>document.activeElement?.blur());
   await p.screenshot({path:folder+'/education-'+width+'.png',timeout:20000,style:'astro-dev-toolbar {display:none!important}'});
   await root.screenshot({path:folder+'/education-'+width+'-journey.png',timeout:20000,style:'astro-dev-toolbar,.floating-navigation,.skip-link {visibility:hidden!important}'});
  }
  evidence.push({width,...layout});
 });
}
test('Education remains readable without JavaScript and direct chapter fragments survive reload',async t=>{
 const p=await open(t,390,{javaScriptEnabled:false});
 assert.equal(await p.locator('[data-education-panel]:visible').count(),7);
 await p.locator('[data-education-place="iloilo"]').click();
 assert.equal(new URL(p.url()).hash,'#education-stage-grade-6-9');
 assert.ok(await p.locator('#education-stage-grade-6-9').isVisible());
 const js=await open(t);await js.goto(origin+'/#education-stage-grade-10',{waitUntil:'networkidle'});
 assert.equal(await js.locator('[data-education-panel]:visible').getAttribute('data-education-panel'),'grade-10');
 await js.reload({waitUntil:'networkidle'});
 assert.equal(await js.locator('[data-education-panel]:visible').getAttribute('data-education-panel'),'grade-10');
});
test('Education selection survives normal motion, Pause, reduced motion and page lifecycle restoration',async t=>{
 const p=await open(t,1366,{reducedMotion:'no-preference'});
 await p.waitForFunction(()=>document.querySelector('#fresh-companion')?.dataset.ready==='true');
 await p.locator('#education').evaluate(n=>n.scrollIntoView({behavior:'instant'}));
 await p.locator('[data-education-place="argao"]').click();await p.locator('[data-education-stage="grade-10"]').click();
 await p.locator('[data-fresh-pause]').click();await p.waitForFunction(()=>document.querySelector('[data-fresh-pause]')?.getAttribute('aria-pressed')==='true');
 await p.locator('[data-education-place="iloilo"]').click();
 assert.equal(await p.locator('[data-education-panel]:visible').getAttribute('data-education-panel'),'grade-6-9');
 await p.locator('[data-fresh-pause]').click();await p.emulateMedia({reducedMotion:'reduce'});
 await p.waitForFunction(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
 await p.evaluate(()=>{window.dispatchEvent(new PageTransitionEvent('pagehide'));window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}))});
 await p.locator('[data-education-place="cebu-city"]').click();
 assert.equal(await p.locator('[data-education-panel]:visible').getAttribute('data-education-panel'),'senior-high-college');
 assert.equal(await p.locator('#fresh-companion').count(),1);
});

test('Decorative school watermark loads and fails without a broken icon or lost card content',async t=>{
 const p=await open(t),root=p.locator('[data-education-journey]');
 await root.locator('[data-education-next]').click();
 const panel=root.locator('[data-education-panel]:visible'),mark=panel.locator('.school-watermark'),logo=mark.locator('[data-education-logo]');
 await logo.evaluate(n=>n.decode());
 assert.equal(await mark.getAttribute('aria-hidden'),'true');
 assert.equal(await logo.getAttribute('alt'),'');
 assert.equal(await logo.evaluate(n=>n.naturalWidth>0&&!n.hidden),true);
 await logo.evaluate(n=>{n.src='data:image/png;base64,broken'});
 await p.waitForFunction(()=>document.querySelector('[data-education-panel]:not(.is-inactive) img[data-education-logo]').hidden);
 assert.equal(await logo.isVisible(),false,'failed decorative images are hidden');
 assert.equal(await root.locator('.school-mark,.school-mark-fallback').count(),0);
 assert.ok(await panel.locator('h3').isVisible());
 assert.ok(await root.locator('[data-education-next]').isEnabled());
 await root.locator('[data-education-next]').click();
 assert.ok(await root.locator('[data-education-panel]:visible img').evaluate(async n=>{await n.decode();return n.naturalWidth>0&&!n.hidden}),'another chapter retains its own working logo');
});

test('Education preserves the selected chapter over an old URL fragment on page restoration',async t=>{
 const p=await open(t);
 await p.goto(origin+'/#education-stage-grade-10',{waitUntil:'networkidle'});
 await p.locator('[data-education-place="iloilo"]').click();
 assert.equal(await p.locator('[data-education-panel]:visible').getAttribute('data-education-panel'),'grade-6-9');
 await p.evaluate(()=>{window.dispatchEvent(new PageTransitionEvent('pagehide'));window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}))});
 assert.equal(await p.locator('[data-education-panel]:visible').getAttribute('data-education-panel'),'grade-6-9','restoration retains the most recent selection');
});

test('Education supports actual touch selection and preserves native vertical swipes',async t=>{
 const p=await open(t,390,{isMobile:true,hasTouch:true});
 await p.locator('.education-map-canvas').evaluate(n=>n.scrollIntoView({block:'start',behavior:'instant'}));
 const map=await p.locator('.education-map-canvas').boundingBox(),before=await p.evaluate(()=>scrollY);
 const cdp=await p.context().newCDPSession(p),x=map.x+map.width*.5,y=Math.min(700,map.y+map.height*.7);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
 for(let i=1;i<=8;i++){
  await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-i*22}]});
  await p.waitForTimeout(20);
 }
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(350);await cdp.detach();
 assert.ok((await p.evaluate(()=>scrollY))>before+50,'map does not intercept page swipes');
 await p.locator('[data-education-place="argao"]').tap();
 assert.equal(await p.locator('[data-education-panel]:visible').getAttribute('data-education-panel'),'grade-3-before-break');
 await p.locator('[data-education-stage="grade-10"]').tap();
 assert.equal(await p.locator('[data-education-panel]:visible').getAttribute('data-education-panel'),'grade-10');
});

test('Nursery starts full-country; Previous and Next visit all seven chapters without looping or card jumps',async t=>{
 const p=await open(t),root=p.locator('[data-education-journey]');
 const ids=['nursery','kindergarten','grade-3-before-break','grade-3-5','grade-6-9','grade-10','senior-high-college'];
 const previous=root.locator('[data-education-previous]'),next=root.locator('[data-education-next]');
 assert.equal(await root.getAttribute('data-map-view'),'full');
 assert.equal(await previous.isDisabled(),true);
 const heights=[];
 for(let i=0;i<ids.length;i++){
  assert.equal(await root.locator('[data-education-panel]:visible').getAttribute('data-education-panel'),ids[i]);
  assert.equal(await next.isDisabled(),i===ids.length-1);assert.equal(await previous.isDisabled(),i===0);
  heights.push((await root.locator('.education-card').boundingBox()).height);
  if(i<ids.length-1)await next.click();
 }
 assert.ok(Math.max(...heights)-Math.min(...heights)<2,'card reserves its content height: '+heights);
 for(let i=ids.length-2;i>=0;i--){await previous.click();assert.equal(await root.locator('[data-education-panel]:visible').getAttribute('data-education-panel'),ids[i])}
 assert.equal(await previous.isDisabled(),true);
});
test('Map camera visibly zooms and pans with aligned connectors, reversible Reset and no same-place animation',async t=>{
 const p=await open(t,1366,{reducedMotion:'no-preference'}),root=p.locator('[data-education-journey]');
 await p.waitForFunction(()=>document.querySelector('#fresh-companion')?.dataset.ready==='true');
 await p.locator('.education-map-canvas').evaluate(n=>n.scrollIntoView({block:'start',behavior:'instant'}));
 const matrix=()=>p.locator('[data-education-camera]').first().evaluate(n=>{const m=n.transform.baseVal.consolidate().matrix;return {k:m.a,x:m.e,y:m.f}});
 const initial=await matrix();assert.equal(initial.k,1);
 await p.evaluate(()=>{window.__educationFrames=[];const node=document.querySelector('[data-education-camera]');new MutationObserver(()=>window.__educationFrames.push(node.transform.baseVal.consolidate().matrix.a)).observe(node,{attributes:true,attributeFilter:['transform']})});
 await root.locator('[data-education-place="boracay"]').click();
 await p.waitForFunction(()=>document.querySelector('[data-education-journey]').dataset.mapMoving==='false');
 const frames=await p.evaluate(()=>window.__educationFrames);
 assert.ok(frames.some(k=>k>1.05&&k<1.8),'camera must render intermediate zoom frames: '+frames);
 const boracay=await matrix();assert.ok(boracay.k>=1.8);
 await root.locator('[data-education-pin="iloilo"]').click();
 await p.waitForFunction(()=>document.querySelector('[data-education-journey]').dataset.mapMoving==='false');
 const iloilo=await matrix();assert.ok(Math.hypot(iloilo.x-boracay.x,iloilo.y-boracay.y)>40,'different places pan');
 const aligned=await root.evaluate(n=>{
  const m=n.querySelector('[data-education-camera]').transform.baseVal.consolidate().matrix;
  return [...n.querySelectorAll('[data-map-connector]')].every(path=>{
   const a=path.getPointAtLength(0),b=path.getPointAtLength(path.getTotalLength());
   return Math.abs(a.x-(+path.dataset.pointX*m.a+m.e))<.1&&Math.abs(a.y-(+path.dataset.pointY*m.a+m.f))<.1&&Math.abs(b.x-+path.dataset.labelX)<.1&&Math.abs(b.y-+path.dataset.labelY)<.1;
  });
 });
 assert.equal(aligned,true,'connectors join transformed points to stable labels');
 assert.equal(await root.locator('[data-education-camera][data-page-motion-target]').count(),0,'GSAP never owns interactive camera transforms');
 await root.screenshot({path:folder+'/zoomed-desktop.png',timeout:20000,style:'astro-dev-toolbar,.floating-navigation,.skip-link {visibility:hidden!important}'});
 await root.locator('[data-education-reset]').click();
 await p.waitForFunction(()=>document.querySelector('[data-education-journey]').dataset.mapMoving==='false');
 assert.deepEqual(await matrix(),initial);
 assert.equal(await root.locator('[data-education-panel]:visible').getAttribute('data-education-panel'),'grade-6-9','Reset preserves chapter');
 await root.locator('[data-education-place="argao"]').click();
 await p.waitForFunction(()=>document.querySelector('[data-education-journey]').dataset.mapMoving==='false');
 const before=await matrix();
 await root.locator('[data-education-stage="grade-10"]').click();
 assert.equal(await root.locator('[data-education-panel]:visible').getAttribute('data-education-panel'),'grade-10');
 assert.equal(await root.getAttribute('data-map-moving'),'false','same-place navigation avoids re-zoom');
 assert.deepEqual(await matrix(),before);
 await root.locator('[data-education-place="cebu-city"]').click();
 await p.locator('[data-fresh-pause]').click();
 await p.waitForFunction(()=>document.querySelector('[data-education-journey]').dataset.mapMoving==='false');
 const paused=await matrix();await p.waitForTimeout(150);assert.deepEqual(await matrix(),paused);
});

test('Keyboard focus stays visible at first/final chapter boundaries and after Reset',async t=>{
 const p=await open(t),root=p.locator('[data-education-journey]');
 const next=root.locator('[data-education-next]'),previous=root.locator('[data-education-previous]');
 await next.focus();
 for(let i=0;i<6;i++)await p.keyboard.press('Enter');
 assert.equal(await previous.evaluate(n=>document.activeElement===n),true,'final chapter hands focus to Previous');
 for(let i=0;i<6;i++)await p.keyboard.press('Enter');
 assert.equal(await next.evaluate(n=>document.activeElement===n),true,'first chapter hands focus to Next');
 const reset=root.locator('[data-education-reset]');await reset.focus();await p.keyboard.press('Enter');
 assert.equal(await reset.isDisabled(),true);
 assert.equal(await root.locator('[data-education-place][aria-current]').evaluate(n=>document.activeElement===n),true,'Reset hands focus to active map label');
 assert.ok(await p.evaluate(()=>getComputedStyle(document.activeElement).outlineStyle!=='none'),'visible keyboard focus remains');
});

test('School watermarks use the correct sources and are centered, unblurred, clipped and readable across all chapters and six widths',async t=>{
 const p=await open(t),root=p.locator('[data-education-journey]');
 const files=[null,'aloran-christian-school-inc.jpg','binlod-elementary-school.jpg','river-of-knowledge-foundation-academy-inc.jpg','central-philippine-university.jpg','christian-learning-center-of-argao-cebu-inc.png','university_of_cebu_main_campus.jpg'];
 const results=[];
 for(const width of [1920,1366,1024,768,390,320]){
  await p.setViewportSize({width,height:900});
  await root.locator('[data-education-place="cagayan-de-oro"]').click();
  const heights=[];
  for(let i=0;i<files.length;i++){
   const panel=root.locator('[data-education-panel]:visible'),logo=panel.locator('[data-education-logo]');
   assert.equal(await root.locator('[data-education-panel]:visible').count(),1,'one selected chapter');
   assert.equal(await root.locator('.school-mark,.school-mark-fallback').count(),0);
   assert.equal(await logo.count(),i===0?0:1);
   if(i>0){
    assert.equal(await logo.getAttribute('src'),'/school-logos/'+files[i]);
    assert.ok(existsSync('public'+await logo.getAttribute('src')));
    await logo.evaluate(n=>n.decode());
    const style=await logo.evaluate(n=>{
     const layer=n.parentElement,entry=layer.parentElement,s=getComputedStyle(layer),image=getComputedStyle(n),r=n.getBoundingClientRect(),e=entry.getBoundingClientRect();
     return {loaded:n.naturalWidth>0&&!n.hidden,alt:n.alt,decorative:layer.getAttribute('aria-hidden'),
      opacity:+s.opacity,filter:image.filter,fit:image.objectFit,position:s.position,pointer:s.pointerEvents,
      width:r.width,centerX:Math.abs((r.left+r.right-e.left-e.right)/2),centerY:Math.abs((r.top+r.bottom-e.top-e.bottom)/2),rotation:Math.atan2(new DOMMatrixReadOnly(image.transform).b,new DOMMatrixReadOnly(image.transform).a),mask:image.maskImage,clip:getComputedStyle(entry).overflowX,
      backgroundZ:+s.zIndex,contentZ:[...entry.children].filter(c=>c!==layer).map(c=>+getComputedStyle(c).zIndex)};
    });
    assert.ok(style.loaded);assert.equal(style.alt,'');assert.equal(style.decorative,'true');
    assert.ok(style.opacity>=.04&&style.opacity<=.08,JSON.stringify(style));
    assert.doesNotMatch(style.filter,/blur/);assert.equal(style.fit,'contain');
    assert.ok(style.centerX<1&&style.centerY<1,'seal is centered: '+JSON.stringify(style));
    assert.equal(style.rotation,0,'seal stays upright');assert.equal(style.mask,'none','seal is not softened by an edge mask');
    assert.equal(style.position,'absolute');assert.equal(style.pointer,'none');assert.ok(style.width>=220);
    assert.ok(['clip','hidden'].includes(style.clip));
    assert.ok(style.contentZ.every(z=>z>style.backgroundZ),'text is above watermark');
   }
   assert.ok(await panel.locator('h3').isVisible());
   assert.ok(await panel.locator('.education-location').isVisible());
   assert.ok(await panel.locator('.education-note').isVisible());
   assert.ok(await panel.locator('.education-recognition').isVisible());
   assert.ok(await panel.evaluate(n=>n.scrollWidth<=n.clientWidth),'card text wraps at '+width);
   assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no page overflow at '+width);
   heights.push((await root.locator('.education-card').boundingBox()).height);
   if((i===3||i===files.length-1)&&[1366,390].includes(width)){
    await p.evaluate(()=>document.activeElement?.blur());
    await root.locator('.education-card').evaluate(n=>n.scrollIntoView({block:'center',behavior:'instant'}));
    await p.screenshot({path:folder+'/watermark-'+(i+1)+'-'+width+'.png',timeout:20000,style:'astro-dev-toolbar,.floating-navigation,.skip-link {visibility:hidden!important}'});
   }
   if(i<files.length-1)await root.locator('[data-education-next]').click();
  }
  assert.ok(Math.max(...heights)-Math.min(...heights)<2,'card remains stable across chapters at '+width);
  results.push({width,chapters:7,heights});
 }
 evidence.push({watermarks:results});
});
