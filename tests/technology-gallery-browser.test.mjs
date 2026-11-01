import assert from 'node:assert/strict';
import {before,after,test} from 'node:test';
import {createServer} from 'node:http';
import {readFile,stat,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join,extname,sep} from 'node:path';
import {chromium} from 'playwright-core';
const folder='.cache/technology-chamber',root=resolve('dist');
let browser,server,base;const evidence={errors:[],widths:[]};
before(async()=>{
 await mkdir(folder,{recursive:true});
 server=createServer(async(req,res)=>{try{let file=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(file!==root&&!file.startsWith(root+sep))throw Error();if((await stat(file)).isDirectory())file=join(file,'index.html');res.writeHead(200,{'Content-Type':({'.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.html':'text/html','.css':'text/css','.js':'text/javascript','.webp':'image/webp','.woff2':'font/woff2','.pdf':'application/pdf'})[extname(file)]??'application/octet-stream'});res.end(await readFile(file))}catch{res.writeHead(404);res.end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({channel:'msedge',headless:true});
});
after(async()=>{await browser?.close();if(server)await new Promise(r=>server.close(r));await writeFile(folder+'/results.json',JSON.stringify(evidence,null,2));assert.deepEqual(evidence.errors,[])});
async function open(t,width=1366,options={}){
 const ctx=await browser.newContext({colorScheme:'dark',viewport:{width,height:900},reducedMotion:'reduce',...options});t.after(()=>ctx.close());
 const p=await ctx.newPage();p.setDefaultTimeout(8000);p.on('pageerror',e=>evidence.errors.push(e.message));await p.goto(base,{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);return p;
}

async function focusTech(p,id){
 const current=await p.locator('[data-technology-explorer]').getAttribute('data-gallery-view');
 if(current==='focus'){await p.locator('[data-tech-switch]').selectOption(id)}else await p.locator('button[data-technology="'+id+'"]').click();
 await p.waitForFunction(id=>document.querySelector('[data-technology-explorer]').dataset.selectedTechnology===id&&document.querySelector('[data-technology-explorer]').dataset.galleryView==='focus',id);
}
test('default toolkit is a four-category logo gallery with every verified technology and the combined intro',async t=>{
 const p=await open(t);assert.equal(await p.locator('[data-tech-gallery]').count(),1);
 assert.equal(await p.locator('[data-technology-explorer]').getAttribute('data-gallery-view'),'overview');
 assert.equal(await p.locator('[data-tech-category]').count(),4);
 assert.equal(await p.locator('button[data-technology]').count(),24);
 assert.equal(await p.locator('[data-tech-focus]').isVisible(),false);
 assert.equal(await p.locator('#tech-stack .section-introduction').textContent(),'A growing toolkit, connected by curiosity. Choose a technology to find the work behind it.');
 assert.equal(await p.locator('#tech-stack .section-introduction br').count(),0);
 assert.equal(await p.locator('.technology-constellation,.skills-bento,.constellation-stage').count(),0);
});
test('all technology buttons and direct switching expose exactly the verified descriptions and project associations',async t=>{
 const p=await open(t),{technologies}=await import('../src/data/technologies.ts'),{technologyDetails}=await import('../src/data/technology-details.ts'),{projects}=await import('../src/data/projects.ts');
 for(const tech of technologies){
  await focusTech(p,tech.id);
  assert.equal(await p.locator('[data-tech-name]').textContent(),tech.name);
  assert.equal(await p.locator('[data-tech-category-name]').textContent(),tech.category);
  assert.equal(await p.locator('[data-tech-description]').textContent(),technologyDetails[tech.id].description);
  const expected=projects.filter(project=>project.technologyIds.includes(tech.id)).map(project=>project.title);
  assert.deepEqual(await p.locator('[data-tech-projects] a').allTextContents(),expected);
  assert.deepEqual(await p.locator('[data-project][data-related="true"] h3').allTextContents(),expected);
 }
 await p.locator('[data-tech-back]').click();
 assert.equal(await p.locator('button[data-technology="powerbi"]').evaluate(n=>n===document.activeElement),true);
});
test('gallery logo associations use local files, preserve proportions and fall back cleanly on image failure',async t=>{
 const p=await open(t),icons=JSON.parse(await readFile('src/data/technology-icons.json','utf8'));
 for(const [id,icon] of Object.entries(icons)){
  const button=p.locator('button[data-technology="'+id+'"]');assert.match(await button.getAttribute('aria-label'),new RegExp(id==='csharp'?'C#':id==='react-native'?'React Native':'.+'));
  if(icon.src){const img=button.locator('img');assert.equal(await img.getAttribute('src'),icon.src);await img.scrollIntoViewIfNeeded();await p.waitForFunction(n=>n.complete&&n.naturalWidth>0,await img.elementHandle(),{timeout:8000});await img.evaluate(n=>n.decode());assert.ok(await img.evaluate(n=>n.naturalWidth>0));assert.equal(await img.evaluate(n=>getComputedStyle(n).objectFit),'contain');assert.ok(await img.evaluate(n=>{const image=n.getBoundingClientRect(),slot=n.parentElement.getBoundingClientRect();return image.width<=slot.width+1&&image.height<=slot.height+1}),'decoded '+id+' logo fits its slot')}
  else assert.ok(await button.locator('[data-tech-icon-fallback]').isVisible());
 }
 await p.locator('button[data-technology="react"] img').evaluate(n=>n.src='data:image/svg+xml,broken');
 await p.waitForFunction(()=>document.querySelector('button[data-technology="react"] [data-tech-icon-fallback]').hidden===false);
 assert.equal(await p.locator('button[data-technology="react"] img').isVisible(),false);
});
test('keyboard activation, Back, Escape and project navigation keep focus and project selection coherent',async t=>{
 const p=await open(t),button=p.locator('button[data-technology="astro"]');
 await button.focus();assert.equal(await p.locator('[data-tech-focus]').isVisible(),false,'focus alone does not replace the gallery');
 await p.keyboard.press('Enter');await p.waitForFunction(()=>document.querySelector('[data-technology-explorer]').dataset.galleryView==='focus');
 assert.equal(await p.locator('[data-tech-name]').textContent(),'Astro');assert.ok(await p.locator('[data-tech-projects] a[href="#project-seek-first-books"]').isVisible());
 await p.keyboard.press('Escape');assert.equal(await button.evaluate(n=>n===document.activeElement),true);assert.equal(await p.locator('[data-tech-focus]').isVisible(),false);
 await button.click();await p.locator('[data-tech-projects] a[href="#project-seek-first-books"]').click();
 await p.waitForFunction(()=>document.querySelector('[data-project-orbit]').dataset.selectedProject==='seek-first-books');
 assert.equal(await p.locator('#fresh-companion').count(),1);
});
test('category zoom starts at the clicked category, respects logo proportions and reverses to the source',async t=>{
 const p=await open(t,1366,{reducedMotion:'no-preference'});
 const button=p.locator('button[data-technology="react"]');
 await button.scrollIntoViewIfNeeded();
 const origin=await button.evaluate(n=>n.closest('[data-tech-category]').getBoundingClientRect().toJSON());
 await button.evaluate(n=>n.click());
 const start=await p.locator('[data-tech-zoom-plane]').evaluate(n=>{
  const animation=n.getAnimations()[0];if(!animation)return null;animation.pause();animation.currentTime=0;
  return n.getBoundingClientRect().toJSON();
 });
 assert.ok(start);for(const key of ['left','top','width','height'])assert.ok(Math.abs(start[key]-origin[key])<3,'zoom starts at source '+key+': '+JSON.stringify({start,origin}));
 await p.locator('[data-tech-zoom-layer]').evaluate(n=>n.getAnimations({subtree:true}).forEach(a=>a.finish()));
 await p.waitForFunction(()=>document.querySelector('[data-technology-explorer]').dataset.galleryView==='focus');
 await p.locator('[data-tech-back]').evaluate(n=>n.click());
 assert.ok(await p.locator('[data-tech-zoom-plane]').count());
 await p.locator('[data-tech-zoom-layer]').evaluate(n=>n.getAnimations({subtree:true}).forEach(a=>a.finish()));
 await p.waitForFunction(()=>document.querySelector('[data-technology-explorer]').dataset.galleryView==='overview');
 assert.equal(await button.evaluate(n=>n===document.activeElement),true);
 assert.equal(await p.locator('[data-tech-zoom-layer]').evaluate(n=>n.children.length),0);
});
test('rapid selection, cancellation and Pause or reduced motion cannot leave stale focus content',async t=>{
 const p=await open(t,1366,{reducedMotion:'no-preference'});
 await p.locator('button[data-technology="react"]').evaluate(n=>n.click());
 await p.locator('button[data-technology="python"]').evaluate(n=>n.click());
 await p.locator('button[data-technology="gemini"]').evaluate(n=>n.click());
 await p.waitForFunction(()=>document.querySelector('[data-technology-explorer]').dataset.galleryView==='focus');
 assert.equal(await p.locator('[data-tech-name]').textContent(),'Gemini API');
 await p.locator('[data-tech-back]').evaluate(n=>n.click());
 await p.locator('[data-fresh-pause]').evaluate(n=>n.click());
 await p.waitForFunction(()=>document.querySelector('[data-fresh-pause]')?.getAttribute('aria-pressed')==='true');
 assert.equal(await p.locator('[data-technology-explorer]').getAttribute('data-gallery-view'),'overview');
 assert.equal(await p.locator('[data-tech-zoom-layer]').evaluate(n=>n.getAnimations({subtree:true}).length),0);
 await p.emulateMedia({reducedMotion:'reduce'});await focusTech(p,'typescript');
 assert.equal(await p.locator('[data-tech-zoom-layer]').evaluate(n=>n.getAnimations({subtree:true}).length),0);
 await p.locator('[data-tech-back]').click();assert.equal(await p.locator('[data-technology-explorer]').getAttribute('data-gallery-view'),'overview');
});
test('without JavaScript all categories, native definitions and project relationships remain accessible',async t=>{
 const p=await open(t,390,{javaScriptEnabled:false});
 assert.equal(await p.locator('[data-tech-category]').count(),4);assert.equal(await p.locator('[data-tech-static] details').count(),24);
 await p.locator('#technology-astro summary').click();assert.ok(await p.locator('#technology-astro p').first().isVisible());
 await p.locator('#technology-astro a[href="#project-seek-first-books"]').click();
 assert.ok(await p.locator('#project-seek-first-books').isVisible());assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
});
for(const width of [1920,1366,1024,768,390,320])test('gallery, focus content and single Mr. Fresh dock fit safely at '+width+'px',async t=>{
 const p=await open(t,width),gallery=p.locator('[data-tech-gallery]');
 await p.locator('[data-fresh-dock="tech-stack"]').scrollIntoViewIfNeeded();
 await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.currentSection==='tech-stack');
 const overview=await p.locator('[data-fresh-dock="tech-stack"]').evaluate(n=>{window.__sameTechDock=n;return n.parentElement.id});
 assert.equal(overview,'tech-overview-anchor');
 const layout=await p.locator('[data-tech-gallery]').evaluate(root=>{
  const cards=[...root.querySelectorAll('[data-tech-category]')].map(n=>({name:n.dataset.techCategory,...n.getBoundingClientRect().toJSON(),fits:n.scrollWidth<=n.clientWidth+1&&n.scrollHeight<=n.clientHeight+1}));
  return {cards,host:root.querySelector('#tech-overview-anchor').getBoundingClientRect().toJSON(),stage:root.querySelector('[data-tech-views]').getBoundingClientRect().toJSON(),isolated:!root.querySelector('[data-tech-overview]').contains(root.querySelector('[data-fresh-dock="tech-stack"]'))};
 });
 const [frontend,backend,languages,tools]=layout.cards;
 assert.deepEqual(layout.cards.map(c=>c.name),['Frontend Development','Backend and Databases','Programming Languages','Developer Tools']);
 const near=(a,b)=>Math.abs(a-b)<1;
 const overlaps=(a,b)=>a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1;
 assert.ok(layout.cards.every(c=>near(c.width,frontend.width)&&near(c.height,frontend.height)&&c.fits),'all four chambers have equal, unclipped dimensions: '+JSON.stringify(layout));
 assert.ok(near(frontend.top,backend.top)&&near(languages.top,tools.top)&&languages.top>frontend.bottom,'two consistent rows');
 assert.ok(frontend.right<backend.left&&languages.right<tools.left,'category spacing');
 assert.ok(layout.isolated,'mascot stays outside the inert overview');
 assert.ok(layout.cards.every(c=>!overlaps(c,layout.host)),'chambers do not overlap the mascot');
 assert.ok(near(layout.host.left+layout.host.width/2,layout.stage.left+layout.stage.width/2),'host centered on stage');
 if(width>=1024){
  assert.ok(languages.right+16<=layout.host.left&&layout.host.right+16<=tools.left,'clear space around centered bottom mascot');
  assert.ok(layout.host.top>=languages.top&&layout.host.bottom<=languages.bottom,'host stays in bottom row');
  assert.ok(near(frontend.left-layout.stage.left,layout.stage.right-backend.right),'top pair symmetrical');
  assert.ok(near(languages.left,layout.stage.left)&&near(tools.right,layout.stage.right),'bottom chambers at outer edges');
 }else{
  assert.ok(near(frontend.left,languages.left)&&near(backend.left,tools.left),'two aligned responsive columns');
  assert.ok(layout.host.top>=languages.bottom,'responsive mascot beneath the grid');
 }
 const cols=2;

 const targets=await p.locator('button[data-technology]').evaluateAll(ns=>ns.map(n=>n.getBoundingClientRect()).every(r=>r.width>=44&&r.height>=44));
 assert.ok(targets);assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 if([1366,390].includes(width))await p.locator('#tech-stack').screenshot({path:folder+'/overview-'+width+'.png',timeout:20000,style:'astro-dev-toolbar,.floating-navigation,.skip-link {visibility:hidden!important}'});
 await focusTech(p,'react');
 await p.locator('#tech-focus-anchor').scrollIntoViewIfNeeded();
 await p.waitForFunction(()=>document.querySelector('[data-fresh-dock="tech-stack"]').parentElement.id==='tech-focus-anchor');
 assert.equal(await p.locator('[data-fresh-dock="tech-stack"]').evaluate(n=>n===window.__sameTechDock),true);
 assert.equal(await p.locator('#fresh-companion').count(),1);
 assert.equal(await p.locator('#tech-stack [data-fresh-dock]').count(),1);
 const clear=await gallery.evaluate(n=>{
  const actor=n.querySelector('#fresh-companion').getBoundingClientRect();
  return [...n.querySelectorAll('[data-tech-focus] button,[data-tech-focus] select,[data-tech-focus] a')].every(e=>{const r=e.getBoundingClientRect();return r.right<=actor.left||r.left>=actor.right||r.bottom<=actor.top||r.top>=actor.bottom});
 });
 assert.ok(clear,'focus content does not overlap mascot');assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 try{await p.locator('[data-fresh-pet]').click()}catch(error){
  const info=await p.evaluate(()=>{const h=document.querySelector('#fresh-companion'),b=h?.querySelector('[data-fresh-pet]');return {scrollY,active:document.activeElement?.outerHTML.slice(0,250),host:h?.dataset,hostRect:h?.getBoundingClientRect().toJSON(),buttonRect:b?.getBoundingClientRect().toJSON(),dock:h?.parentElement?.outerHTML.slice(0,200),gallery:document.querySelector('[data-tech-gallery]')?.dataset}});
  throw new Error('Tech Pet state: '+JSON.stringify(info),{cause:error});
 }await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.pose==='happy-content');
 if([1366,390].includes(width))await p.locator('#tech-stack').screenshot({path:folder+'/focus-'+width+'.png',timeout:20000,style:'astro-dev-toolbar,.floating-navigation,.skip-link {visibility:hidden!important}'});
 await p.locator('[data-tech-back]').click();
 assert.equal(await p.locator('[data-technology-explorer]').getAttribute('data-gallery-view'),'overview');
 assert.equal(await p.locator('[data-fresh-dock="tech-stack"]').evaluate(n=>n.parentElement.id),'tech-overview-anchor');
 evidence.widths.push({width,columns:cols,targets,mascotClear:clear,layout});
});
test('technology fragments and page restoration keep one controller with selected data, without obsolete motion targets',async t=>{
 const p=await open(t);
 await p.goto(base+'/#technology-mysql',{waitUntil:'networkidle'});await p.waitForFunction(()=>document.querySelector('[data-technology-explorer]').dataset.galleryView==='focus');
 assert.equal(await p.locator('[data-tech-name]').textContent(),'MySQL');
 await p.evaluate(()=>{window.dispatchEvent(new PageTransitionEvent('pagehide'));window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}))});
 assert.equal(await p.locator('[data-tech-name]').textContent(),'MySQL');
 await p.locator('[data-tech-back]').click();await focusTech(p,'astro');assert.equal(await p.locator('[data-tech-name]').textContent(),'Astro');
 assert.equal(await p.locator('.technology-constellation,.constellation-orbits,.skills-bento').count(),0);
 assert.equal(await p.locator('[data-fresh-dock][data-page-motion-target],#tech-stack [data-tech-zoom-layer][data-page-motion-target]').count(),0);
 assert.equal(await p.locator('#fresh-companion').count(),1);
});

