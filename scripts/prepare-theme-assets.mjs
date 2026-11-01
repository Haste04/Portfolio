import sharp from 'sharp';
import {mkdir,readFile} from 'node:fs/promises';
/** Separate derivatives only. The supplied originals remain byte-for-byte unchanged. */
export async function prepareThemeAssets(){
 await mkdir('public/assets/brand',{recursive:true});
 await mkdir('public/company-logos',{recursive:true});
 const logo=await readFile('public/assets/brand/portfolio-logo.png');
 await sharp(logo).extract({left:0,top:400,width:1254,height:480}).resize({width:264}).webp({quality:94}).toFile('public/assets/brand/portfolio-logo-light.webp');
 const lifewood=await readFile('public/lifewood/Lifewood Logo Light Mode.png');
 await sharp(lifewood).resize({width:440,withoutEnlargement:true}).webp({quality:94}).toFile('public/company-logos/lifewood-logo-light.webp');
}
