import {isTheme,resolveTheme,themeColors,themeKey,type Theme} from './theme-preference';
// Keep a manual choice through bfcache/controller restoration even if storage is denied.
let manualChoice:Theme|undefined;
/** One authority; native snapshots never replace live page or mascot nodes. */
class ThemeController {
 private events=new AbortController();
 private system=matchMedia('(prefers-color-scheme: dark)');
 private reduced=matchMedia('(prefers-reduced-motion: reduce)');
 private explicit=false;private busy=false;private destroyed=false;private epoch=0;
 private target:Theme|undefined;private transition:ViewTransition|undefined;
 private animations=new Set<Animation>();private deadline:number|undefined;
 private expectedScroll:number|undefined;
 private images=new Map<string,Promise<void>>();private interruption:AbortController|undefined;
 private button:HTMLButtonElement;private emblem:HTMLElement;
 constructor(button:HTMLButtonElement,emblem:HTMLElement){
  this.button=button;this.emblem=emblem;
  let saved:string|null=null;try{saved=localStorage.getItem(themeKey)}catch{}
  this.explicit=manualChoice!==undefined||isTheme(saved);this.apply(manualChoice??resolveTheme(saved,this.system.matches));button.hidden=false;
  const signal=this.events.signal;
  button.addEventListener('click',()=>{if(!this.busy)void this.choose(this.theme==='dark'?'light':'dark');},{signal});
  this.system.addEventListener('change',()=>{if(!this.explicit)this.apply(this.system.matches?'dark':'light');},{signal});
  const settle=():void=>{if(this.busy&&!this.allowed())this.finish(this.epoch);};
  this.reduced.addEventListener('change',settle,{signal});
  document.addEventListener('visibilitychange',settle,{signal});
  window.addEventListener('resize',()=>{if(this.busy)this.finish(this.epoch);},{signal,passive:true});
  const pause=document.querySelector('[data-fresh-pause]');
  if(pause){this.pauseObserver=new MutationObserver(settle);this.pauseObserver.observe(pause,{attributes:true,attributeFilter:['aria-pressed']});}
  window.addEventListener('pagehide',()=>this.destroy(),{signal});
  document.addEventListener('astro:before-swap',()=>this.destroy(),{signal});
 }
 private pauseObserver:MutationObserver|undefined;
 private get theme():Theme{return document.documentElement.dataset.theme==='light'?'light':'dark';}
 private allowed():boolean{return !this.destroyed&&!document.hidden&&!this.reduced.matches&&document.querySelector('[data-fresh-pause]')?.getAttribute('aria-pressed')!=='true';}
 private apply(theme:Theme):void{
  const root=document.documentElement;
  // Larger light labels can reflow preceding sections. Keep the section being read fixed.
  const anchor=root.dataset.theme!==theme&&scrollY>0?[...document.querySelectorAll<HTMLElement>('main > section')].find(node=>{const r=node.getBoundingClientRect();return r.top<=innerHeight/2&&r.bottom>innerHeight/2}):undefined;
  const anchorTop=anchor?.getBoundingClientRect().top,overflowAnchor=root.style.overflowAnchor;
  if(anchor)root.style.overflowAnchor='none';
  root.dataset.theme=theme;root.style.colorScheme=theme;
  const meta=document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');if(meta)meta.content=themeColors[theme];
  for(const image of document.querySelectorAll<HTMLImageElement>('[data-theme-image]')){
   const src=theme==='dark'?image.dataset.themeDarkSrc:image.dataset.themeLightSrc;
   if(src&&image.getAttribute('src')!==src)image.src=src;
   image.dataset.themeReady='';
  }
  const next=theme==='dark'?'light':'dark';this.button.setAttribute('aria-label','Switch to '+next+' mode');this.button.title='Switch to '+next+' mode';
  const status=document.querySelector('[data-theme-status]');if(status)status.textContent=(theme==='dark'?'Dark':'Light')+' theme active.';
  if(anchor&&anchorTop!==undefined){
   window.scrollBy({top:anchor.getBoundingClientRect().top-anchorTop,behavior:'instant'});
   this.expectedScroll=scrollY;root.style.overflowAnchor=overflowAnchor;
  }
 }
 private preload(src:string):Promise<void>{
  let pending=this.images.get(src);if(pending)return pending;
  const image=new Image();image.src=src;pending=image.decode();this.images.set(src,pending);return pending;
 }
 private track(animation:Animation):Animation{
  this.animations.add(animation);
  void animation.finished.catch(()=>{});return animation;
 }
 private finish(key:number):void{
  if(key!==this.epoch)return;this.epoch++;
  try{this.transition?.skipTransition()}catch{}this.transition=undefined;
  for(const animation of this.animations)animation.cancel();this.animations.clear();
  if(this.deadline!==undefined)clearTimeout(this.deadline);this.deadline=undefined;
  if(this.target)this.apply(this.target);this.target=undefined;
  this.interruption?.abort();this.interruption=undefined;
  this.emblem.hidden=true;this.emblem.style.removeProperty('opacity');
  delete document.documentElement.dataset.themeRevealing;this.busy=false;this.button.removeAttribute('aria-disabled');this.expectedScroll=undefined;
 }
 private async choose(theme:Theme):Promise<void>{
  if(this.busy||this.destroyed)return;
  this.explicit=true;manualChoice=theme;try{localStorage.setItem(themeKey,theme)}catch{}
  if(!this.allowed()||typeof document.startViewTransition!=='function'){this.apply(theme);return;}
  const key=++this.epoch;this.expectedScroll=undefined;this.busy=true;this.target=theme;this.button.setAttribute('aria-disabled','true');
  const root=document.documentElement;
  root.dataset.themeRevealing='preparing';
  this.interruption=new AbortController();
  const signal=this.interruption.signal;
  window.addEventListener('scroll',()=>{
   if(this.expectedScroll!==undefined&&Math.abs(scrollY-this.expectedScroll)<1){this.expectedScroll=undefined;return;}
   this.expectedScroll=undefined;this.finish(key);
  },{signal,passive:true});
  document.addEventListener('click',event=>{if(event.target instanceof Element&&event.target.closest('a[href^="#"]'))this.finish(key);},{signal});
  window.addEventListener('keydown',event=>{if(event.key==='Escape')this.finish(key);},{signal});
  // Bound decode/API failures and interrupted snapshots; no perpetual frame loop.
  this.deadline=window.setTimeout(()=>this.finish(key),2400);
  try{
   const urls=new Set<string>([this.emblem.querySelector<HTMLImageElement>('img')!.src]);
   for(const image of document.querySelectorAll<HTMLImageElement>('[data-theme-image]')){
    const r=image.getBoundingClientRect();if(!r.width||r.bottom<=0||r.top>=innerHeight)continue;
    const url=theme==='dark'?image.dataset.themeDarkSrc:image.dataset.themeLightSrc;if(url)urls.add(url);
   }
   await Promise.allSettled([...urls].map(url=>this.preload(url)));
   if(key!==this.epoch)return;
   this.emblem.dataset.incoming=theme;this.emblem.hidden=false;root.dataset.themeRevealing='anticipation';
   const appear=this.track(this.emblem.animate([
    {opacity:0,transform:'translate(-50%, -50%) scale(.78)'},
    {opacity:1,transform:'translate(-50%, -50%) scale(1)'}
   ],{duration:200,easing:'cubic-bezier(.2,.8,.2,1)',fill:'forwards'}));
   await appear.finished;if(key!==this.epoch)return;
   const transition=document.startViewTransition(async()=>{
    if(key!==this.epoch)return;
    this.apply(theme);
    // Await only visible small branding images; offscreen lazy photos remain lazy.
    await Promise.allSettled([...document.querySelectorAll<HTMLImageElement>('[data-theme-image]')].filter(image=>{
     const r=image.getBoundingClientRect();return r.width>0&&r.bottom>0&&r.top<innerHeight;
    }).map(image=>image.decode()));
   });
   this.transition=transition;
   void transition.updateCallbackDone.catch(()=>{});void transition.finished.catch(()=>{});
   await transition.ready;if(key!==this.epoch)return;
   root.dataset.themeRevealing='reveal';
   const radius=Math.ceil(Math.hypot(innerWidth/2,innerHeight/2))+3;
   const reveal=this.track(root.animate([
    {clipPath:'circle(0px at 50% 50%)'},
    {clipPath:'circle('+radius+'px at 50% 50%)'}
   ],{duration:820,easing:'cubic-bezier(.65,0,.2,1)',fill:'forwards',pseudoElement:'::view-transition-new(root)'}));
   if((reveal.effect as KeyframeEffect).pseudoElement!=='::view-transition-new(root)')throw Error('Snapshot animation unavailable');
   this.track(root.animate([{opacity:1,offset:0},{opacity:1,offset:.3},{opacity:0,offset:.78},{opacity:0,offset:1}],{
    duration:820,easing:'ease-out',fill:'forwards',pseudoElement:'::view-transition-group(theme-emblem)'
   }));
   await reveal.finished;await transition.finished;
  }catch{/* Unsupported/rejected snapshots and cancellations settle to the requested theme. */}
  finally{this.finish(key);}
 }
 destroy():void{
  if(this.destroyed)return;if(this.busy)this.finish(this.epoch);
  this.destroyed=true;this.events.abort();this.pauseObserver?.disconnect();
 }
}
let current:ThemeController|undefined;
export function initTheme():void{
 current?.destroy();
 const button=document.querySelector<HTMLButtonElement>('[data-theme-toggle]'),emblem=document.querySelector<HTMLElement>('[data-theme-emblem]');
 current=button&&emblem?new ThemeController(button,emblem):undefined;
}
