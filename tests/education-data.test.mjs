import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdir,mkdtemp,writeFile,unlink,rmdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {schoolLogoUrl} from '../scripts/school-logos.mjs';
import {educationEntries,educationPlaces,educationPoint} from '../src/data/education.ts';
test('Education dataset contains seven chronological stages and six locations with repeated Argao chapters',()=>{
 assert.equal(educationEntries.length,7);assert.equal(educationPlaces.length,6);
 assert.equal(new Set(educationEntries.map(e=>e.id)).size,7);
 assert.deepEqual(educationEntries.filter(e=>e.place==='aloran').map(e=>e.stage),['Kindergarten through Grade 2']);
 assert.deepEqual(educationEntries.filter(e=>e.place==='argao').map(e=>e.stage),['Grade 3 (Before Semester Break)','Grade 10']);
 assert.equal(educationEntries.find(e=>e.schoolName==='Central Philippine University').stage,'Grades 6–9');
 for(const entry of educationEntries)assert.ok(educationPlaces.some(place=>place.id===entry.place));
 const latest=educationEntries.at(-1);assert.equal(latest.stage,'Grade 11 through 4th Year College');assert.equal(latest.recognition.length,4);
 assert.equal(educationEntries[0].schoolName,'Not yet confirmed');
 assert.deepEqual(educationEntries.map(e=>e.recognition),[[],['Honors List'],['Honors List'],['Class Auditor','Honors List','Pageant Winner (Mr. Academa 2016)'],['Class President','Honors List'],['Valedictorian','Honors List'],['Honors List','Graduated with High Honors (Senior High School)','College Volunteer',"Consistent Dean's Lister"]]);
});
test('Education map uses the same bounded projection for all markers and a six-file school-logo manifest',()=>{
 for(const place of educationPlaces){const [x,y]=educationPoint(place.coordinates);assert.ok(x>0&&x<600&&y>0&&y<620)}
 assert.deepEqual([...new Set(educationEntries.map(e=>e.logo).filter(Boolean))],[
  'aloran-christian-school-inc.jpg','binlod-elementary-school.jpg','river-of-knowledge-foundation-academy-inc.jpg',
  'central-philippine-university.jpg','christian-learning-center-of-argao-cebu-inc.png','university_of_cebu_main_campus.jpg'
 ]);
 assert.equal(educationEntries[0].logo,undefined);
});
test('School-logo lookup serves existing files unchanged and omits missing or unsafe filenames',async()=>{
 await mkdir('.cache/education-map',{recursive:true});
 const dir=await mkdtemp(resolve('.cache/education-map/logo-test-'));
 try{
  assert.equal(schoolLogoUrl('central-philippine-university.png',dir),undefined);
  assert.equal(schoolLogoUrl(undefined,dir),undefined);
  await writeFile(resolve(dir,'school_logo.jpg'),Buffer.from([255,216,255]));
  assert.equal(schoolLogoUrl('school_logo.jpg',dir),'/school-logos/school_logo.jpg');
  assert.equal(schoolLogoUrl('../resume.png',dir),undefined);
  assert.equal(schoolLogoUrl('school.svg',dir),undefined);
  await writeFile(resolve(dir,'central-philippine-university.png'),Buffer.from([137,80,78,71]));
  assert.equal(schoolLogoUrl('central-philippine-university.png',dir),'/school-logos/central-philippine-university.png');
 }finally{await unlink(resolve(dir,'central-philippine-university.png')).catch(()=>{});await unlink(resolve(dir,'school_logo.jpg')).catch(()=>{});await rmdir(dir)}
});
