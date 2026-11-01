import assert from 'node:assert/strict';
import {before,after,test} from 'node:test';
import {createServer} from 'node:http';
import {readFile,stat,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join,extname,sep} from 'node:path';
import {chromium} from 'playwright-core';
const folder='.cache/experience-showcase',root=resolve('dist'),ids=['anthea','lifevent','seek-first-books','philchan-cebu'];
const expectedMapLayouts=JSON.parse(await readFile(new URL('./fixtures/experience-map-layout.json',import.meta.url),'utf8'));
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

test('Experience defaults to a city-level Cebu map and a truthful gallery-ready state',async t=>{
 const p=await open(t);assert.equal(await p.locator('#experience .experience-atlas').count(),1);
 assert.equal(await p.locator('#experience .experience-coast').count(),3);
 assert.doesNotMatch(await p.locator('.experience-cebu-map').textContent(),/BOHOL|NEGROS|LEYTE/);
 assert.equal(await p.getByText('A chapter in Cebu.',{exact:true}).count(),0);
 assert.equal(await p.locator('#experience-map').getAttribute('aria-label'),'Cebu map');
 assert.equal(await p.locator('#experience [data-experience-view="map"]').isVisible(),true);
 assert.equal(await p.locator('#experience [data-experience-view="gallery"]').isVisible(),false);
 assert.match(await p.locator('#experience').textContent(),/Cebu City, Cebu, Philippines/);
 assert.equal(await p.locator('#experience .experience-contributions details').count(),5);
 assert.equal(await p.getByText('View My Experience',{exact:true}).count(),0);
 assert.equal(await p.locator('#experience .experience-view-link').count(),0);
});

