import assert from 'node:assert/strict';
import {before,after,test} from 'node:test';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {harness,noDriver} from './helpers/scroll-reset.mjs';
let app;
before(async()=>{app=await harness('.cache/theme-signature/interactions')});
after(async()=>{await app?.close()});
for(const theme of ['dark','light'])test(theme+' preserves Education, Orbit, Toolkit, Experience, Contact and real supplied logos',async t=>{
 const p=await app.open(t,{colorScheme:theme});
 assert.equal(await p.locator('html').getAttribute('data-theme'),theme);
 const brand=p.locator('.desktop-navigation .portfolio-logo');
 await brand.evaluate(n=>n.decode());
 assert.ok((await brand.getAttribute('src')).includes(theme==='light'?'portfolio-logo-light.webp':'portfolio-logo.webp'));

 await p.locator('[data-education-next]').click();
 await p.waitForFunction(()=>document.querySelector('[data-education-journey]').dataset.mapView==='zoomed');
 assert.equal(await p.locator('[data-education-panel]:visible').getAttribute('data-education-panel'),'kindergarten');
 await p.waitForTimeout(700);
 assert.notEqual(await p.locator('[data-education-camera]').first().getAttribute('transform'),'matrix(1 0 0 1 0 0)');
 await p.locator('[data-education-reset]').click();

 await p.locator('[data-orbit-next]').click();
 assert.equal(await p.locator('[data-project-orbit]').getAttribute('data-orbit-moving'),'true');
 await p.waitForFunction(()=>document.querySelector('[data-project-orbit]').dataset.orbitMoving==='false');
 assert.equal(await p.locator('[data-project]:visible').getAttribute('data-project'),'lifevent');
 await p.locator('#project-lifevent .case-study summary').click();assert.equal(await p.locator('#project-lifevent .case-study').evaluate(n=>n.open),true);
 assert.equal(await p.locator('#project-philchan-cebu a[data-live],#project-philchan-cebu a[data-source],#project-philchan-cebu .project-image').count(),0);

 // This integration case covers a settled manual interaction. Dedicated gallery tests cover selection during docking/physical transitions.
 await p.locator('#tech-stack').evaluate(n=>n.scrollIntoView({behavior:'instant'}));
 await p.waitForFunction(()=>{const h=document.querySelector('#fresh-companion');return h.dataset.currentSection==='tech-stack'&&!['entering','dragging','airborne','bouncing','settling','returning','section-transitioning'].includes(h.dataset.state)});
 await p.locator('button[data-technology="astro"]').click();
 assert.equal(await p.locator('[data-tech-gallery]').getAttribute('data-gallery-view'),'opening');
 await p.waitForFunction(()=>document.querySelector('[data-tech-gallery]').dataset.galleryView==='focus');
 assert.equal(await p.locator('[data-tech-name]').textContent(),'Astro');
 assert.equal(await p.locator('[data-tech-relationships] a[href="#project-seek-first-books"]').count()||await p.locator('[data-tech-focus] a[href="#project-seek-first-books"]').count(),1);
 assert.equal(await p.locator('[data-tech-focus]').evaluate(n=>n.inert),false);
 await p.locator('[data-tech-back]').scrollIntoViewIfNeeded();
 assert.equal(await p.locator('[data-tech-back]').isVisible(),true);
 try{await p.locator('[data-tech-back]').click()}catch(error){throw new Error('Theme toolkit Back state: '+JSON.stringify(await p.evaluate(()=>{const b=document.querySelector('[data-tech-back]'),f=document.querySelector('[data-tech-focus]');return {scrollY,active:document.activeElement?.outerHTML.slice(0,300),gallery:{...document.querySelector('[data-tech-gallery]').dataset},host:{...document.querySelector('#fresh-companion').dataset},back:{markup:b.outerHTML,rect:b.getBoundingClientRect().toJSON(),visibility:getComputedStyle(b).visibility,display:getComputedStyle(b).display,inert:b.closest('[inert]')?.outerHTML.slice(0,300)},focus:{hidden:f.hidden,inert:f.inert,visibility:getComputedStyle(f).visibility,rect:f.getBoundingClientRect().toJSON()}}})),{cause:error})}await p.waitForFunction(()=>document.querySelector('[data-tech-gallery]').dataset.galleryView==='overview');

 const company=p.locator('[data-experience-company-logo]');await company.scrollIntoViewIfNeeded();await p.waitForFunction(()=>{const n=document.querySelector('[data-experience-company-logo]');return n.complete&&n.naturalWidth>0});
 assert.ok((await company.getAttribute('src')).includes(theme==='light'?'lifewood-logo-light.webp':'lifewood-logo.png'));
 await p.locator('[data-experience-preview="1"]').click();
 await p.waitForFunction(()=>document.querySelector('[data-experience]').dataset.experienceMode==='gallery'&&document.querySelector('[data-experience]').dataset.experienceMoving==='false');
 const approved=JSON.parse(await p.locator('[data-experience-photos]').textContent())[1];
 assert.equal(await p.locator('[data-experience]').getAttribute('data-experience-selected-photo'),approved.id);
 assert.equal(await p.locator('[data-experience-photo]').getAttribute('src'),approved.src);
 await p.locator('[data-experience-back]').click();await p.waitForFunction(()=>document.querySelector('[data-experience]').dataset.experienceMode==='map');

 const destinations=['mailto:haggaiestavilla04@gmail.com','https://www.linkedin.com/in/haggai-estavilla-027702236/','https://github.com/Haste04','https://www.facebook.com/haggai.estavilla.5','https://www.instagram.com/allivatse_iaggah/'];
 for(const href of destinations)assert.equal(await p.locator('#contact a[href="'+href+'"]').isVisible(),true);
 const href=await p.locator('#contact a[download]').getAttribute('href'),response=await p.request.get(app.production+href);
 const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
 assert.equal(hash(await response.body()),hash(await readFile('Estavilla Resume.pdf')));
 assert.equal(await p.locator('#fresh-companion').count(),1);await noDriver(p);
});
test('Global theme control remains keyboard accessible when navigation is hidden at six widths',async t=>{
 for(const width of [1920,1366,1024,768,390,320]){
  const p=await app.open(t,{width,colorScheme:'dark',reducedMotion:'reduce'});
  await p.locator('[data-navigation-visibility]').click();await p.waitForFunction(()=>document.querySelector('[data-navigation-content]').hidden);
  const toggle=p.locator('[data-theme-toggle]');assert.equal(await toggle.isVisible(),true);
  await toggle.focus();await p.keyboard.press('Enter');assert.equal(await p.locator('html').getAttribute('data-theme'),'light');
  assert.equal(await toggle.evaluate(n=>n===document.activeElement),true);
  const box=await toggle.boundingBox();assert.ok(box.width>=44&&box.height>=44&&box.x>=0&&box.x+box.width<=width);
  assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  await p.context().close();
 }
});
