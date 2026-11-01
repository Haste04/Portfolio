import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync,existsSync} from 'node:fs';
import {technologies,categories} from '../src/data/technologies.ts';
import {projects} from '../src/data/projects.ts';
test('the gallery covers all verified technologies with sourced definitions and honest local icon or text fallbacks',async()=>{
 const {technologyDetails}=await import('../src/data/technology-details.ts');
 const icons=JSON.parse(readFileSync('src/data/technology-icons.json','utf8'));
 assert.equal(technologies.length,24);assert.equal(categories.length,4);
 assert.deepEqual(Object.keys(icons).sort(),technologies.map(t=>t.id).sort());
 assert.deepEqual(Object.keys(technologyDetails).sort(),technologies.map(t=>t.id).sort());
 for(const technology of technologies){
  const icon=icons[technology.id],detail=technologyDetails[technology.id];
  assert.ok(detail.description.length>=25);assert.match(detail.documentation,/^https:\/\//);
  assert.doesNotMatch(detail.description,/\b(expert|proficient|certified|years of experience)\b/i);
  assert.ok(icon.fallback);
  if(icon.src){
   assert.ok(icon.src.startsWith('/technology-icons/'));assert.ok(existsSync('public'+icon.src));assert.match(icon.source,/^https:\/\//);
   const bytes=readFileSync('public'+icon.src);
   if(icon.src.endsWith('.svg')){
    const svg=bytes.toString('utf8');assert.match(svg,/<svg/);
    assert.doesNotMatch(svg,/<script|foreignObject|\son[a-z]+\s*=|(?:href|src)\s*=\s*["'](?:https?:|\/\/)|url\(\s*["']?(?:https?:|\/\/)/i);
   }else assert.deepEqual([...bytes.subarray(0,8)],[137,80,78,71,13,10,26,10],'official raster alternative must be a genuine PNG');
  }
 }
 for(const project of projects)for(const id of project.technologyIds)assert.ok(technologies.some(t=>t.id===id));
 assert.equal(projects.length,4);assert.ok(!projects.some(p=>p.id.includes('fuelwatch')));
});