async function waitView(p,view){
 await p.waitForFunction(view=>{const n=document.querySelector('[data-experience]');return n.dataset.experienceMode===view&&n.dataset.experienceMoving==='false'},view);
 assert.equal(await p.locator('#experience .experience-view:visible').count(),1);
}
test('Cebu marker enters the truthful empty gallery, preserve panel height, and restore keyboard focus',async t=>{
 const p=await open(t,1366,{},withoutPhotos),marker=p.locator('.experience-cebu-map [data-experience-open]');
 await marker.scrollIntoViewIfNeeded();const height=await p.locator('.experience-atlas').evaluate(n=>n.getBoundingClientRect().height);
 await marker.focus();await p.keyboard.press('Enter');await waitView(p,'gallery');
 assert.ok(await p.locator('[data-experience-empty]').isVisible());assert.match(await p.locator('[data-experience-empty]').textContent(),/Photos coming soon/);
 assert.equal(await p.locator('[data-experience-photo]').getAttribute('src'),null);
 assert.ok(Math.abs(await p.locator('.experience-atlas').evaluate(n=>n.getBoundingClientRect().height)-height)<1);
 await p.locator('[data-experience-back]').click();await waitView(p,'map');assert.equal(await marker.evaluate(n=>n===document.activeElement),true);
 await p.locator('.experience-cebu-map [data-experience-open]').click();await waitView(p,'gallery');await p.keyboard.press('Escape');await waitView(p,'map');
 assert.equal(await p.locator('.experience-cebu-map [data-experience-open]').evaluate(n=>n===document.activeElement),true);
});
test('All verified contribution entries use independent native keyboard disclosures',async t=>{
 const p=await open(t);assert.equal(await p.locator('#experience time[datetime="2026-08"]').textContent(),'August 2026');assert.equal(await p.locator('#experience time[datetime="2026-10"]').textContent(),'October 2026');
 for(const id of ['anthea','lifevent','power-bi','prompt-engineering','ai-media']){
  const details=p.locator('[data-experience-contribution="'+id+'"]');if(await details.evaluate(n=>n.open))await details.locator('summary').click();
  await details.locator('summary').focus();await p.keyboard.press('Enter');assert.equal(await details.evaluate(n=>n.open),true);assert.ok(await details.locator('p').isVisible());
 }
 assert.equal(await p.locator('#experience details[open]').count(),5);
});
test('Finite view transitions survive rapid reversal, Pause, reduced motion, hidden tabs and page restoration',async t=>{
 const p=await open(t,1366,{reducedMotion:'no-preference'});await p.locator('.experience-cebu-map [data-experience-open]').scrollIntoViewIfNeeded();
 await p.locator('.experience-cebu-map [data-experience-open]').evaluate(n=>n.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true})));
 assert.ok(await p.locator('.experience-view').evaluateAll(ns=>ns.flatMap(n=>n.getAnimations()).length)>=2);
 await p.locator('[data-fresh-pause]').evaluate(n=>n.click());await waitView(p,'gallery');
 assert.equal(await p.locator('.experience-view').evaluateAll(ns=>ns.flatMap(n=>n.getAnimations()).length),0);
 await p.locator('[data-experience-back]').click();await waitView(p,'map');await p.locator('[data-fresh-pause]').evaluate(n=>n.click());
 await p.evaluate(()=>{document.querySelector('.experience-cebu-map [data-experience-open]').dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));document.querySelector('[data-experience-back]').click();document.querySelector('.experience-cebu-map [data-experience-open]').dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}))});
 await waitView(p,'gallery');await p.locator('[data-experience-back]').click();await waitView(p,'map');
 await p.locator('.experience-cebu-map [data-experience-open]').evaluate(n=>n.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true})));
 await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});await waitView(p,'gallery');
 await p.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));window.dispatchEvent(new PageTransitionEvent('pagehide'));window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}))});
 assert.equal(await p.locator('[data-experience]').count(),1);assert.equal(await p.locator('#fresh-companion').count(),1);
 await p.emulateMedia({reducedMotion:'reduce'});await p.locator('[data-experience-back]').click();await waitView(p,'map');
 assert.equal(await p.locator('.experience-view').evaluateAll(ns=>ns.flatMap(n=>n.getAnimations()).length),0);
 assert.equal(await p.locator('.experience-view[data-page-motion-target]').count(),0);
});
test('No JavaScript preserves internship information, Cebu location and native contribution disclosures',async t=>{
 const p=await open(t,390,{javaScriptEnabled:false},withoutPhotos);
 assert.ok(await p.locator('#experience h3').first().isVisible());assert.ok(await p.locator('.experience-cebu-map').isVisible());
 const details=p.locator('[data-experience-contribution="lifevent"]');await details.locator('summary').click();assert.equal(await details.evaluate(n=>n.open),true);
 await p.locator('.experience-cebu-map [data-experience-open]').click();assert.ok(await p.locator('[data-experience-empty]').isVisible());assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
});
for(const width of [1920,1366,1024,768,390,320])test('Experience map, details and gallery fit at '+width+'px without overflow or mascot overlap',async t=>{
 const p=await open(t,width);await p.locator('#experience').evaluate(n=>n.scrollIntoView({behavior:'instant'}));
 const info=await p.locator('.experience-profile').boundingBox(),map=await p.locator('.experience-atlas').boundingBox();
 if(width>=1024)assert.ok(map.x>=info.x+info.width,'desktop split');else assert.ok(map.y>=info.y+info.height,'stacked small screens');
 const identity=await p.locator('.experience-company-identity').boundingBox(),role=await p.locator('#experience-role').boundingBox();
 assert.ok(role.y>=identity.y+identity.height,'company branding appears before the role');
 assert.equal(await p.locator('.experience-company').evaluate(n=>n.tagName),'H3');
 assert.ok(await p.locator('.experience-company').evaluate(n=>parseFloat(getComputedStyle(n).fontSize)>parseFloat(getComputedStyle(document.querySelector('#experience-role')).fontSize)),'company name has primary hierarchy');
 const expected=expectedMapLayouts.find(n=>n.width===width);
 const geometry=await p.locator('.experience-atlas').evaluate(atlas=>{
  const a=atlas.getBoundingClientRect(),rect=node=>{const r=node.getBoundingClientRect();return{x:r.left-a.left,y:r.top-a.top,width:r.width,height:r.height}};
  return{map:rect(atlas.querySelector('.experience-cebu-map')),thumbnails:[...atlas.querySelectorAll('[data-experience-preview]')].map(rect)};
 });
 for(const key of ['x','y','width','height'])assert.ok(Math.abs(geometry.map[key]-expected.map[key])<.5,'map '+key+' unchanged at '+width);
 assert.equal(geometry.thumbnails.length,2);
 geometry.thumbnails.forEach((rect,index)=>{for(const key of ['x','y','width','height'])assert.ok(Math.abs(rect[key]-expected.thumbnails[index][key])<.5,'thumbnail geometry unchanged at '+width)});
 const logos=p.locator('[data-experience-company-logo]');await logos.scrollIntoViewIfNeeded();
 assert.ok((await logos.boundingBox()).width>=(width<768?96:128));
 for(const image of await p.locator('[data-experience-filmstrip] img').all()){
  await image.scrollIntoViewIfNeeded();await image.evaluate(n=>n.decode());assert.ok(await image.evaluate(n=>n.naturalWidth>0&&getComputedStyle(n).objectFit==='cover'));
 }
 const marker=await p.locator('.experience-cebu-map [data-experience-open]').boundingBox();assert.ok(marker.width>=44&&marker.height>=44);
 assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.currentSection==='experience');
 assert.equal(await p.locator('#fresh-companion').count(),1);
 if([1366,390].includes(width))await p.locator('#experience').screenshot({path:folder+'/experience-map-'+width+'.png'});
 await p.locator('.experience-cebu-map [data-experience-open]').click();await waitView(p,'gallery');assert.ok(await p.locator('[data-experience-back]').isVisible());
 assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 if([1366,390].includes(width))await p.locator('#experience').screenshot({path:folder+'/experience-empty-'+width+'.png'});
 evidence.widths.push({width,split:width>=1024,overflow:false});
});
test('Leaving the section during a transition does not reclaim viewport or keyboard focus',async t=>{
 const p=await open(t,1366,{reducedMotion:'no-preference'});await p.locator('.experience-cebu-map [data-experience-open]').scrollIntoViewIfNeeded();
 await p.evaluate(()=>{document.querySelector('.experience-cebu-map [data-experience-open]').dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));document.querySelector('#contact').scrollIntoView({behavior:'instant'});document.querySelector('#contact a').focus({preventScroll:true})});
 const contact=await p.locator('#contact').evaluate(n=>n.getBoundingClientRect().top);await waitView(p,'gallery');
 assert.ok(Math.abs(await p.locator('#contact').evaluate(n=>n.getBoundingClientRect().top)-contact)<8);
 assert.equal(await p.locator('#contact').evaluate(n=>n.contains(document.activeElement)),true);
});
async function withPhotos(p){
 const sharp=(await import('sharp')).default;
 const photos=[{id:'test-landscape',src:'/experience-media/test-landscape.webp',thumbnail:'/experience-media/test-landscape.webp',width:320,height:200,alt:'Synthetic landscape fixture',caption:'Test-only landscape'},{id:'test-portrait',src:'/experience-media/test-portrait.webp',thumbnail:'/experience-media/test-portrait.webp',width:200,height:320,alt:'Synthetic portrait fixture',caption:'Test-only portrait'}];
 const buffers=await Promise.all(photos.map(photo=>sharp({create:{width:photo.width,height:photo.height,channels:3,background:photo.width>photo.height?'#d88a46':'#88aec5'}}).webp().toBuffer()));
 await p.route('**/experience-media/test-*.webp',route=>{const i=route.request().url().includes('portrait')?1:0;return route.fulfill({status:200,contentType:'image/webp',body:buffers[i]})});
 await p.route(base+'/',async route=>{const response=await route.fetch(),html=await response.text(),marker=html.indexOf('data-experience-photos');assert.ok(marker>=0);const from=html.indexOf('>',marker)+1,to=html.indexOf('</script>',from);const body=(html.slice(0,from)+JSON.stringify(photos)+html.slice(to)).replace(/(<nav\b[^>]*data-experience-filmstrip[^>]*>)[\s\S]*?(<\/nav>)/,'$1$2');await route.fulfill({response,body})});
}
test('Synthetic approved-image fixtures exercise portrait/landscape navigation, thumbnails, rapid selection and keyboard controls',async t=>{
 const p=await open(t,1366,{reducedMotion:'no-preference'},withPhotos);await p.locator('.experience-cebu-map [data-experience-open]').click();await waitView(p,'gallery');
 await p.waitForFunction(()=>document.querySelector('[data-experience-photo]').naturalWidth===320);
 assert.equal(await p.locator('[data-experience-previous]').isDisabled(),true);assert.equal(await p.locator('[data-experience-counter]').textContent(),'01 / 02');
 await p.locator('[data-experience-next]').click();await p.waitForFunction(()=>document.querySelector('[data-experience-photo]').alt==='Synthetic portrait fixture');
 assert.equal(await p.locator('[data-experience-next]').isDisabled(),true);assert.equal(await p.locator('[data-experience-photo]').evaluate(n=>getComputedStyle(n).objectFit),'contain');
 await p.locator('[data-experience-thumbnail="0"]').click();await p.locator('[data-experience-thumbnail="0"]').focus();await p.keyboard.press('ArrowRight');
 await p.waitForFunction(()=>document.querySelector('[data-experience-photo]').alt==='Synthetic portrait fixture');
 await p.evaluate(()=>{for(let i=0;i<12;i++)document.querySelector('[data-experience-thumbnail="'+(i%2)+'"]').click()});
 await p.waitForFunction(()=>document.querySelector('[data-experience-photo]').alt==='Synthetic portrait fixture');
 assert.equal(await p.locator('[data-experience-counter]').textContent(),'02 / 02');
 assert.ok(await p.locator('.experience-photo-stage').evaluate(n=>n.getAnimations().length<=1),'one current photo transition');
 await p.locator('#experience').screenshot({path:folder+'/experience-synthetic-gallery.png'});
});
test('Synthetic gallery remains contained and touch-friendly at 320px',async t=>{
 const p=await open(t,320,{hasTouch:true,isMobile:true},withPhotos);await p.locator('.experience-cebu-map [data-experience-open]').tap();await waitView(p,'gallery');
 await p.locator('[data-experience-next]').tap();await p.waitForFunction(()=>document.querySelector('[data-experience-photo]').alt==='Synthetic portrait fixture');
 assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 const safe=await p.locator('.experience-photo-stage').evaluate(n=>{const r=n.getBoundingClientRect(),p=n.closest('.experience-atlas').getBoundingClientRect();return r.height>80&&r.left>=p.left&&r.right<=p.right&&r.bottom<=p.bottom});assert.ok(safe);
});

