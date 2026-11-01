import assert from 'node:assert/strict';
import {before,after,test} from 'node:test';
import {createServer} from 'node:http';
import {readFile,stat,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join,extname,sep} from 'node:path';
import {chromium} from 'playwright-core';
const folder='.cache/project-orbit-v2',root=resolve('dist'),ids=['anthea','lifevent','seek-first-books','philchan-cebu'];
let browser,server,base;const evidence={errors:[],widths:[]};
before(async()=>{
 await mkdir(folder,{recursive:true});
 server=createServer(async(req,res)=>{try{let file=resolve(root,'.'+decodeURIComponent(new URL(req.url,'http://localhost').pathname));if(file!==root&&!file.startsWith(root+sep))throw Error();if((await stat(file)).isDirectory())file=join(file,'index.html');res.writeHead(200,{'Content-Type':({'.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.html':'text/html','.css':'text/css','.js':'text/javascript','.webp':'image/webp','.woff2':'font/woff2','.pdf':'application/pdf'})[extname(file)]??'application/octet-stream'});res.end(await readFile(file))}catch{res.writeHead(404);res.end()}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));base='http://127.0.0.1:'+server.address().port;
 browser=await chromium.launch({channel:'msedge',headless:true});
});
after(async()=>{await browser?.close();if(server)await new Promise(r=>server.close(r));await writeFile(folder+'/results.json',JSON.stringify(evidence,null,2));assert.deepEqual(evidence.errors,[])});
async function open(t,width=1366,options={},prepare){
 const ctx=await browser.newContext({colorScheme:'dark',viewport:{width,height:900},reducedMotion:'reduce',...options});t.after(()=>ctx.close());
 const p=await ctx.newPage();p.setDefaultTimeout(8000);p.on('pageerror',e=>evidence.errors.push(e.message));if(prepare)await prepare(p);await p.goto(base,{waitUntil:'networkidle'});await p.evaluate(()=>document.fonts.ready);return p;
}

async function fullCapabilities(p){
 await p.addInitScript(()=>{Object.defineProperty(navigator,'hardwareConcurrency',{get:()=>8});Object.defineProperty(navigator,'deviceMemory',{get:()=>8})});
}

