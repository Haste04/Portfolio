import assert from 'node:assert/strict';
import {test,before,after} from 'node:test';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {harness,layers,go,sample,stable,noDriver} from './helpers/scroll-reset.mjs';
const folder='.cache/global-parallax-reset/branding',evidence={};
let app;
before(async()=>{app=await harness(folder,{development:true})});
after(async()=>{app?.measurements.push(evidence);await app?.close()});
async function open(t,width=1366){return app.open(t,{mode:'development',width,height:width===1920?1080:768})}
test('Hero has no scroll-linked displacement at either desktop size',async t=>{
 for(const width of [1366,1920]){
  const p=await open(t,width);await go(p,0);const a=await sample(p,layers.home);
  await p.mouse.move(8,700);await p.mouse.wheel(0,360);await p.waitForFunction(()=>scrollY>=350);await p.waitForTimeout(150);
  const b=await sample(p,layers.home);stable(a,b);await p.waitForTimeout(500);stable(b,await sample(p,layers.home));
  await go(p,0);stable(a,await sample(p,layers.home));await noDriver(p);
  app.measurements.push({width,a,b});
 }
});
test('Orbit backgrounds remain static with exact manual selection and no obsolete stacked stages',async t=>{
 const p=await open(t),y=await p.locator('[data-orbit-surface]').evaluate(n=>n.getBoundingClientRect().top+scrollY-260);
 await go(p,y);const a=await sample(p,layers.projects);await go(p,y+420);stable(a,await sample(p,layers.projects));await go(p,y);stable(a,await sample(p,layers.projects));
 assert.equal(await p.locator('.orbit-editorial-word').count(),0);
 for(const id of ['lifevent','seek-first-books','philchan-cebu','anthea']){
  await p.locator('[data-orbit-item="'+id+'"]').click();await p.waitForFunction(()=>document.querySelector('[data-project-orbit]').dataset.orbitMoving==='false');
  assert.equal(await p.locator('[data-project]:visible').getAttribute('data-project'),id);
  assert.equal(await p.locator('[data-orbit-item][aria-pressed="true"]').getAttribute('data-orbit-item'),id);
 }
 assert.equal(await p.locator('.project-stage,.project-shutter').count(),0);
 await noDriver(p);
});
test('V2 supplied branding renders in desktop/mobile navigation and favicon decodes',async t=>{
const p=await open(t);for(const width of [1366,390,320]){await p.setViewportSize({width,height:844});const img=p.locator(width>=768?'.desktop-navigation .portfolio-logo':'.mobile-navigation .portfolio-logo');assert.equal(await img.isVisible(),true);assert.equal(await img.evaluate(n=>getComputedStyle(n).backgroundColor),'rgba(0, 0, 0, 0)','Dark-mode logo must not have a white backing');assert.equal(await img.evaluate(n=>n.complete&&n.naturalWidth>0),true);const r=await img.boundingBox();assert.ok(r.width>=32&&r.width<=90&&r.height>=20&&r.height<=44);assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true)}
await p.screenshot({path:folder+'/mobile-logo.png'});
const icon=p.locator('link[rel="icon"]');assert.equal(await icon.count(),1);const url=await icon.getAttribute('href');assert.ok(url.includes('portfolio'));const response=await p.request.get(new URL(url,p.url()).href);assert.equal(response.status(),200);
const decoded=await p.evaluate(async href=>{const img=new Image();img.src=href;await img.decode();return[img.naturalWidth,img.naturalHeight]},url);assert.deepEqual(decoded,[64,64]);
for(const source of ['public/assets/brand/portfolio-logo.png','public/assets/brand/portfolio-favicon.png']){const original=await readFile(source);evidence.preservedVariantHash=createHash('sha256').update(original).digest('hex');assert.equal(evidence.preservedVariantHash,'cf6b4d14171aedf89871fef6dc7d7939955a17a77201d66cf17a793648d6af3d')}
evidence.logoHash=createHash('sha256').update(await readFile('public/assets/brand/Portfolio-Dark Mode.png')).digest('hex');assert.equal(evidence.logoHash,'23e78f657a9d72364362df696dfafb1ce9c8a57b695fbc5e6fad1300498382f0');
assert.equal(new URL(url,p.url()).searchParams.get('v'),'cf6b4d14171a');
assert.equal(await p.locator('.desktop-navigation .portfolio-logo').getAttribute('src'),'/assets/brand/portfolio-logo.webp?v=23e78f657a9d');
});