test('Opening the gallery does not steal focus that moved to a contribution',async t=>{
 const p=await open(t,1366,{reducedMotion:'no-preference'});await p.locator('.experience-cebu-map [data-experience-open]').scrollIntoViewIfNeeded();
 await p.evaluate(()=>{document.querySelector('.experience-cebu-map [data-experience-open]').dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));document.querySelector('[data-experience-contribution="lifevent"] summary').focus({preventScroll:true})});
 await waitView(p,'gallery');assert.equal(await p.locator('[data-experience-contribution="lifevent"] summary').evaluate(n=>n===document.activeElement),true);
});
test('Back restores the original trigger after scrolling within the gallery without moving the viewport',async t=>{
 const p=await open(t,1366,{reducedMotion:'no-preference'});await p.locator('.experience-cebu-map [data-experience-open]').click();await waitView(p,'gallery');
 await p.evaluate(()=>{scrollBy({top:90,behavior:'instant'});document.querySelector('[data-experience-back]').focus({preventScroll:true})});
 const position=await p.evaluate(()=>scrollY);await p.locator('[data-experience-back]').evaluate(n=>n.click());await waitView(p,'map');
 assert.equal(await p.locator('.experience-cebu-map [data-experience-open]').evaluate(n=>n===document.activeElement),true);
 assert.ok(Math.abs(await p.evaluate(()=>scrollY)-position)<2);
});