async function selected(p,id){
 assert.equal(await p.locator('[data-project-orbit]').getAttribute('data-selected-project'),id);
 // Selection is immediate; the outgoing panel has an intentional 100ms exit before the new panel renders.
 await p.waitForFunction(id=>document.querySelector('[data-project]:not(.is-inactive)')?.getAttribute('data-project')===id,id,{timeout:2000});
 assert.equal(await p.locator('[data-project]:visible').count(),1);
 assert.equal(await p.locator('[data-project]:visible').getAttribute('data-project'),id);
 assert.equal(await p.locator('[data-orbit-item][aria-pressed="true"]').getAttribute('data-orbit-item'),id);
}
test('Orbit defaults to Anthea with one selected panel, four labeled items and the combined intro',async t=>{
 const p=await open(t);assert.equal(await p.locator('[data-project-orbit]').count(),1);await selected(p,'anthea');
 assert.equal(await p.locator('[data-orbit-item]').count(),4);
 assert.equal(await p.locator('#projects .section-introduction').textContent(),'Four projects. Different problems. A closer look at the part I played.');
 assert.equal(await p.locator('#projects .section-introduction br').count(),0);
 assert.equal((await p.locator('[data-orbit-indicator]').textContent()).trim(),'01 / 04');
 for(const id of ids)assert.match(await p.locator('[data-orbit-item="'+id+'"]').getAttribute('aria-label'),/Select/);
});
test('Arrows cycle in both directions, direct selection is exact and native case studies retain their content',async t=>{
 const p=await open(t);
 for(const id of ['lifevent','seek-first-books','philchan-cebu','anthea']){await p.locator('[data-orbit-next]').click();await selected(p,id)}
 await p.locator('[data-orbit-prev]').click();await selected(p,'philchan-cebu');
 for(const id of ids){
  await p.locator('[data-orbit-item="'+id+'"]').click();await selected(p,id);
  const panel=p.locator('[data-project="'+id+'"]');
  await panel.locator('summary').focus();await p.keyboard.press('Enter');
  assert.equal(await panel.locator('.case-study').evaluate(n=>n.open),true);assert.ok(await panel.locator('.case-study-content').isVisible());
  await p.keyboard.press('Enter');assert.equal(await panel.locator('.case-study').evaluate(n=>n.open),false);
 }
 assert.equal(await p.locator('[data-project="lifevent"] a[data-source]').count(),0);
 assert.match(await p.locator('[data-project="lifevent"]').textContent(),/login/i);
 assert.match(await p.locator('[data-project="lifevent"]').textContent(),/rate limiting/i);
});
test('Orbit keyboard navigation and project fragments reveal the matching project without trapping focus',async t=>{
 const p=await open(t);await p.locator('[data-orbit-item="anthea"]').focus();
 for(const [key,id] of [['ArrowLeft','philchan-cebu'],['Home','anthea'],['End','philchan-cebu'],['ArrowRight','anthea']]){
  await p.keyboard.press(key);await selected(p,id);assert.equal(await p.locator('[data-orbit-item="'+id+'"]').evaluate(n=>n===document.activeElement),true);
 }
 await p.keyboard.press('Tab');assert.notEqual(await p.evaluate(()=>document.activeElement?.getAttribute('data-orbit-item')),'anthea');
 await p.goto(base+'/#project-seek-first-books',{waitUntil:'networkidle'});await selected(p,'seek-first-books');
 await p.reload({waitUntil:'networkidle'});await selected(p,'seek-first-books');
 await p.locator('button[data-technology="react"]').click();
 await p.locator('[data-tech-projects] a[href="#project-anthea"]').click();await selected(p,'anthea');
});
test('Horizontal swipes select projects while actual vertical touch swipes keep scrolling native',async t=>{
 const p=await open(t,390,{hasTouch:true,isMobile:true}),surface=p.locator('[data-orbit-surface]');
 await surface.evaluate(n=>n.scrollIntoView({block:'start',behavior:'instant'}));
 const r=await surface.boundingBox(),x=r.x+r.width*.52,y=r.y+r.height-16;
 assert.equal(await p.evaluate(({x,y})=>!!document.elementFromPoint(x,y)?.closest('button,[data-fresh-dock]'),{x,y}),false,'swipe starts on the dedicated surface, not a project button or mascot');
 const cdp=await p.context().newCDPSession(p);
 async function swipe(dx,dy){
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y}]});
  for(let i=1;i<=8;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/8,y:y+dy*i/8}]});await p.waitForTimeout(20)}
  await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(150);
 }
 await swipe(-90,4);await selected(p,'lifevent');
 const before=await p.evaluate(()=>scrollY);await swipe(3,-130);
 assert.ok(await p.evaluate(()=>scrollY)>before+40);await selected(p,'lifevent');
 await cdp.detach();
});
test('Rapid normal-motion selection has curved intermediate positions and no stale animations; Pause and reduced motion settle safely',async t=>{
 const p=await open(t,1366,{reducedMotion:'no-preference'});
 await p.waitForFunction(()=>document.querySelector('#fresh-companion')?.dataset.ready==='true');
 await p.locator('[data-orbit-surface]').evaluate(n=>n.scrollIntoView({block:'center',behavior:'instant'}));
 const item=p.locator('[data-orbit-position="lifevent"]'),before=await item.evaluate(n=>getComputedStyle(n).transform);
 await p.locator('[data-orbit-next]').click();await p.waitForTimeout(180);
 assert.notEqual(await item.evaluate(n=>getComputedStyle(n).transform),before);
 assert.equal(await p.locator('[data-project-orbit]').getAttribute('data-orbit-moving'),'true');
 await p.locator('[data-orbit-item="seek-first-books"]').evaluate(n=>n.click());
 await p.locator('[data-orbit-item="anthea"]').evaluate(n=>n.click());
 await p.locator('[data-orbit-item="philchan-cebu"]').evaluate(n=>n.click());
 await p.waitForFunction(()=>document.querySelector('[data-project-orbit]').dataset.orbitMoving==='false');
 await selected(p,'philchan-cebu');assert.equal(await p.locator('[data-project-orbit]').evaluate(n=>n.getAnimations({subtree:true}).filter(a=>a.playState==='running'&&!a.effect.target.closest('#fresh-companion')).length),0);
 await p.locator('[data-orbit-next]').click();
 await p.locator('[data-fresh-pause]').click();
 await p.waitForFunction(()=>document.querySelector('[data-fresh-pause]')?.getAttribute('aria-pressed')==='true');
 assert.equal(await p.locator('[data-project-orbit]').getAttribute('data-orbit-moving'),'false');
 await p.locator('[data-orbit-next]').click();await selected(p,'lifevent');
 assert.equal(await p.locator('[data-project-orbit]').getAttribute('data-orbit-moving'),'false');
 await p.locator('[data-fresh-pause]').click();await p.waitForFunction(()=>document.querySelector('#fresh-companion')?.dataset.ready==='true');
 await p.locator('[data-orbit-next]').click();assert.equal(await p.locator('[data-project-orbit]').getAttribute('data-orbit-moving'),'true','resuming allows a new real rotation');
 await p.waitForFunction(()=>document.querySelector('[data-project-orbit]').dataset.orbitMoving==='false');await selected(p,'seek-first-books');
 await p.emulateMedia({reducedMotion:'reduce'});
 await p.locator('[data-orbit-next]').click();await selected(p,'philchan-cebu');
 assert.equal(await p.locator('[data-project-orbit]').getAttribute('data-orbit-moving'),'false');
});
test('Production keeps verified links and withholds restricted PhilCHAN media and destinations',async t=>{
 const p=await open(t);
 for(const [id,url,repo] of [['anthea','https://anthea-ruby.vercel.app/','https://github.com/Haste04/Anthea'],['lifevent','https://phlifevent.vercel.app/',null],['seek-first-books','https://seek-alpha.vercel.app/','https://github.com/Haste04/Bookkeeping-Landing-Page']]){
  await p.locator('[data-orbit-item="'+id+'"]').click();
  assert.equal(await p.locator('#project-'+id+' [data-live]').getAttribute('href'),url);
  if(repo)assert.equal(await p.locator('#project-'+id+' [data-source]').getAttribute('href'),repo);
 }
 await p.locator('[data-orbit-item="philchan-cebu"]').click();const card=p.locator('#project-philchan-cebu');
 assert.equal(await card.locator('img,a[data-live],a[data-source]').count(),0);assert.equal(await card.locator('[data-media-withheld]').count(),1);
 assert.equal((await p.request.get(base+'/__local-media/philchan-cebu.webp')).status(),404);
 const html=await readFile(join(root,'index.html'),'utf8');assert.ok(!html.includes('https://philchan-cebu.vercel.app/'));assert.ok(!html.includes('https://github.com/Haste04/Philchan-Cebu'));
 assert.equal(await p.getByText('FuelWatch',{exact:false}).count(),0);
});
test('Without JavaScript every project remains readable with native case-study disclosures',async t=>{
 const p=await open(t,390,{javaScriptEnabled:false});
 assert.equal(await p.locator('[data-project]:visible').count(),4);
 for(const id of ids){const panel=p.locator('#project-'+id);await panel.locator('summary').click();assert.equal(await panel.locator('.case-study').evaluate(n=>n.open),true);assert.ok(await panel.locator('h3').isVisible())}
 assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
});
for(const width of [1920,1366,1024,768,390,320])test('Orbit and its shared mascot fit safely at '+width+'px',async t=>{
 const p=await open(t,width),surface=p.locator('[data-orbit-surface]');
 const title=p.locator('#project-orbit-heading');assert.ok(await title.evaluate(n=>n.scrollWidth<=n.clientWidth+1),'readable unclipped component heading');
 if(width>=1024)assert.ok(await title.evaluate(n=>n.getBoundingClientRect().height<=parseFloat(getComputedStyle(n).lineHeight)+1),'one-line desktop orbit title');
 if(width<768)assert.equal(await p.locator('[data-orbit-camera]').evaluate(n=>getComputedStyle(n).perspective),'none','mobile uses a lightweight flat carousel');
 await surface.evaluate(n=>n.scrollIntoView({block:'center',behavior:'instant'}));
 await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.dock==='project-orbit');
 assert.equal(await p.locator('#fresh-companion').count(),1);
 assert.equal(await p.locator('#projects [data-fresh-dock]').count(),1);
 const safe=await p.locator('[data-project-orbit]').evaluate(n=>{
  const overlap=(a,b)=>!(a.right<=b.left||b.right<=a.left||a.bottom<=b.top||b.bottom<=a.top);
  const items=[...n.querySelectorAll('[data-orbit-item]')].map(x=>x.getBoundingClientRect()),buttons=[...n.querySelectorAll('.fresh-controls button')].map(x=>x.getBoundingClientRect());
  const actor=n.querySelector('[data-fresh-actor]').getBoundingClientRect();
  return {overflow:document.documentElement.scrollWidth>innerWidth,items:items.map(r=>r.toJSON()),targets:items.every(r=>r.width>=44&&r.height>=44&&r.left>=0&&r.right<=innerWidth),itemOverlap:items.some((a,i)=>items.slice(i+1).some(b=>overlap(a,b))),mascotOverlap:items.some(a=>overlap(a,actor)||buttons.some(b=>overlap(a,b)))};
 });
 assert.equal(safe.overflow,false);assert.ok(safe.targets);assert.equal(safe.itemOverlap,false);assert.equal(safe.mascotOverlap,false,'orbit must leave room for mascot: '+JSON.stringify(safe));
 await p.locator('[data-fresh-pet]').click();await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.pose==='happy-content');
 for(const id of ids){await p.locator('[data-orbit-item="'+id+'"]').click();await selected(p,id);assert.ok(await p.locator('#project-'+id).evaluate(n=>n.scrollWidth<=n.clientWidth))}
 if([1920,1366,390,320].includes(width)){
  await p.locator('[data-orbit-item="anthea"]').click();await p.evaluate(()=>document.activeElement?.blur());
  await p.locator('#projects').screenshot({path:folder+'/projects-'+width+'.png',timeout:20000,style:'astro-dev-toolbar,.floating-navigation,.skip-link {visibility:hidden!important}'});
 }
 evidence.widths.push({width,...safe});
});
test('Page restoration and hidden-tab suspension retain one selector and a coherent selection',async t=>{
 const p=await open(t,1366,{reducedMotion:'no-preference'});
 await p.locator('[data-orbit-next]').click();
 await p.evaluate(()=>{window.dispatchEvent(new PageTransitionEvent('pagehide'));window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}))});
 await p.locator('[data-orbit-next]').click();await selected(p,'seek-first-books');
 assert.equal(await p.locator('[data-project-orbit]').count(),1);assert.equal(await p.locator('#fresh-companion').count(),1);
 await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});
 assert.equal(await p.locator('[data-project-orbit]').getAttribute('data-orbit-moving'),'false');
});

