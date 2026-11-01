import assert from 'node:assert/strict';
import {test} from 'node:test';
import {existsSync} from 'node:fs';
import {mkdtemp,mkdir,writeFile,readFile,readdir} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import sharp from 'sharp';
test('Photo processing withholds pending/private/unlisted files and emits approved optimized derivatives only',async()=>{
 assert.ok(existsSync('scripts/lifewood-media.mjs'),'fail-closed photo integration is required');
 const {prepareLifewoodPhotos,emitLifewoodBuild}=await import('../scripts/lifewood-media.mjs');
 await mkdir('.cache/experience-showcase',{recursive:true});const root=await mkdtemp(resolve('.cache/experience-showcase/media-')),source=join(root,'public/lifewood'),cache=join(root,'cache'),output=join(root,'dist');
 await mkdir(source,{recursive:true});await mkdir(join(output,'lifewood'),{recursive:true});
 const bytes=await sharp({create:{width:96,height:144,channels:3,background:'#d88a46'}}).png().toBuffer();
 for(const name of ['approved.png','pending.png','private.png','unlisted.png']){await writeFile(join(source,name),bytes);await writeFile(join(output,'lifewood',name),bytes)}
 await writeFile(join(source,'README.md'),'User originals, never publish raw files.');
 const manifest=join(root,'photos.json');await writeFile(manifest,JSON.stringify([{filename:'approved.png',publication:'approved',alt:'Test image'},{filename:'pending.png',publication:'pending'},{filename:'private.png',publication:'private'}]));
 const options={source,cache,manifest,workspace:root};const photos=await prepareLifewoodPhotos(options);
 assert.equal(photos.length,1);assert.equal(photos[0].alt,'Test image');assert.ok(photos[0].height>photos[0].width);
 assert.match(photos[0].src,/^\/experience-media\/.+\.webp$/);assert.notEqual(photos[0].src,photos[0].thumbnail);
 await emitLifewoodBuild(output,options);assert.deepEqual((await readdir(join(output,'lifewood'))).filter(n=>n!=='README.md'),[]);
 assert.equal((await readdir(join(output,'experience-media'))).length,2);assert.deepEqual(await readFile(join(source,'approved.png')),bytes);
 await writeFile(manifest,'[]');await emitLifewoodBuild(output,options);assert.deepEqual(await readdir(join(output,'experience-media')),[],'revocation removes old production derivatives');
});
test('Missing, unsafe and unapproved photo entries cannot become public URLs',async()=>{
 assert.ok(existsSync('scripts/lifewood-media.mjs'));
 const {prepareLifewoodPhotos}=await import('../scripts/lifewood-media.mjs');await mkdir('.cache/experience-showcase',{recursive:true});
 const root=await mkdtemp(resolve('.cache/experience-showcase/safety-'));const manifest=join(root,'photos.json');
 await writeFile(manifest,JSON.stringify([{filename:'../escape.jpg',publication:'approved'},{filename:'missing.jpg',publication:'approved'},{filename:'unknown.jpg'},{filename:'remote.svg',publication:'approved'}]));
 assert.deepEqual(await prepareLifewoodPhotos({manifest,source:join(root,'source'),cache:join(root,'cache'),workspace:root}),[]);
});

test('Photo integration blocks raw and encoded source requests while leaving other assets alone',async()=>{
 const {lifewoodMediaIntegration}=await import('../scripts/lifewood-media.mjs');let plugin,handler;
 lifewoodMediaIntegration().hooks['astro:config:setup']({updateConfig:config=>{plugin=config.vite.plugins[0]}});
 plugin.configureServer({middlewares:{use:callback=>{handler=callback}}});
 for(const url of ['/lifewood/private.jpg','/lifewood/%70rivate.jpg','/@fs/C:/Portfolio/public/lifewood/private.jpg']){
  let status,next=false;const response={writeHead(code){status=code;return this},end(){}};
  await handler({url,method:'GET'},response,()=>{next=true});assert.equal(status,403);assert.equal(next,false);
 }
 let next=false;await handler({url:'/assets/projects/anthea-640.webp',method:'GET'},{},()=>{next=true});assert.equal(next,true);
});
test('Photo output cleanup refuses source folders and ambiguous approvals remain withheld',async()=>{
 const {prepareLifewoodPhotos,emitLifewoodBuild}=await import('../scripts/lifewood-media.mjs');const root=await mkdtemp(resolve('.cache/experience-showcase/refusal-')),source=join(root,'public/lifewood'),manifest=join(root,'photos.json');
 await mkdir(source,{recursive:true});const bytes=await sharp({create:{width:32,height:32,channels:3,background:'#24262c'}}).png().toBuffer();await writeFile(join(source,'same.png'),bytes);
 await writeFile(manifest,JSON.stringify([{filename:'same.png',publication:'approved'},{filename:'same.png',publication:'private'}]));
 const options={workspace:root,source,manifest,cache:join(root,'cache')};assert.deepEqual(await prepareLifewoodPhotos(options),[]);
 await assert.rejects(()=>emitLifewoodBuild(source,options),/non-generated/);assert.deepEqual(await readFile(join(source,'same.png')),bytes);
});

test('Actual uploaded filenames with spaces and # remain unchanged while public derivative URLs are safe',async()=>{
 const {prepareLifewoodPhotos}=await import('../scripts/lifewood-media.mjs');
 const root=await mkdtemp(resolve('.cache/experience-showcase/upload-names-')),source=join(root,'public/lifewood'),manifest=join(root,'photos.json');
 await mkdir(source,{recursive:true});
 const bytes=await sharp({create:{width:96,height:64,channels:3,background:'#24262c'}}).jpeg().toBuffer();
 const filename='Lifewood Picture #1.jpg';await writeFile(join(source,filename),bytes);
 await writeFile(manifest,JSON.stringify([{filename,publication:'approved',alt:'Synthetic filename fixture'}]));
 const photos=await prepareLifewoodPhotos({workspace:root,source,manifest,cache:join(root,'cache')});
 assert.equal(photos.length,1);assert.doesNotMatch(photos[0].src,/[\s#%]/);
 assert.deepEqual(await readFile(join(source,filename)),bytes);
});
