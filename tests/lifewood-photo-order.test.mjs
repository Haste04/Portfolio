import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {prepareLifewoodPhotos} from '../scripts/lifewood-media.mjs';
test('The two requested Lifewood photos are enabled as optimized public gallery entries',async()=>{
 const entries=JSON.parse(await readFile('src/data/lifewood-photos.json','utf8'));
 assert.deepEqual(entries.map(n=>[n.filename,n.publication]),[['Lifewood Picture #1.jpg','approved'],['Lifewood Picture #2.jpg','approved']]);
 const photos=await prepareLifewoodPhotos();assert.equal(photos.length,2);
 for(const photo of photos){
  assert.ok(photo.src.startsWith('/experience-media/')&&photo.src.endsWith('.webp')&&!/[ #]/.test(photo.src));
  assert.ok(photo.width<=1280);assert.ok(photo.width>photo.height);
 }
});
