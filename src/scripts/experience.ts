import {motionPolicy,preferences} from './motion/policy';
import type {ExperiencePhoto} from '../data/experience';
type View='map'|'gallery';
let current:ExperienceController|undefined;
/** Inner interactive transforms only; GSAP owns independent outer wrappers. */
class ExperienceController{
 private root:HTMLElement;private map:HTMLElement;private gallery:HTMLElement;private photos:ExperiencePhoto[];
 private events=new AbortController();private observers:MutationObserver[]=[];private animations=new Set<Animation>();
 private photoAnimation:Animation|undefined;private epoch=0;private photoEpoch=0;private view:View='map';private selected=0;private focusReturn:Element|undefined;private requestedScroll=0;
 constructor(root:HTMLElement){
  this.root=root;this.map=root.querySelector('[data-experience-view="map"]')!;this.gallery=root.querySelector('[data-experience-view="gallery"]')!;
  this.photos=JSON.parse(root.querySelector('[data-experience-photos]')?.textContent??'[]');
  if(!this.map||!this.gallery||!Array.isArray(this.photos))throw Error('Incomplete Experience presentation');
  try{this.view=root.dataset.experienceMode==='gallery'?'gallery':'map';this.bind();this.setupPhotos();root.dataset.experienceEnhanced='';this.commit();}
  catch(error){this.destroy();throw error}
 }
 private allowed():boolean{return motionPolicy(preferences(document.querySelector('[data-fresh-pause]')?.getAttribute('aria-pressed')==='true')).mode==='active';}
 private cancel():void{this.epoch++;for(const a of this.animations)a.cancel();this.animations.clear();this.photoAnimation=undefined;this.root.dataset.experienceMoving='false';}
 private track(a:Animation):Animation{this.animations.add(a);void a.finished.then(()=>this.animations.delete(a)).catch(()=>this.animations.delete(a));return a;}
 private commit():void{
  for(const [name,node]of [['map',this.map],['gallery',this.gallery]] as const){node.hidden=name!==this.view;node.inert=name!==this.view;}
  this.root.dataset.experienceMode=this.view;
  for(const trigger of this.root.querySelectorAll('[data-experience-open]'))trigger.setAttribute('aria-expanded',String(this.view==='gallery'));
 }
 private async show(view:View,trigger?:Element):Promise<void>{
  if(view===this.view)return;this.cancel();this.photoEpoch++;const key=this.epoch;
  if(view==='gallery')this.focusReturn=trigger;this.requestedScroll=scrollY;
  this.view=view;const incoming=view==='gallery'?this.gallery:this.map,outgoing=view==='gallery'?this.map:this.gallery;
  if(view==='gallery'&&this.photos.length)void this.selectPhoto(this.selected,false);
  incoming.hidden=false;incoming.inert=false;outgoing.inert=true;this.root.dataset.experienceMode=view;
  if(this.allowed()&&typeof incoming.animate==='function'){
   this.root.dataset.experienceMoving='true';const options={duration:560,easing:'cubic-bezier(.22,.72,.24,1)'};
   const a=this.track(outgoing.animate([{opacity:1,transform:'translateY(0) scale(1)'},{opacity:0,transform:'translateY(-12px) scale(.98)'}],options));
   const b=this.track(incoming.animate([{opacity:0,transform:'translateY(18px) scale(.97)'},{opacity:1,transform:'translateY(0) scale(1)'}],options));
   try{await Promise.all([a.finished,b.finished])}catch{}
  }
  if(key!==this.epoch)return;
  const active=document.activeElement,ownsFocus=!active||active===document.body||outgoing.contains(active);
  this.commit();this.root.dataset.experienceMoving='false';
  if(ownsFocus&&!document.hidden&&Math.abs(scrollY-this.requestedScroll)<64){
   if(view==='gallery')this.gallery.focus({preventScroll:true});
   else if(this.focusReturn instanceof HTMLElement||this.focusReturn instanceof SVGElement)this.focusReturn.focus({preventScroll:true});
  }
  this.status(view==='gallery'?(this.photos.length?'Internship photographs. '+this.photos.length+' available.':'Internship photographs will be added here.'):'Cebu City map.');
 }
 private status(text:string):void{const n=this.root.querySelector('[data-experience-status]');if(n)n.textContent=text;}
 private setupPhotos():void{
  this.root.querySelector<HTMLElement>('[data-experience-empty]')!.hidden=!!this.photos.length;
  this.root.querySelector<HTMLElement>('[data-experience-gallery-content]')!.hidden=!this.photos.length;
  this.root.querySelector<HTMLElement>('[data-experience-photo-controls]')!.hidden=!this.photos.length;
  const previews=this.root.querySelector<HTMLElement>('[data-experience-filmstrip]');
  if(previews){
   previews.hidden=!this.photos.length;
   // SSR supplies native links; reconcile refreshed catalogs without another controller.
   if(previews.children.length!==Math.min(2,this.photos.length)){
    previews.replaceChildren();
    this.photos.slice(0,2).forEach((photo,index)=>{
     const link=document.createElement('a');link.href='#experience-gallery';link.dataset.experienceOpen='';link.dataset.experiencePreview=String(index);link.setAttribute('aria-controls','experience-gallery');link.setAttribute('aria-expanded','false');link.setAttribute('aria-label','Open photograph '+(index+1));
     const image=document.createElement('img');image.src=photo.thumbnail;image.alt='';image.width=160;image.height=96;image.loading='lazy';image.decoding='async';
     const number=document.createElement('span');number.setAttribute('aria-hidden','true');number.textContent=String(index+1).padStart(2,'0');link.append(image,number);previews.append(link);
    });
   }
   for(const image of previews.querySelectorAll('img'))image.addEventListener('error',()=>{image.hidden=true;},{once:true,signal:this.events.signal});
  }
  if(!this.photos.length)return;
  const thumbs=this.root.querySelector<HTMLElement>('[data-experience-thumbnails]')!;thumbs.replaceChildren();
  this.photos.forEach((photo,index)=>{
   const button=document.createElement('button');button.type='button';button.dataset.experienceThumbnail=String(index);button.setAttribute('aria-label','View photograph '+(index+1));
   const image=document.createElement('img');image.src=photo.thumbnail;image.alt='';image.width=64;image.height=48;image.loading='lazy';image.decoding='async';
   image.addEventListener('error',()=>{image.hidden=true;button.textContent=String(index+1).padStart(2,'0')},{once:true,signal:this.events.signal});
   button.append(image);thumbs.append(button);
  });
  this.renderPhoto(this.photos[0]!);this.syncPhoto();
 }
 private renderPhoto(photo:ExperiencePhoto):void{
  const image=this.root.querySelector<HTMLImageElement>('[data-experience-photo]')!;
  image.hidden=false;image.src=photo.src;image.alt=photo.alt;image.width=photo.width;image.height=photo.height;
  this.root.querySelector<HTMLElement>('[data-experience-photo-error]')!.hidden=true;
  this.root.querySelector('[data-experience-caption]')!.textContent=photo.caption??'';
 }
 private syncPhoto():void{
  this.root.querySelector<HTMLButtonElement>('[data-experience-previous]')!.disabled=this.selected===0;
  this.root.querySelector<HTMLButtonElement>('[data-experience-next]')!.disabled=this.selected===this.photos.length-1;
  this.root.querySelector('[data-experience-counter]')!.textContent=String(this.selected+1).padStart(2,'0')+' / '+String(this.photos.length).padStart(2,'0');
  for(const n of this.root.querySelectorAll('[data-experience-thumbnail]'))n.setAttribute('aria-pressed',String(n.getAttribute('data-experience-thumbnail')===String(this.selected)));
 }
 private async selectPhoto(index:number,animate=true):Promise<void>{
  if(!this.photos.length)return;this.photoAnimation?.cancel();this.photoAnimation=undefined;this.selected=Math.max(0,Math.min(this.photos.length-1,index));this.syncPhoto();
  const photo=this.photos[this.selected]!,key=++this.photoEpoch;this.root.dataset.experienceSelectedPhoto=photo.id;
  const preload=new Image();preload.src=photo.src;
  try{await preload.decode()}catch{if(key===this.photoEpoch){this.root.querySelector<HTMLImageElement>('[data-experience-photo]')!.hidden=true;this.root.querySelector<HTMLElement>('[data-experience-photo-error]')!.hidden=false;}return}
  if(key!==this.photoEpoch||this.events.signal.aborted)return;this.renderPhoto(photo);
  if(animate&&this.allowed())this.photoAnimation=this.track(this.root.querySelector<HTMLElement>('.experience-photo-stage')!.animate([{opacity:.65,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:320,easing:'ease-out'}));
  this.status('Photograph '+(this.selected+1)+' of '+this.photos.length+'. '+(photo.caption??photo.alt));
  const nearby=this.photos[this.selected+1];if(this.view==='gallery'&&!document.hidden&&nearby){const image=new Image();image.src=nearby.src;}
 }
 private bind():void{
  const signal=this.events.signal;
  this.root.addEventListener('click',event=>{
   const target=event.target instanceof Element?event.target.closest('[data-experience-open],[data-experience-back],[data-experience-thumbnail],[data-experience-previous],[data-experience-next]'):null;
   if(!target)return;if(target.matches('a')&&event instanceof MouseEvent&&(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey||event.button!==0))return;
   event.preventDefault();
   if(target.hasAttribute('data-experience-open')){
    const preview=target.getAttribute('data-experience-preview');
    if(preview!==null&&this.photos.length){this.selected=Math.max(0,Math.min(this.photos.length-1,Number(preview)||0));this.syncPhoto();}
    void this.show('gallery',target);
   }
   else if(target.hasAttribute('data-experience-back'))void this.show('map');
   else if(target.hasAttribute('data-experience-thumbnail'))void this.selectPhoto(Number(target.getAttribute('data-experience-thumbnail')));
   else void this.selectPhoto(this.selected+(target.hasAttribute('data-experience-next')?1:-1));
  },{signal});
  this.gallery.addEventListener('keydown',event=>{
   if(event.key==='Escape'){event.preventDefault();void this.show('map');}
   else if(this.photos.length&&(event.key==='ArrowLeft'||event.key==='ArrowRight')&&event.target instanceof Element&&!event.target.closest('a')){event.preventDefault();void this.selectPhoto(this.selected+(event.key==='ArrowRight'?1:-1));}
  },{signal});
  const update=():void=>{if(!this.allowed()){this.cancel();this.commit();}};
  document.addEventListener('visibilitychange',update,{signal});matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',update,{signal});
  const pause=document.querySelector('[data-fresh-pause]');if(pause){const o=new MutationObserver(update);o.observe(pause,{attributes:true,attributeFilter:['aria-pressed']});this.observers.push(o);}
  const logo=this.root.querySelector<HTMLImageElement>('[data-experience-company-logo]');
  logo?.addEventListener('error',()=>{
   logo.hidden=true;this.root.querySelector('[data-experience-company-fallback]')?.removeAttribute('hidden');
  },{signal});
  if(logo?.hasAttribute('src')&&logo.complete&&logo.naturalWidth===0)logo.dispatchEvent(new Event('error'));
  const image=this.root.querySelector<HTMLImageElement>('[data-experience-photo]');image?.addEventListener('error',()=>{image.hidden=true;this.root.querySelector<HTMLElement>('[data-experience-photo-error]')!.hidden=false;},{signal});
  window.addEventListener('pagehide',()=>this.destroy(),{signal});document.addEventListener('astro:before-swap',()=>this.destroy(),{signal});
 }
 destroy():void{this.cancel();this.photoEpoch++;this.events.abort();for(const o of this.observers)o.disconnect();for(const n of [this.map,this.gallery]){n.hidden=false;n.inert=false;}delete this.root.dataset.experienceEnhanced;}
}
export function initExperience():void{current?.destroy();current=undefined;const root=document.querySelector<HTMLElement>('[data-experience]');if(root)try{current=new ExperienceController(root)}catch(error){if(import.meta.env.DEV)console.error('Experience enhancement failed; static content retained.',error);}}
