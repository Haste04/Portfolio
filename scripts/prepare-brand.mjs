import sharp from 'sharp';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import branding from '../src/data/branding.json' with {type:'json'};
/** Supplied PNGs are read-only; generated outputs always have separate paths. */
export async function prepareBrand(){
 await mkdir('public/assets/brand',{recursive:true});
 const sources=[];
 for(const [kind,asset] of Object.entries(branding)){
  const bytes=await readFile(asset.source),sha256=createHash('sha256').update(bytes).digest('hex');
  if(sha256!==asset.sha256)throw Error('Brand source changed: '+asset.source+'. Inspect and approve the replacement before updating its manifest.');
  const target='public'+asset.output;
  if(target===asset.source)throw Error('Brand output must not overwrite its source');
  const mark=sharp(bytes).extract(asset.crop);
  if(kind==='logo')await mark.resize({width:264}).webp({quality:94}).toFile(target);
  else await mark.resize({width:64,height:64,fit:'contain',background:{r:0,g:0,b:0,alpha:0}}).png().toFile(target);
  if(!bytes.equals(await readFile(asset.source)))throw Error('Brand source changed during processing');
  sources.push({source:asset.source,sha256,width:asset.width,height:asset.height,alpha:true,crop:asset.crop,target});
 }
 await mkdir('.cache',{recursive:true});
 await writeFile('.cache/portfolio-logo-integrity.json',JSON.stringify({sources},null,2));
}