test('A delayed detail entrance remains cancellable after the orbital rotation ends',async t=>{
 const ctx=await browser.newContext({colorScheme:'dark',viewport:{width:1366,height:900},reducedMotion:'no-preference'});t.after(()=>ctx.close());
 await ctx.addInitScript(()=>{
  const animate=Element.prototype.animate;
  Element.prototype.animate=function(frames,options){
   if(this.matches('.orbit-project-card')&&Array.isArray(frames)&&frames[0]?.transform)options={...options,duration:1600};
   return animate.call(this,frames,options);
  };
 });
 const p=await ctx.newPage();p.on('pageerror',e=>evidence.errors.push(e.message));await p.goto(base,{waitUntil:'networkidle'});
 await p.locator('[data-orbit-next]').click();await p.waitForTimeout(950);
 assert.equal(await p.locator('[data-project-orbit]').getAttribute('data-orbit-moving'),'true','detail entrance is still owned after rotation');
 await p.locator('[data-fresh-pause]').click();
 await p.waitForFunction(()=>document.querySelector('[data-fresh-pause]')?.getAttribute('aria-pressed')==='true');
 assert.equal(await p.locator('[data-project-orbit]').getAttribute('data-orbit-moving'),'false');
 assert.equal(await p.locator('[data-project]').evaluateAll(ns=>ns.flatMap(n=>n.getAnimations()).filter(a=>a.playState==='running').length),0,'pause cancels the late entrance');
});
test('Partial initialization restores every native project and can retry without duplicate handlers',async t=>{
 const ctx=await browser.newContext({colorScheme:'dark',viewport:{width:1366,height:900},reducedMotion:'reduce'});t.after(()=>ctx.close());
 await ctx.addInitScript(()=>{
  window.__realOrbitResizeObserver=ResizeObserver;
  window.ResizeObserver=class extends ResizeObserver{
   observe(target,options){if(target.matches?.('[data-orbit-surface]'))throw Error('Injected orbit-only observer failure');return super.observe(target,options)}
  };
 });
 const p=await ctx.newPage();p.on('pageerror',e=>evidence.errors.push(e.message));await p.goto(base,{waitUntil:'networkidle'});
 assert.equal(await p.locator('[data-project]:visible').count(),4,'failed enhancement restores all content');
 assert.equal(await p.locator('[data-orbit-next]').isVisible(),false);
 assert.equal(await p.locator('[data-project][inert]').count(),0);
 await p.evaluate(()=>{window.ResizeObserver=window.__realOrbitResizeObserver;window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}))});
 await selected(p,'anthea');await p.locator('[data-orbit-next]').click();await selected(p,'lifevent');
});

