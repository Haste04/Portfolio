import assert from 'node:assert/strict';
import {test,before,after} from 'node:test';
import {readFile,writeFile} from 'node:fs/promises';
import {harness} from './helpers/scroll-reset.mjs';
let app;before(async()=>{app=await harness('.cache/about-education-cleanup')});after(async()=>{await app?.close()});
test('About phrase fits desktop and Education has one Aloran chapter at six widths in both themes',async t=>{
 for(const colorScheme of ['dark','light']){
  const p=await app.open(t,{colorScheme,reducedMotion:'reduce'});
  for(const width of [1920,1366,1024,768,390,320]){
   await p.setViewportSize({width,height:900});
   const heading=await p.locator('#about .section-heading').evaluate(n=>{const r=document.createRange();r.selectNodeContents(n);return {text:n.textContent,lines:r.getClientRects().length}});
   assert.equal(heading.text,'MORE THAN JUST CODE');if(width>=768)assert.equal(heading.lines,1,'one-line heading '+width);
   assert.equal(await p.locator('[data-education-panel]').count(),7);
   await p.locator('[data-education-place="aloran"]').click();
   assert.equal(await p.locator('[data-education-stage]:visible').count(),1);
   assert.match(await p.locator('[data-education-panel]:visible').textContent(),/Kindergarten through Grade 2/);
   assert.match(await p.locator('[data-education-panel]:visible .eyebrow').textContent(),/02.*07/);
   assert.equal(await p.locator('[data-education-place="aloran"] .education-hotspot-number').textContent(),'02');
   assert.equal(await p.locator('[data-education-place="argao"] .education-hotspot-number').textContent(),'03/06');
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   if([1366,390].includes(width)){await app.shot(p,colorScheme+'-about-'+width,'#about');await app.shot(p,colorScheme+'-aloran-'+width,'#education')}
  }
 }
});
test('Old Grade 1-2 links resolve to the combined Aloran chapter',async t=>{
 const p=await app.open(t);await p.goto(app.production+'/#education-stage-grade-1-2',{waitUntil:'networkidle'});
 await p.waitForFunction(()=>document.querySelector('[data-education-journey]').dataset.currentEntry==='kindergarten');
});
