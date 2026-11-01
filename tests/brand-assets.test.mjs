import assert from 'node:assert/strict';
import {test} from 'node:test';
import {mkdtemp,mkdir,copyFile,readFile} from 'node:fs/promises';
import {spawnSync} from 'node:child_process';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
const dark='23e78f657a9d72364362df696dfafb1ce9c8a57b695fbc5e6fad1300498382f0';
const sources={
 'public/assets/brand/Portfolio-Dark Mode.png':dark,
 'public/assets/brand/portfolio-logo.png':'cf6b4d14171aedf89871fef6dc7d7939955a17a77201d66cf17a793648d6af3d',
 'public/assets/brand/portfolio-favicon.png':'cf6b4d14171aedf89871fef6dc7d7939955a17a77201d66cf17a793648d6af3d'
};
test('site logo stays white while the favicon uses dark lettering, preserving all sources',async()=>{
 await mkdir('.cache',{recursive:true});const dir=await mkdtemp(resolve('.cache/brand-dark-'));
 await mkdir(join(dir,'public/assets/brand'),{recursive:true});
 for(const source of Object.keys(sources))await copyFile(source,join(dir,source));
 const module=pathToFileURL(resolve('scripts/prepare-brand.mjs')).href;
 const result=spawnSync(process.execPath,['--input-type=module','-e','import {prepareBrand} from '+JSON.stringify(module)+'; await prepareBrand();'],{cwd:dir,encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);
 for(const [source,expected] of Object.entries(sources))assert.equal(createHash('sha256').update(await readFile(join(dir,source))).digest('hex'),expected);
 for(const [file,width,height] of [['portfolio-logo.webp',264,101],['portfolio-favicon-64.png',64,64]]){
  const output=join(dir,'public/assets/brand',file),meta=await sharp(output).metadata();
  assert.equal(meta.hasAlpha,true);assert.equal(meta.width,width);assert.equal(meta.height,height);
  const {data,info}=await sharp(output).ensureAlpha().raw().toBuffer({resolveWithObject:true});let total=0,count=0,clear=0;
  for(let i=0;i<data.length;i+=info.channels){if(data[i+3]<1)clear++;if(data[i+3]>=128){total+=(data[i]+data[i+1]+data[i+2])/3;count++}}
  assert.ok(clear>0,'Transparency must survive');assert.ok(count>0);
  if(file==='portfolio-logo.webp')assert.ok(total/count>220,'Site logo must remain white');
  else assert.ok(total/count<100,'Favicon must use the light-mode logo with dark lettering');
 }
 const report=JSON.parse(await readFile(join(dir,'.cache/portfolio-logo-integrity.json'),'utf8'));
 assert.deepEqual(report.sources.map(source=>source.sha256),[dark,'cf6b4d14171aedf89871fef6dc7d7939955a17a77201d66cf17a793648d6af3d']);
});
