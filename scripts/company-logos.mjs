import {readdir} from 'node:fs/promises';
import {resolve} from 'node:path';
/** Build-time local discovery only: no downloads, substitutions, or source mutations. */
export async function findCompanyLogo(directory=resolve(process.cwd(),'public/company-logos')){
 let files;try{files=await readdir(directory,{withFileTypes:true})}catch(error){if(error.code==='ENOENT')return;throw error}
 for(const stem of ['lifewood-logo','lifewood','lifewood-data-technology'])
  for(const extension of ['svg','png','webp','jpg','jpeg','avif']){
   const file=files.find(entry=>entry.isFile()&&entry.name.toLowerCase()===stem+'.'+extension);
   if(file)return {src:'/company-logos/'+encodeURIComponent(file.name)};
  }
}
