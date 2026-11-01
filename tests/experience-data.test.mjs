import assert from 'node:assert/strict';
import {test} from 'node:test';
import {existsSync} from 'node:fs';
test('Experience keeps the verified Lifewood role, dates, city and five contribution groups',async()=>{
 assert.ok(existsSync('src/data/experience.ts'),'typed Experience data is required');
 const {internship,contributions,cebuLocation,experiencePoint}=await import('../src/data/experience.ts');
 assert.equal(internship.role,'Software Engineering Intern');assert.equal(internship.company,'Lifewood Data Technology');
 assert.deepEqual(internship.dates,['2026-08','2026-10']);assert.equal(internship.location,'Cebu City, Cebu, Philippines');
 assert.deepEqual(contributions.map(n=>n.id),['anthea','lifevent','power-bi','prompt-engineering','ai-media']);
 assert.match(contributions[0].description,/frontend and backend/);assert.match(contributions[1].description,/rate limiting/);
 assert.ok(cebuLocation.coordinates[0]>123.88&&cebuLocation.coordinates[0]<123.93&&cebuLocation.coordinates[1]>10.28&&cebuLocation.coordinates[1]<10.33);
 const [x,y]=experiencePoint(cebuLocation.coordinates);assert.ok(x>40&&x<560&&y>40&&y<600);
});
test('Experience coastline is a Cebu regional derivative with source provenance, not a complete Philippines duplicate',async()=>{
 assert.ok(existsSync('src/data/cebu-map.json'),'regional coastline is required');
 const map=(await import('../src/data/cebu-map.json',{with:{type:'json'}})).default;
 assert.match(map.source,/natural-earth/);assert.equal(map.license,'Public domain');assert.ok(map.features.length>=3&&map.features.length<12);
 assert.deepEqual(map.features.map(n=>n.name),['Cebu','Bantayan','Camotes'],'only Cebu and its island groups belong in the Experience map');
 assert.ok(map.features.some(n=>n.name==='Cebu'&&n.highlighted));assert.ok(map.features.every(n=>/^M/.test(n.path)));
});
