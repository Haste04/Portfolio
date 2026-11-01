import assert from 'node:assert/strict';
import {test,before,after} from 'node:test';
import {harness,sections,noDriver} from './helpers/scroll-reset.mjs';
let app;
before(async()=>{app=await harness('.cache/theme-signature/styling')});
after(async()=>{await app?.close()});
async function current(page,theme){
 await page.waitForFunction(theme=>document.documentElement.dataset.theme===theme&&!document.documentElement.hasAttribute('data-theme-revealing'),theme);
}
for(const scheme of ['dark','light'])test('System '+scheme+' is applied on the first frame before the page becomes visible',async t=>{
 const p=await app.open(t,{colorScheme:scheme,init:()=>{requestAnimationFrame(()=>{window['__firstTheme']={theme:document.documentElement.dataset.theme,bg:getComputedStyle(document.documentElement).backgroundColor}})}});
 assert.equal(await p.locator('html').getAttribute('data-theme'),scheme);
 assert.equal(await p.evaluate(()=>window['__firstTheme'].theme),scheme);
 assert.equal(await p.locator('html').evaluate(n=>getComputedStyle(n).colorScheme),scheme);
 assert.equal(await p.locator('meta[name="theme-color"]').getAttribute('content'),scheme==='dark'?'#101114':'#F5F1E9');
 await noDriver(p);
});
for(const saved of ['dark','light'])test('Saved '+saved+' overrides the opposite system preference without an incorrect first frame',async t=>{
 const context=await app.browser.newContext({viewport:{width:1366,height:900},colorScheme:saved==='dark'?'light':'dark'});t.after(()=>context.close());
 await context.addInitScript(saved=>{localStorage.setItem('portfolio-theme',saved);requestAnimationFrame(()=>{window['__firstTheme']=document.documentElement.dataset.theme})},saved);
 const p=await context.newPage();await p.goto(app.production,{waitUntil:'networkidle'});
 await current(p,saved);assert.equal(await p.evaluate(()=>window['__firstTheme']),saved);
});
test('System changes follow automatically until an explicit manual choice is made',async t=>{
 const p=await app.open(t,{colorScheme:'dark',reducedMotion:'reduce'});
 await p.emulateMedia({colorScheme:'light'});await current(p,'light');
 await p.locator('[data-theme-toggle]').click();await current(p,'dark');
 assert.equal(await p.evaluate(()=>localStorage.getItem('portfolio-theme')),'dark');
 await p.emulateMedia({colorScheme:'dark'});await p.emulateMedia({colorScheme:'light'});await current(p,'dark');
 await p.reload({waitUntil:'networkidle'});await current(p,'dark');
});
test('Storage failures retain a usable keyboard theme control',async t=>{
 const p=await app.open(t,{colorScheme:'light',reducedMotion:'reduce',init:()=>{Storage.prototype.getItem=()=>{throw Error('Denied')};Storage.prototype.setItem=()=>{throw Error('Denied')}}});
 await current(p,'light');const button=p.locator('[data-theme-toggle]');await button.focus();await p.keyboard.press('Enter');await current(p,'dark');
 assert.equal(await button.getAttribute('aria-label'),'Switch to light mode');
 assert.equal(await button.evaluate(n=>n===document.activeElement),true);
});
for(const theme of ['dark','light'])test(theme+' themes all seven sections at six widths with readable text and no layout overflow',async t=>{
 for(const width of [1920,1366,1024,768,390,320]){
  const p=await app.open(t,{width,height:width>=1440?1080:900,colorScheme:theme,reducedMotion:'reduce'});
  await current(p,theme);assert.equal(await p.locator('[data-theme-toggle]').isVisible(),true);
  const expected=theme==='dark'?'rgb(16, 17, 20)':'rgb(245, 241, 233)';
  assert.equal(await p.locator('body').evaluate(n=>getComputedStyle(n).backgroundColor),expected);
  for(const id of sections){
   await p.locator('#'+id).evaluate(n=>n.scrollIntoView({behavior:'instant'}));
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,id+' overflow '+theme+' '+width);
   assert.equal(await p.locator('#'+id+' h1,#'+id+' h2').isVisible(),true);
  }
  const contrast=await p.evaluate(()=>{
   const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const ctx=canvas.getContext('2d',{willReadFrequently:true});
   const rgb=color=>{ctx.clearRect(0,0,1,1);ctx.fillStyle=color;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].slice(0,3)};
   const luminance=rgb=>rgb.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
   const css=getComputedStyle(document.documentElement),bg=luminance(rgb(css.getPropertyValue('--color-background')));
   return ['--color-text','--color-muted','--color-accent'].map(token=>{const fg=luminance(rgb(css.getPropertyValue(token)));return {token,ratio:(Math.max(bg,fg)+.05)/(Math.min(bg,fg)+.05)}});
  });
  for(const item of contrast)assert.ok(item.ratio>=4.5,item.token+' contrast '+item.ratio+' in '+theme);
  const story=await p.locator('#about .story-detail').first().evaluate(n=>({color:getComputedStyle(n).color,canvas:getComputedStyle(n.closest('.photo-story')).backgroundColor}));
  assert.equal(story.color,'rgb(208, 206, 203)');assert.equal(story.canvas,'rgb(29, 31, 36)');
  if([1366,390].includes(width)){
   for(const id of sections)await app.shot(p,theme+'-'+id+'-'+width,'#'+id);
  }
  app.measurements.push({theme,width,contrast,overflow:false});
  await p.context().close();
 }
});

test('An explicit theme survives page restoration when preference storage is unavailable or stale',async t=>{
 for(const saved of [null,'dark']){
  const p=await app.open(t,{colorScheme:'dark',reducedMotion:'reduce',beforeLoad:page=>page.addInitScript(saved=>{
   if(saved)localStorage.setItem('portfolio-theme',saved);
   Storage.prototype.setItem=()=>{throw Error('Controlled persistence denial')};
  },saved)});
  await current(p,'dark');
  await p.locator('[data-theme-toggle]').click();await current(p,'light');
  const y=await p.evaluate(()=>{window['__retainedThemeMascot']=document.querySelector('#fresh-companion');return scrollY});
  await p.evaluate(()=>{
   window.dispatchEvent(new PageTransitionEvent('pagehide',{persisted:true}));
   window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true}));
  });
  assert.equal(await p.locator('html').getAttribute('data-theme'),'light','Restoration retains explicit choice despite failed storage: '+saved);
  assert.equal(await p.locator('[data-theme-toggle]').getAttribute('aria-label'),'Switch to dark mode');
  assert.equal(await p.evaluate(()=>window['__retainedThemeMascot']===document.querySelector('#fresh-companion')),true);
  assert.equal(await p.evaluate(()=>scrollY),y);
  await p.context().close();
 }
});