test('Company identity has a clean missing-logo fallback and no broken image',async t=>{
 const p=await open(t,1366,{},withoutLogo);
 assert.equal(await p.locator('[data-experience-company-logo]').isVisible(),false);
 assert.equal(await p.locator('[data-experience-company-logo]').getAttribute('src'),null);
 assert.equal(await p.locator('[data-experience-company-fallback]').isVisible(),true);
 assert.equal(await p.locator('.experience-company').textContent(),'Lifewood Data Technology');
 assert.equal(await p.locator('[data-experience-filmstrip]').isVisible(),false);
 assert.equal(await p.locator('[data-experience-filmstrip] img').count(),0);
});
async function withLogo(p,broken=false){
 const sharp=(await import('sharp')).default;
 const bytes=await sharp({create:{width:160,height:80,channels:4,background:'#d88a46'}}).png().toBuffer();
 await p.route('**/company-logos/fixture.png',route=>broken?route.fulfill({status:404,body:''}):route.fulfill({status:200,contentType:'image/png',body:bytes}));
 await p.route(base+'/',async route=>{
  const response=await route.fetch();let html=await response.text();
  html=html.replace(/<img\b[^>]*data-experience-company-logo[^>]*>/,tag=>tag.replace(/\s+data-theme-(?:dark|light)-src="[^"]*"/g,'').replace(/\s+hidden(?:="[^"]*")?/,'').replace(/\s+src="[^"]*"/,'').replace('<img','<img data-theme-dark-src="/company-logos/fixture.png" data-theme-light-src="/company-logos/fixture.png" src="/company-logos/fixture.png"'));
  html=html.replace('data-experience-company-fallback','data-experience-company-fallback hidden');
  await route.fulfill({response,body:html});
 });
}
test('Supplied logo keeps its proportions and failed logo loading restores the neutral fallback',async t=>{
 const p=await open(t,1366,{},p=>withLogo(p));await p.locator('.experience-company').scrollIntoViewIfNeeded();
 await p.waitForFunction(()=>document.querySelector('[data-experience-company-logo]').naturalWidth===160);
 assert.equal(await p.locator('[data-experience-company-fallback]').isVisible(),false);
 assert.equal(await p.locator('[data-experience-company-logo]').evaluate(n=>getComputedStyle(n).objectFit),'contain');
 const q=await open(t,390,{},p=>withLogo(p,true));
 await q.locator('.experience-company').scrollIntoViewIfNeeded();
 await q.waitForFunction(()=>document.querySelector('[data-experience-company-logo]').hidden);
 assert.ok(await q.locator('[data-experience-company-fallback]').isVisible());
});
test('Approved-photo preview opens the exact photograph and Back restores the thumbnail focus',async t=>{
 const p=await open(t,1366,{reducedMotion:'no-preference'},withPhotos);
 const preview=p.locator('[data-experience-preview="1"]');
 assert.ok(await p.locator('[data-experience-filmstrip]').isVisible());
 assert.equal(await p.locator('[data-experience-preview]').count(),2);
 await preview.scrollIntoViewIfNeeded();const height=await p.locator('.experience-atlas').evaluate(n=>n.clientHeight);
 await preview.focus();await p.keyboard.press('Enter');await waitView(p,'gallery');
 await p.waitForFunction(()=>document.querySelector('[data-experience-photo]').alt==='Synthetic portrait fixture');
 assert.equal(await p.locator('[data-experience-counter]').textContent(),'02 / 02');
 assert.equal(await p.locator('.experience-atlas').evaluate(n=>n.clientHeight),height);
 await p.locator('[data-experience-back]').click();await waitView(p,'map');
 assert.equal(await preview.evaluate(n=>n===document.activeElement),true);
 await p.locator('[data-fresh-pause]').evaluate(n=>n.click());
 await p.locator('[data-experience-preview="0"]').click();await waitView(p,'gallery');
 await p.waitForFunction(()=>document.querySelector('[data-experience-photo]').alt==='Synthetic landscape fixture');
 assert.equal(await p.locator('.experience-photo-stage').evaluate(n=>n.getAnimations().length),0);
});
for(const width of [1920,1366,1024,768,390,320])test('Approved-photo filmstrip and logo remain readable and contained at '+width+'px',async t=>{
 const p=await open(t,width,{hasTouch:width<1024},withPhotos);
 await p.locator('[data-experience-filmstrip]').scrollIntoViewIfNeeded();
 const safe=await p.locator('.experience-map-view').evaluate(n=>{
  const r=n.getBoundingClientRect();
  return [...n.querySelectorAll('.experience-cebu-map [data-experience-open],.experience-filmstrip,.experience-cebu-map')].every(e=>{const b=e.getBoundingClientRect();return b.width>0&&b.height>0&&b.left>=r.left&&b.right<=r.right&&b.bottom<=r.bottom+1});
 });assert.ok(safe,'map, discovery and preview fit within the same panel');
 assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 await p.locator('[data-experience-preview="1"]').click();await waitView(p,'gallery');
 await p.waitForFunction(()=>document.querySelector('[data-experience-photo]').alt==='Synthetic portrait fixture');
 assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 if([1366,390].includes(width)){
  await p.locator('#experience').screenshot({path:'.cache/experience-refinement/gallery-fixture-'+width+'.png'});
  await p.locator('[data-experience-back]').click();await waitView(p,'map');
  await p.locator('#experience').screenshot({path:'.cache/experience-refinement/filmstrip-fixture-'+width+'.png'});
 }
});

