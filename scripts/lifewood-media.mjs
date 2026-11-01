import {readFile,writeFile,mkdir,stat,realpath,lstat,rm,copyFile} from 'node:fs/promises';
import {resolve,join,sep,dirname,basename} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
// Astro rebases import.meta.url into dist/.prerender when bundling server components.
const workspace=process.cwd();
const defaults={workspace,source:resolve(workspace,'public/lifewood'),cache:resolve(workspace,'.cache/lifewood-media'),manifest:resolve(workspace,'src/data/lifewood-photos.json')};
const safeName=name=>typeof name==='string'&&/^[a-z0-9][a-z0-9 ._#()-]*\.(?:jpe?g|png|webp|avif)$/i.test(name)&&basename(name)===name;
async function exists(file){try{return(await stat(file)).isFile()}catch{return false}}
/** Server/build only: explicit approval; raw photos never become public URLs. */
export async function prepareLifewoodPhotos(options={}){
 const config={...defaults,...options},entries=JSON.parse(await readFile(config.manifest,'utf8'));
 if(!Array.isArray(entries))throw Error('Lifewood photo manifest must be an array');
 const photos=[];
 for(const entry of entries){
  if(!entry||entry.publication!=='approved'||!safeName(entry.filename)||entries.filter(n=>n?.filename===entry.filename).length!==1)continue;
  const source=resolve(config.source,entry.filename);
  try{
   if((await lstat(source)).isSymbolicLink())continue;
   const real=await realpath(source),sourceRoot=await realpath(config.source);if(!real.startsWith(sourceRoot+sep))continue;
   const bytes=await readFile(real),hash=createHash('sha256').update(bytes).digest('hex').slice(0,16),stem=entry.filename.replace(/\.[^.]+$/,'').toLowerCase().replace(/[^a-z0-9._-]+/g,'-')+'-'+hash;
   const outputs=[];
   await mkdir(config.cache,{recursive:true});
   for(const width of [1280,320]){
    const name=stem+'-'+width+'.webp',file=join(config.cache,name);
    if(!await exists(file))await sharp(bytes).rotate().resize({width,withoutEnlargement:true}).webp({quality:85,effort:4}).toFile(file);
    outputs.push({name,file});
   }
   const metadata=await sharp(outputs[0].file).metadata();
   photos.push({id:stem,src:'/experience-media/'+outputs[0].name,thumbnail:'/experience-media/'+outputs[1].name,width:metadata.width,height:metadata.height,alt:typeof entry.alt==='string'&&entry.alt.trim()?entry.alt.trim():'Internship photograph '+(photos.length+1),...(typeof entry.caption==='string'&&entry.caption.trim()?{caption:entry.caption.trim()}:{}),files:outputs});
  }catch(error){if(error?.code==='ENOENT')continue;/* Corrupt/unreadable media is withheld. */}
 }
 return photos;
}
function outputTarget(output,name,root){
 const base=resolve(output),allowed=base===resolve(root,'dist')||base.startsWith(resolve(root,'.cache')+sep);
 if(!allowed||dirname(resolve(base,name))!==base)throw Error('Refusing to alter a non-generated Lifewood output');
 return resolve(base,name);
}
export async function emitLifewoodBuild(output,options={}){
 const config={...defaults,...options},raw=outputTarget(output,'lifewood',config.workspace),media=outputTarget(output,'experience-media',config.workspace);
 // Verified generated descendants only. public/lifewood originals are never changed.
 await rm(raw,{recursive:true,force:true});await mkdir(raw,{recursive:true});
 await writeFile(join(raw,'README.md'),'Only explicitly approved optimized media is published at /experience-media/. Raw photographs are withheld.\n');
 await rm(media,{recursive:true,force:true});await mkdir(media,{recursive:true});
 const photos=await prepareLifewoodPhotos(config);
 for(const photo of photos)for(const file of photo.files)await copyFile(file.file,join(media,file.name));
 return photos;
}
function sourceGuard(){
 return{name:'lifewood-photo-source-guard',configureServer(server){
  server.middlewares.use(async(req,res,next)=>{
   let url;try{let value=new URL(req.url??'/','http://localhost').pathname;for(let n=0;n<3&&value.includes('%');n++)value=decodeURIComponent(value);url=value.replaceAll('\\','/')}catch{res.writeHead(400).end();return}
   if(/(?:^|\/)lifewood(?:\/|$)/i.test(url)){res.writeHead(403).end('Original photographs are not served');return}
   if(!url.startsWith('/experience-media/')){next();return}
   try{
    const photos=await prepareLifewoodPhotos(),file=photos.flatMap(p=>p.files).find(f=>'/experience-media/'+f.name===url);
    if(!file){res.writeHead(404).end();return}
    res.writeHead(200,{'Content-Type':'image/webp','Cache-Control':'no-store'});res.end(req.method==='HEAD'?undefined:await readFile(file.file));
   }catch{res.writeHead(404).end()}
  });
 }};
}
export function lifewoodMediaIntegration(){
 return{name:'lifewood-approved-photography',hooks:{
  'astro:config:setup':({updateConfig})=>updateConfig({vite:{plugins:[sourceGuard()]}}),
  'astro:build:done':async({dir})=>{await emitLifewoodBuild(fileURLToPath(dir))}
 }};
}