test('desktop orbit has genuine perspective depth and a readable unbroken component title',async t=>{
 const p=await open(t,1920,{reducedMotion:'no-preference'},fullCapabilities);
 await p.locator('[data-orbit-surface]').scrollIntoViewIfNeeded();await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.dock==='project-orbit');
 const title=p.locator('#project-orbit-heading');
 assert.equal((await title.textContent()).replace(/\s+/g,' ').trim(),"Mr. Fresh's Project Orbit.");
 assert.equal(await title.locator('br').count(),0);
 assert.ok(await title.evaluate(n=>n.getBoundingClientRect().height<=parseFloat(getComputedStyle(n).lineHeight)+1),'desktop title stays on one line');
 const measured=await p.locator('[data-project-orbit]').evaluate(root=>({
  perspective:getComputedStyle(root.querySelector('[data-orbit-camera]')).perspective,
  poses:[...root.querySelectorAll('[data-orbit-position]')].map(n=>{const m=new DOMMatrixReadOnly(getComputedStyle(n).transform),b=n.getBoundingClientRect();return {id:n.dataset.orbitPosition,z:m.m43,width:b.width,opacity:+getComputedStyle(n).opacity}})
 }));
 assert.notEqual(measured.perspective,'none');
 const front=measured.poses[0],back=measured.poses[2];
 assert.ok(front.z>150&&back.z<-150,'actual CSS z, not a flat scale-only carousel');
 assert.ok(front.width/back.width>1.4,'meaningful projected foreground/background separation');
 assert.ok(front.opacity>back.opacity);evidence.depth=measured;
});
test('rotation changes actual depth continuously while keeping Mr Fresh reachable and rapid retargeting continuous',async t=>{
 const p=await open(t,1920,{reducedMotion:'no-preference'},fullCapabilities);await p.locator('[data-orbit-surface]').evaluate(n=>n.scrollIntoView({block:'center',behavior:'instant'}));
 await p.waitForFunction(()=>{const h=document.querySelector('#fresh-companion');return h.dataset.dock==='project-orbit'&&h.dataset.state==='idle'});
 await p.locator('[data-orbit-next]').evaluate(n=>n.click());
 async function sample(time){return p.locator('[data-project-orbit]').evaluate((root,time)=>{
  const nodes=[...root.querySelectorAll('[data-orbit-position]')];for(const n of nodes)for(const a of n.getAnimations()){a.pause();a.currentTime=time}
  const actor=root.querySelector('[data-fresh-actor]').getBoundingClientRect();
  const reachable=!!document.elementFromPoint(actor.x+actor.width/2,actor.y+actor.height/2)?.closest('[data-fresh-actor]');
  return {reachable,poses:nodes.map(n=>{const m=new DOMMatrixReadOnly(getComputedStyle(n).transform),r=n.getBoundingClientRect();return {id:n.dataset.orbitPosition,z:m.m43,width:r.width,x:r.x,y:r.y,opacity:+getComputedStyle(n).opacity,upright:Math.abs(m.m12)+Math.abs(m.m13)+Math.abs(m.m21)+Math.abs(m.m23)<.001}})};
 },time)}
 const start=await sample(0),middle=await sample(370),end=await sample(740);
 for(const state of [start,middle,end]){assert.ok(state.reachable,'central mascot hitbox remains reachable');assert.ok(state.poses.every(p=>p.upright),'labels remain billboards')}
 assert.ok(middle.poses[1].z>start.poses[1].z+60&&end.poses[1].z>middle.poses[1].z,'real intermediate depth');
 assert.ok(end.poses[1].width>start.poses[1].width+18,'visible incoming enlargement');
 const before=await sample(310);await p.locator('[data-orbit-item="seek-first-books"]').evaluate(n=>n.click());const after=await sample(0);
 before.poses.forEach((pose,i)=>{assert.ok(Math.abs(pose.z-after.poses[i].z)<1.5,'retargeting retains current depth');assert.ok(Math.hypot(pose.x-after.poses[i].x,pose.y-after.poses[i].y)<2,'retargeting retains current screen position')});
 await p.locator('[data-orbit-item="philchan-cebu"]').evaluate(n=>n.click());await p.locator('[data-orbit-item="anthea"]').evaluate(n=>n.click());
 await p.waitForFunction(()=>document.querySelector('[data-project-orbit]').dataset.orbitMoving==='false');await selected(p,'anthea');
 assert.equal(await p.locator('[data-orbit-camera][data-page-motion-target],.project-orbit-center[data-page-motion-target],[data-orbit-position][data-page-motion-target]').count(),0);
 evidence.rotation={start,middle,end};
});
test('central mascot dragging keeps its pointer coordinates during a spatial rotation',async t=>{
 const p=await open(t,1920,{reducedMotion:'no-preference'},fullCapabilities);
 await p.locator('[data-orbit-surface]').evaluate(n=>n.scrollIntoView({block:'center',behavior:'instant'}));
 await p.waitForFunction(()=>{const h=document.querySelector('#fresh-companion');return h.dataset.dock==='project-orbit'&&h.dataset.state==='idle'});
 await p.locator('[data-orbit-next]').evaluate(n=>n.click());
 await p.locator('[data-project-orbit]').evaluate(root=>{for(const n of root.querySelectorAll('[data-orbit-position]'))for(const a of n.getAnimations()){a.pause();a.currentTime=340}});
 const actor=p.locator('[data-fresh-actor]'),before=await actor.boundingBox(),x=before.x+before.width/2,y=before.y+before.height/2;
 await p.mouse.move(x,y);await p.mouse.down();await p.mouse.move(x+20,y-15,{steps:5});
 assert.equal(await p.locator('#fresh-companion').getAttribute('data-state'),'dragging');
 const during=await actor.boundingBox();assert.ok(Math.abs(during.x-before.x-20)<1,'camera does not warp mascot pointer offsets');
 await p.mouse.up();await p.keyboard.press('Escape');
 await p.locator('[data-project-orbit]').evaluate(root=>{for(const n of root.querySelectorAll('[data-orbit-position]'))for(const a of n.getAnimations())a.finish()});
 await p.waitForFunction(()=>document.querySelector('[data-project-orbit]').dataset.orbitMoving==='false');await selected(p,'lifevent');
 assert.equal(await p.locator('#fresh-companion').count(),1);
});

