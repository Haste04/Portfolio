import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFile, readdir } from 'node:fs/promises';
async function sources(folder){
 const files=[];
 for(const entry of await readdir(folder,{withFileTypes:true})){
  const file=folder+'/'+entry.name;
  if(entry.isDirectory())files.push(...await sources(file));
  else if(/\.(ts|astro|css)$/.test(file))files.push([file,await readFile(file,'utf8')]);
 }
 return files;
}
test('Only the approved About engine owns scroll timelines; Home and other sections remain reset',async()=>{
 const files=await sources('src');
 for(const [file,text] of files){
  if(!['src/scripts/about-slides/engine.ts','src/scripts/about-slides/services.ts'].includes(file))assert.doesNotMatch(text,/(?:from\s*|import\s*\()\s*['"]gsap(?:\/[^'"]*)?['"]/,file);
  if(!['src/scripts/about-slides/engine.ts'].includes(file))assert.doesNotMatch(text,/\b(?:ScrollTrigger|initPageMotion|createMotionSession)\b/,file);
  assert.doesNotMatch(text,/hero-depth|initHeroDeparture|setHeroLivingDepth/,file);
  assert.doesNotMatch(text,/\bdata-page-motion(?:-target)?\b|\bdataset\.pageMotion\b/,file);
 }
});
test('No CSS scroll animation, reveal-only heading masks or unused cinematic timings remain',async()=>{
 const files=await sources('src');
 for(const [file,text] of files){
  assert.doesNotMatch(text,/animation-timeline\s*:|scroll-timeline\s*:|--motion-cinematic|--motion-standard/,file);
  assert.doesNotMatch(text,/class="(?:type-mask|motion-ink|hero-ink)"|project-shutter/,file);
 }
});