async function withoutLogo(p){
 await p.route(base+'/',async route=>{
  const response=await route.fetch();let html=emptyPhotoMarkup(await response.text());
  html=html.replace(/<img\b[^>]*data-experience-company-logo[^>]*>/,tag=>tag.replace(/\s+data-theme-(?:dark|light)-src="[^"]*"/g,'').replace(/\s+src="[^"]*"/,'').replace('<img','<img hidden'));
  html=html.replace(/<span\b[^>]*data-experience-company-fallback[^>]*>/,tag=>tag.replace(/\s+hidden(?:="[^"]*")?/,''));
  await route.fulfill({response,body:html});
 });
}

test('Supplied Lifewood logo loads and uploaded photos follow their explicit publication state',async t=>{
 const p=await open(t);
 await p.locator('.experience-company').scrollIntoViewIfNeeded();
 await p.waitForFunction(()=>document.querySelector('[data-experience-company-logo]').naturalWidth>0);
 assert.match(await p.locator('[data-experience-company-logo]').getAttribute('src'),/company-logos\/lifewood-logo\.png$/);
 const entries=JSON.parse(await readFile('src/data/lifewood-photos.json','utf8')),approved=entries.filter(n=>n.publication==='approved');
 const photos=JSON.parse(await p.locator('[data-experience-photos]').textContent());
 assert.equal(photos.length,approved.length);
 assert.equal(await p.locator('[data-experience-filmstrip]').isVisible(),approved.length>0);
 for(const entry of entries){
  const response=await p.request.get(base+'/lifewood/'+encodeURIComponent(entry.filename));
  assert.equal(response.status(),404,'raw originals must not appear in the static build');
 }
 if(approved.length){
  await p.locator('[data-experience-preview="1"]').click();await waitView(p,'gallery');
  await p.waitForFunction(alt=>document.querySelector('[data-experience-photo]').alt===alt,approved[1].alt);
  assert.ok(await p.locator('[data-experience-photo]').evaluate(n=>n.naturalWidth>0));
 }
});

/** Empty-gallery cases explicitly simulate an empty catalog now that real photos are supplied. */
function emptyPhotoMarkup(html){
 return html
  .replace(/(<script\b[^>]*data-experience-photos[^>]*>)[\s\S]*?(<\/script>)/,'$1[]$2')
  .replace(/<img\b[^>]*data-experience-photo(?:\s|=)[^>]*>/,tag=>tag.replace(/\s+(?:src|srcset)="[^"]*"/g,'').replace('<img','<img hidden'))
  .replace(/<div\b[^>]*data-experience-empty[^>]*>/,tag=>tag.replace(/\s+hidden(?:="[^"]*")?/,''))
  .replace(/<div\b[^>]*data-experience-gallery-content[^>]*>/,tag=>tag.replace('<div','<div hidden'))
  .replace(/(<nav\b[^>]*data-experience-filmstrip[^>]*>)[\s\S]*?(<\/nav>)/,(_,open,close)=>open.replace('<nav','<nav hidden')+close);
}
async function withoutPhotos(p){
 await p.route(base+'/',async route=>{const response=await route.fetch();await route.fulfill({response,body:emptyPhotoMarkup(await response.text())})});
}
