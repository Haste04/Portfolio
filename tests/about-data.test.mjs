import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFile} from 'node:fs/promises';
test('Photo stories preserve every original title, label, teaser and complete paragraph',async()=>{
 const original=JSON.parse(await readFile('tests/fixtures/about-stories.json','utf8'));
 const {stories}=await import('../src/data/about.ts');
 assert.deepEqual(stories.map(({title,label,teaser,detail})=>({title,label,teaser,detail})),original);
 assert.deepEqual(stories.map(n=>n.photo),['The Learner.jpg','The Builder.jpg','The Explorer.jpg','Beyond Code.jpg']);
});