test('Escape cancels an opening zoom even after the source becomes inert',async t=>{
 const p=await open(t,1366,{reducedMotion:'no-preference'});
 // Settle native focus scrolling before measuring cancellation of the gallery's own opening transition.
 await p.locator('#tech-stack').evaluate(n=>n.scrollIntoView({behavior:'instant'}));
 await p.waitForFunction(()=>{const h=document.querySelector('#fresh-companion');return h.dataset.currentSection==='tech-stack'&&h.dataset.state==='idle'});
 await p.locator('button[data-technology="react"]').scrollIntoViewIfNeeded();
 await p.evaluate(()=>{window['__techKeys']=[];document.addEventListener('keydown',e=>{if(['Enter','Escape'].includes(e.key))window['__techKeys'].push({key:e.key,scrollY,active:document.activeElement?.tagName,view:document.querySelector('[data-tech-gallery]')?.dataset.galleryView,host:{...document.querySelector('#fresh-companion')?.dataset}})},true)});
 const button=p.locator('button[data-technology="react"]');await button.focus();await p.keyboard.press('Enter');
 assert.equal(await p.locator('[data-tech-gallery]').getAttribute('data-gallery-view'),'opening');
 await p.keyboard.press('Escape');
 try{await p.waitForFunction(()=>document.querySelector('[data-tech-gallery]').dataset.galleryView==='overview')}catch(error){throw new Error('Tech Escape state: '+JSON.stringify(await p.evaluate(()=>({keys:window['__techKeys'],scrollY,active:document.activeElement?.outerHTML.slice(0,250),host:document.querySelector('#fresh-companion')?.dataset,gallery:document.querySelector('[data-tech-gallery]')?.dataset}))),{cause:error})}
 assert.equal(await button.evaluate(n=>n===document.activeElement),true);
 assert.equal(await p.locator('[data-tech-zoom-layer]').evaluate(n=>n.children.length),0);
});
test('scrolling away during a zoom cannot pull the visitor back or steal focus',async t=>{
 const p=await open(t,1366,{reducedMotion:'no-preference'});
 await p.locator('button[data-technology="react"]').click();
 const position=await p.evaluate(()=>{window.scrollTo({top:document.querySelector('#contact').offsetTop,behavior:'instant'});return {y:scrollY,contact:document.querySelector('#contact').getBoundingClientRect().top,height:document.documentElement.scrollHeight}});
 await p.waitForTimeout(800);
 const after=await p.evaluate(()=>({y:scrollY,contact:document.querySelector('#contact').getBoundingClientRect().top,height:document.documentElement.scrollHeight}));
 // Overview and focus now have different heights. Native scroll anchoring may change
 // absolute scrollY while correctly preserving the content the visitor is reading.
 assert.ok(Math.abs(after.contact-position.contact)<8,'completed zoom must preserve the visible Contact position: '+JSON.stringify({position,after}));
 assert.ok(Math.abs((after.y-position.y)-(after.height-position.height))<8,'scroll adjustment matches the layout height change');
 assert.equal(await p.locator('[data-tech-focus]').evaluate(n=>n===document.activeElement),false);
});
test('returning to the overview waits until an active physical mascot action finishes',async t=>{
 const p=await open(t,768,{reducedMotion:'no-preference'});await focusTech(p,'react');
 await p.locator('#tech-focus-anchor').scrollIntoViewIfNeeded();
 await p.waitForFunction(()=>{const h=document.querySelector('#fresh-companion');return h.dataset.currentSection==='tech-stack'&&h.dataset.state==='idle'});
 const actor=await p.locator('[data-fresh-actor]').boundingBox();
 await p.mouse.move(actor.x+actor.width*.5,actor.y+actor.height*.5);await p.mouse.down();
 await p.mouse.move(actor.x+actor.width*.5-30,actor.y+actor.height*.5-35,{steps:5});
 assert.equal(await p.locator('#fresh-companion').getAttribute('data-state'),'dragging');
 const top=await p.locator('[data-fresh-dock="tech-stack"]').evaluate(n=>n.getBoundingClientRect().top);
 await p.locator('[data-tech-back]').evaluate(n=>n.click());
 assert.equal(await p.locator('[data-tech-gallery]').getAttribute('data-gallery-view'),'focus');
 assert.ok(Math.abs(await p.locator('[data-fresh-dock="tech-stack"]').evaluate(n=>n.getBoundingClientRect().top)-top)<1);
 await p.mouse.up();await p.keyboard.press('Escape');
 await p.waitForFunction(()=>document.querySelector('[data-tech-gallery]').dataset.galleryView==='overview');
 assert.equal(await p.locator('[data-fresh-dock="tech-stack"]').evaluate(n=>n.parentElement.id),'tech-overview-anchor');
 assert.equal(await p.locator('#fresh-companion').count(),1);
});

