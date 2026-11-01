import assert from 'node:assert/strict';
import {test,before,after} from 'node:test';
import {readFile} from 'node:fs/promises';
import {harness,sections,noDriver} from './helpers/scroll-reset.mjs';
let app;
before(async()=>{app=await harness('.cache/light-mode-v2/tests')});
after(async()=>{await app?.close()});
const widths=[1920,1366,1024,768,390,320];
for(const width of widths)test('Light V2 readable labels, separated toolkit surfaces and centered controls at '+width+'px',async t=>{
 const p=await app.open(t,{width,colorScheme:'light',reducedMotion:'reduce'});
 const targets=[
 ['.section-index',12],['.stage-caption',12],['#projects .technology-tags li',11.5],
 ['#projects .orbit-item-name',14],['#projects .orbit-help',12],['#projects .project-status',12],
 ['#tech-stack .technology-caption',12],['#tech-stack .technology-category-heading h3',14],
 ['#education .education-hotspot',width<768?11:12],['#education .education-location-control label',12],
 ['#experience .experience-contributions details>p',14],['#experience .experience-summary-note',12],
 ['#contact .contact-links .text-link',14]
 ];
 for(const [selector,minimum]of targets){
  const sizes=await p.locator(selector).evaluateAll(ns=>ns.map(n=>parseFloat(getComputedStyle(n).fontSize)));
  assert.ok(sizes.length,selector+' exists');
  assert.ok(sizes.every(n=>n>=minimum),selector+' readable minimum '+minimum+': '+sizes);
 }
 const borders=await p.locator('.technology-category').evaluateAll(ns=>{
  const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d',{willReadFrequently:true});
  const lum=values=>values.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
  return ns.map(n=>{const c=getComputedStyle(n);ctx.fillStyle=getComputedStyle(document.documentElement).backgroundColor;ctx.fillRect(0,0,1,1);ctx.fillStyle=c.backgroundColor;ctx.fillRect(0,0,1,1);const bg=lum([...ctx.getImageData(0,0,1,1).data].slice(0,3));ctx.fillStyle=c.borderTopColor;ctx.fillRect(0,0,1,1);const b=lum([...ctx.getImageData(0,0,1,1).data].slice(0,3));return {ratio:(Math.max(bg,b)+.05)/(Math.min(bg,b)+.05),background:c.backgroundColor,width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height}});
 });
 assert.equal(borders.length,4);
 assert.ok(borders.every(b=>b.ratio>=1.5),'Visible category boundary: '+JSON.stringify(borders));
 assert.ok(borders.every(b=>Math.abs(b.width-borders[0].width)<1&&Math.abs(b.height-borders[0].height)<1),'Equal category containers');
 for(const id of sections){await p.locator('#'+id).evaluate(n=>n.scrollIntoView({behavior:'instant'}));assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,id+' overflow')}
 const centered=await p.locator('#contact .contact-main').evaluate(n=>{const r=n.getBoundingClientRect();return Math.abs(r.left+r.width/2-innerWidth/2)<2});
 assert.ok(centered);await noDriver(p);
 app.measurements.push({width,borders,overflow:false});
});
for(const width of [1366,390])test('Dark static computed styles remain identical to the approved baseline at '+width+'px',async t=>{
 const baseline=JSON.parse(await readFile('tests/fixtures/light-mode-v2-dark-styles.json','utf8'))['dark-'+width];
 const p=await app.open(t,{width,colorScheme:'dark',reducedMotion:'reduce'});await p.locator('[data-fresh-pause]').click();
 for(const id of sections){await p.locator('#'+id).evaluate(n=>n.scrollIntoView({behavior:'instant'}));await p.waitForTimeout(100)}
 const current=await p.evaluate(baseline=>Object.fromEntries(Object.entries(baseline).map(([selector,rows])=>[selector,[...document.querySelectorAll(selector)].filter(n=>!n.closest('#fresh-companion')).map(n=>Object.fromEntries(Object.keys(rows[0]??{}).map(k=>[k,getComputedStyle(n)[k]])))])),baseline);
 assert.deepEqual(current,baseline);
});
test('Original photographic stories and the Experience map/thumbnail geometry remain unchanged in light mode',async t=>{
 const baseline=JSON.parse(await readFile('tests/fixtures/light-mode-v2-geometry.json','utf8'));
 for(const width of [1366,390]){
  const p=await app.open(t,{width,colorScheme:'light',reducedMotion:'reduce'});
  const current=await p.evaluate(()=>({
   stories:[...document.querySelectorAll('.photo-story')].map(n=>({width:n.offsetWidth,height:n.offsetHeight})),
   map:[...document.querySelectorAll('.experience-cebu-map,.experience-filmstrip>a')].map(n=>({width:n.getBoundingClientRect().width,height:n.getBoundingClientRect().height,left:n.getBoundingClientRect().left-n.closest('.experience-atlas').getBoundingClientRect().left,top:n.getBoundingClientRect().top-n.closest('.experience-atlas').getBoundingClientRect().top}))
  }));
  assert.deepEqual(current,baseline['light-'+width]);
  const photographs=await p.locator('#about .photo-story').evaluateAll(ns=>ns.map(n=>({canvas:getComputedStyle(n).backgroundColor,ink:getComputedStyle(n.querySelector('.story-title')).color,story:getComputedStyle(n.querySelector('.story-detail')).color})));
  assert.ok(photographs.every(n=>n.canvas==='rgb(29, 31, 36)'&&n.ink==='rgb(243, 241, 237)'&&n.story==='rgb(208, 206, 203)'));
  await p.context().close();
 }
});
test('Production Hero has no clipped black graphic along the viewport top edge',async t=>{
 const {default:sharp}=await import('sharp');
 const p=await app.open(t,{colorScheme:'light',reducedMotion:'reduce'});
 const shot=await p.screenshot({clip:{x:0,y:0,width:1366,height:12}});
 const {data,info}=await sharp(shot).removeAlpha().raw().toBuffer({resolveWithObject:true});
 let dark=0;for(let i=0;i<data.length;i+=info.channels)if(data[i]<70&&data[i+1]<70&&data[i+2]<70)dark++;
 assert.equal(dark,0);assert.equal(await p.locator('astro-dev-toolbar').count(),0);
});

