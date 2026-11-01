import {readFile,copyFile,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {stories} from '../src/data/about.ts';
/** App-owned source copies let Astro generate responsive WebP assets; originals remain untouched. */
export async function prepareAboutSources(){
 const target=resolve('src/assets/about');await mkdir(target,{recursive:true});
 for(const story of stories){const source=resolve('public/about-section',story.photo),output=resolve(target,story.id+'.jpg'),bytes=await readFile(source);let same=false;try{same=bytes.equals(await readFile(output))}catch{}if(!same)await copyFile(source,output);}
}