test('a newer deferred technology selection cannot be overwritten by an older zoom completion',async t=>{
 const p=await open(t,1366,{reducedMotion:'no-preference'});
 await p.locator('button[data-technology="react"]').scrollIntoViewIfNeeded();
 await p.evaluate(()=>{
  document.querySelector('button[data-technology="react"]').click();
  const host=document.querySelector('#fresh-companion');host.dataset.currentSection='tech-stack';host.dataset.state='airborne';
  location.hash='technology-python';
 });
 await p.waitForTimeout(700);
 await p.locator('#fresh-companion').evaluate(n=>n.dataset.state='idle');
 await p.waitForFunction(()=>document.querySelector('[data-tech-gallery]').dataset.galleryView==='focus');
 assert.equal(await p.locator('[data-tech-name]').textContent(),'Python');
});
test('a deferred Back retains the original focus boundary after the visitor scrolls away',async t=>{
 const p=await open(t,1366,{reducedMotion:'no-preference'});await focusTech(p,'react');
 await p.evaluate(()=>{
  const host=document.querySelector('#fresh-companion');host.dataset.currentSection='tech-stack';host.dataset.state='airborne';
  document.querySelector('[data-tech-back]').click();
  window.scrollTo({top:document.querySelector('#contact').offsetTop,behavior:'instant'});
 });
 const position=await p.evaluate(()=>scrollY);
 await p.locator('#fresh-companion').evaluate(n=>n.dataset.state='idle');
 await p.waitForFunction(()=>document.querySelector('[data-tech-gallery]').dataset.galleryView==='overview');
 assert.ok(Math.abs(await p.evaluate(()=>scrollY)-position)<8,'deferred Back must not reclaim the viewport');
 assert.equal(await p.locator('button[data-technology="react"]').evaluate(n=>n===document.activeElement),false);
});