test('Light selected text retains 4.5 contrast and Education active borders remain amber',async t=>{
 const p=await app.open(t,{colorScheme:'light',reducedMotion:'reduce'});
 const measure=()=>p.evaluate(()=>{
  const rgb=s=>s.match(/[0-9.]+/g).slice(0,3).map(Number),lum=values=>values.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);
  return ['.navigation-links a[aria-current="location"]','.education-stage-navigation a[aria-current="step"]','.contact-links .resume-link'].map(s=>{const c=getComputedStyle(document.querySelector(s)),a=lum(rgb(c.color)),b=lum(rgb(c.backgroundColor));return {s,ratio:(Math.max(a,b)+.05)/(Math.min(a,b)+.05)}});
 });
 const ratios=await measure();assert.ok(ratios.every(n=>n.ratio>=4.5),JSON.stringify(ratios));
 const marker=p.locator('.education-hotspot[aria-current="location"]');
 assert.equal(await marker.evaluate(n=>getComputedStyle(n).borderTopColor),'rgb(164, 88, 38)');
 await marker.hover();assert.equal(await marker.evaluate(n=>getComputedStyle(n).borderTopColor),'rgb(164, 88, 38)');
 await p.locator('.contact-links .resume-link').hover();
 const hovered=await measure();assert.ok(hovered.every(n=>n.ratio>=4.5),'Hover contrast: '+JSON.stringify(hovered));
 app.measurements.push({selectedContrast:ratios,hoveredContrast:hovered});
});

for(const reducedMotion of ['reduce','no-preference'])test('Theme typography preserves the visible Contact anchor with '+reducedMotion,async t=>{
 const p=await app.open(t,{colorScheme:'dark',reducedMotion});
 await p.locator('#contact').evaluate(n=>n.scrollIntoView({behavior:'instant'}));
 await p.waitForFunction(()=>document.querySelector('#fresh-companion').dataset.currentSection==='contact');
 const before=await p.locator('#contact').evaluate(n=>({top:n.getBoundingClientRect().top,y:scrollY}));
 await p.locator('[data-theme-toggle]').evaluate(n=>n.click());
 if(reducedMotion==='no-preference')await p.waitForFunction(()=>document.documentElement.dataset.themeRevealing==='reveal');
 await p.waitForFunction(()=>document.documentElement.dataset.theme==='light'&&!document.documentElement.hasAttribute('data-theme-revealing'));
 const light=await p.locator('#contact').evaluate(n=>({top:n.getBoundingClientRect().top,y:scrollY}));
 assert.ok(Math.abs(light.top-before.top)<1,'Visible Contact must stay fixed: '+JSON.stringify({before,light}));
 await p.locator('[data-theme-toggle]').evaluate(n=>n.click());
 await p.waitForFunction(()=>document.documentElement.dataset.theme==='dark'&&!document.documentElement.hasAttribute('data-theme-revealing'));
 const dark=await p.locator('#contact').evaluate(n=>({top:n.getBoundingClientRect().top,y:scrollY}));
 assert.ok(Math.abs(dark.top-before.top)<1&&Math.abs(dark.y-before.y)<1,'Reverse returns to the original reading position');
 app.measurements.push({reducedMotion,before,light,dark});
});