test('low-resource hints simplify the orbit even at a wide desktop viewport',async t=>{
 const p=await open(t,1920,{reducedMotion:'no-preference'},async page=>{
  await page.addInitScript(()=>{Object.defineProperty(navigator,'hardwareConcurrency',{get:()=>2});Object.defineProperty(navigator,'deviceMemory',{get:()=>2})});
 });
 assert.equal(await p.locator('[data-orbit-camera]').evaluate(n=>getComputedStyle(n).perspective),'none');
 assert.equal(await p.locator('[data-project-orbit]').getAttribute('data-orbit-mode'),'compact');
 await p.locator('[data-orbit-next]').click();await p.waitForFunction(()=>document.querySelector('[data-project-orbit]').dataset.orbitMoving==='false');await selected(p,'lifevent');
 assert.equal(await p.locator('[data-orbit-position]').evaluateAll(ns=>ns.every(n=>new DOMMatrixReadOnly(getComputedStyle(n).transform).m43===0)),true);
});

test('V2 projected foreground and rear sizes, asymmetric sides and readable captions are visibly different in the running browser',async t=>{
 const p=await open(t,1920,{reducedMotion:'no-preference'},fullCapabilities);
 await p.locator('[data-orbit-surface]').evaluate(n=>n.scrollIntoView({block:'center',behavior:'instant'}));
 await p.waitForFunction(()=>{const h=document.querySelector('#fresh-companion');return h.dataset.dock==='project-orbit'&&h.dataset.state==='idle'});
 const data=await p.locator('[data-project-orbit]').evaluate(root=>({
  perspective:getComputedStyle(root.querySelector('[data-orbit-camera]')).perspective,
  poses:[...root.querySelectorAll('[data-orbit-position]')].map(n=>{const r=n.getBoundingClientRect(),c=n.querySelector('.orbit-item-name'),s=getComputedStyle(n),m=new DOMMatrixReadOnly(s.transform);return{id:n.dataset.orbitPosition,z:m.m43,width:r.width,height:r.height,ratio:r.width/n.offsetWidth,opacity:+s.opacity,captionRatio:c.getBoundingClientRect().height/parseFloat(getComputedStyle(c).height),captionColor:getComputedStyle(c).color}})
 }));
 assert.ok(data.poses[0].ratio>=1.4&&data.poses[2].ratio<=.6);
 assert.ok(data.poses[0].width/data.poses[2].width>=2.4);
 assert.ok(data.poses[1].width-data.poses[3].width>=20);
 assert.ok(data.poses[2].opacity<=.55);
 assert.ok(data.poses.every(n=>n.width>=44&&n.height>=44&&n.captionRatio>=.89),'quiet rear projects retain readable labels and reachable targets');
 evidence.v2Depth=data;
});
test('V2 every intermediate orbital quadrant stays bounded and leaves the central mascot and controls reachable',async t=>{
 const p=await open(t,1366,{reducedMotion:'no-preference'},fullCapabilities);
 await p.locator('[data-orbit-surface]').evaluate(n=>n.scrollIntoView({block:'center',behavior:'instant'}));
 await p.waitForFunction(()=>{const h=document.querySelector('#fresh-companion');return h.dataset.dock==='project-orbit'&&h.dataset.state==='idle'});
 for(const direction of ['next','prev']){
  await p.locator('[data-orbit-'+direction+']').evaluate(n=>n.click());
  // Keep sampled effects inside their active interval; finish() below verifies the actual endpoint.
  for(const time of [0,100,205,310,410,615,800]){
   const safe=await p.locator('[data-project-orbit]').evaluate((root,time)=>{
    for(const n of root.querySelectorAll('[data-orbit-position]'))for(const a of n.getAnimations({subtree:true})){a.pause();a.currentTime=time}
    const actor=root.querySelector('[data-fresh-actor]').getBoundingClientRect();
    return{reachable:!!document.elementFromPoint(actor.x+actor.width/2,actor.y+actor.height/2)?.closest('[data-fresh-actor]'),bounded:[...root.querySelectorAll('[data-orbit-item]')].every(n=>{const r=n.getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&r.width>=44&&r.height>=44}),overflow:document.documentElement.scrollWidth>innerWidth};
   },time);
   assert.ok(safe.reachable&&safe.bounded&&!safe.overflow,'safe intermediate '+direction+' '+time+': '+JSON.stringify(safe));
  }
  await p.locator('[data-project-orbit]').evaluate(root=>{for(const n of root.querySelectorAll('[data-orbit-position]'))for(const a of n.getAnimations({subtree:true}))a.finish()});
  await p.waitForFunction(()=>document.querySelector('[data-project-orbit]').dataset.orbitMoving==='false');
 }
});