test('hidden-tab suspension and Pause Resume settle cleanly and can animate again',async t=>{
 const p=await open(t,1366,{reducedMotion:'no-preference'});
 await p.locator('button[data-technology="react"]').scrollIntoViewIfNeeded();
 await p.evaluate(()=>{
  document.querySelector('button[data-technology="react"]').click();
  Object.defineProperty(document,'hidden',{configurable:true,value:true});
  document.dispatchEvent(new Event('visibilitychange'));
 });
 await p.waitForFunction(()=>document.querySelector('[data-tech-gallery]').dataset.galleryView==='focus');
 assert.equal(await p.locator('[data-tech-zoom-layer]').evaluate(n=>n.getAnimations({subtree:true}).length),0);
 await p.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))});
 await p.locator('[data-tech-back]').click();
 await p.waitForFunction(()=>document.querySelector('[data-tech-gallery]').dataset.galleryView==='overview');
 await p.locator('[data-fresh-pause]').evaluate(n=>n.click());await focusTech(p,'python');
 assert.equal(await p.locator('[data-tech-zoom-layer]').evaluate(n=>n.getAnimations({subtree:true}).length),0);
 await p.locator('[data-tech-back]').click();await p.locator('[data-fresh-pause]').evaluate(n=>n.click());
 await p.locator('button[data-technology="gemini"]').evaluate(n=>n.click());
 assert.equal(await p.locator('[data-tech-gallery]').getAttribute('data-gallery-view'),'opening');
 assert.ok(await p.locator('[data-tech-zoom-layer]').evaluate(n=>n.getAnimations({subtree:true}).length)>0);
 await p.waitForFunction(()=>document.querySelector('[data-tech-gallery]').dataset.galleryView==='focus');
 assert.equal(await p.locator('[data-tech-name]').textContent(),'Gemini API');
});
test('mobile native swipes scroll the page and deliberate taps still select a technology',async t=>{
 const p=await open(t,390,{hasTouch:true,isMobile:true}),button=p.locator('button[data-technology="javascript"]');
 await button.scrollIntoViewIfNeeded();
 const box=await button.boundingBox(),x=box.x+box.width*.5,y=box.y+box.height*.5,initial=await p.evaluate(()=>scrollY);
 const cdp=await p.context().newCDPSession(p);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
 for(const distance of [30,65,100,150])await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y-distance}]});
 await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await cdp.detach();
 await p.waitForFunction(initial=>scrollY>initial+40,initial);
 assert.equal(await p.locator('[data-tech-gallery]').getAttribute('data-gallery-view'),'overview');
 await p.locator('button[data-technology="react"]').tap();
 assert.equal(await p.locator('[data-tech-name]').textContent(),'React');
 assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
});