test('V2 shared 3D camera paints foreground icons ahead of the mascot and rear icons behind its flat plane',async t=>{
 const p=await open(t,1920,{reducedMotion:'no-preference'},fullCapabilities);
 await p.locator('[data-orbit-surface]').evaluate(n=>n.scrollIntoView({block:'center',behavior:'instant'}));
 await p.waitForFunction(()=>{const h=document.querySelector('#fresh-companion');return h.dataset.dock==='project-orbit'&&h.dataset.state==='idle'});
 const ordering=await p.locator('[data-project-orbit]').evaluate(root=>{
  const camera=root.querySelector('[data-orbit-camera]'),node=root.querySelector('[data-orbit-position]'),actor=root.querySelector('[data-fresh-actor]');
  const rect=camera.getBoundingClientRect(),a=actor.getBoundingClientRect(),x=a.x+a.width/2,y=a.y+a.height/2,perspective=parseFloat(getComputedStyle(camera).perspective),original=node.style.cssText;
  function hit(z){
   const factor=perspective/(perspective-z),wx=(x-rect.x-rect.width*.5)/factor,wy=(y-rect.y-rect.height*.46)/factor;
   node.style.transform='translate(-50%, -50%) translate3d('+wx+'px,'+wy+'px,'+z+'px) scale('+(1/factor)+')';
   const actual=node.getBoundingClientRect(),target=document.elementFromPoint(x,y);
   return{centerError:Math.hypot(actual.x+actual.width/2-x,actual.y+actual.height/2-y),project:!!target?.closest('[data-orbit-item]'),mascot:!!target?.closest('[data-fresh-actor]')};
  }
  try{return{front:hit(260),back:hit(-260)}}finally{node.style.cssText=original}
 });
 assert.ok(ordering.front.centerError<1&&ordering.back.centerError<1,'test planes align before checking paint order');
 assert.ok(ordering.front.project&&!ordering.front.mascot,'real foreground occlusion');
 assert.ok(ordering.back.mascot&&!ordering.back.project,'real background occlusion');
 assert.equal(await p.locator('#fresh-companion').count(),1);
 evidence.paintOrder=ordering;
});
