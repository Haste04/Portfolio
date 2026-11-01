import { motionPolicy, preferences } from './motion/policy';
import type { TechnologyId } from '../data/technologies';

interface Icon { src:string|null; fallback:string; }
interface Entry { id:TechnologyId; name:string; category:string; description:string; documentation:string; icon:Icon; projects:{id:string;title:string}[]; }
type View='overview'|'opening'|'focus'|'closing';
type Rect=Pick<DOMRect,'left'|'top'|'width'|'height'>;
const physical=new Set(['dragging','airborne','bouncing','settling','returning','section-transitioning']);
let current:TechnologyGallery|undefined;

/** One owner for gallery selection and finite presentation effects. The existing mascot remains its own owner. */
class TechnologyGallery {
 private root:HTMLElement; private views:HTMLElement; private overview:HTMLElement; private focus:HTMLElement; private zoom:HTMLElement;
 private buttons:HTMLButtonElement[]; private switcher:HTMLSelectElement;
 private dock:HTMLElement; private overviewAnchor:HTMLElement; private focusAnchor:HTMLElement;
 private entries:Entry[]; private selected:Entry; private hasSelection=false; private view:View='overview'; private wantsFocus=false;
 private events=new AbortController(); private observers:MutationObserver[]=[]; private animations=new Set<Animation>(); private epoch=0;
 private pendingPresentation:(()=>void)|undefined; private transitionScrollY=0;
 private desiredAnchor:'overview'|'focus'='overview'; private pendingDock=false; private destroyed=false;
 constructor(root:HTMLElement){
  this.root=root;this.views=root.querySelector<HTMLElement>('[data-tech-views]')!;
  this.overview=root.querySelector<HTMLElement>('[data-tech-overview]')!;this.focus=root.querySelector<HTMLElement>('[data-tech-focus]')!;
  this.zoom=root.querySelector<HTMLElement>('[data-tech-zoom-layer]')!;this.buttons=[...root.querySelectorAll<HTMLButtonElement>('button[data-technology]')];
  this.switcher=root.querySelector<HTMLSelectElement>('[data-tech-switch]')!;
  this.dock=root.querySelector<HTMLElement>('[data-fresh-dock="tech-stack"]')!;
  this.overviewAnchor=root.querySelector<HTMLElement>('#tech-overview-anchor')!;this.focusAnchor=root.querySelector<HTMLElement>('#tech-focus-anchor')!;
  this.entries=JSON.parse(root.querySelector('[data-technology-data]')?.textContent??'[]') as Entry[];
  if(!this.views||!this.focus||!this.zoom||!this.dock||this.entries.length!==this.buttons.length||!this.entries.length)throw Error('Incomplete technology gallery');
  const fragment=location.hash.startsWith('#technology-')?location.hash.slice(12):'';
  const saved=root.dataset.selectedTechnology;
  this.selected=this.entries.find(entry=>entry.id===(saved||fragment))??this.entries[0]!;
  this.hasSelection=!!(saved||fragment);const initialFocus=root.dataset.galleryView==='focus'||(!saved&&!!fragment);
  try{
   this.bind();this.buttons.forEach(button=>button.disabled=false);
   root.querySelector<HTMLElement>('[data-tech-static]')!.hidden=true;root.dataset.galleryEnhanced='';
   if(initialFocus){this.hasSelection=true;this.populate();this.markSelection();this.commitFocus(!saved);}
   else {this.markSelection();this.commitOverview(false);}
  }catch(error){this.destroy();throw error;}
 }
 private allowed():boolean{return motionPolicy(preferences(document.querySelector('[data-fresh-pause]')?.getAttribute('aria-pressed')==='true')).mode==='active';}
 private companion():HTMLElement|null{return document.querySelector<HTMLElement>('#fresh-companion');}
 private busyMascot():boolean{const host=this.companion();return host?.dataset.currentSection==='tech-stack'&&physical.has(host.dataset.state??'');}
 private deferPresentation(action:()=>void,request=false):boolean{
  // New user intent wins over terminal callbacks from an earlier animation.
  if(!request&&this.pendingPresentation)return true;
  if(this.busyMascot()){
   if(request)this.cancel();
   this.pendingPresentation=action;return true;
  }
  this.pendingPresentation=undefined;return false;
 }
 private placeDock(position:'overview'|'focus',force=false):void{
  this.desiredAnchor=position;
  if(!force&&this.busyMascot()){this.pendingDock=true;return;}
  const anchor=position==='focus'?this.focusAnchor:this.overviewAnchor;
  if(this.dock.parentElement!==anchor)anchor.append(this.dock);
  this.pendingDock=false;this.root.dataset.techMascotPlacement=position;
  
 }
 private track(animation:Animation):void{
  this.animations.add(animation);this.root.dataset.techMoving='true';
  const done=():void=>{this.animations.delete(animation);queueMicrotask(()=>{if(!this.events.signal.aborted&&!this.animations.size)this.root.dataset.techMoving='false';});};
  void animation.finished.then(done).catch(done);
 }
 private cancel():void{
  this.epoch++;for(const animation of this.animations)animation.cancel();this.animations.clear();this.zoom.replaceChildren();this.root.dataset.techMoving='false';
 }
 private setView(view:View):void{this.view=view;this.root.dataset.galleryView=view;}
 private markSelection():void{
  this.root.dataset.selectedTechnology=this.hasSelection?this.selected.id:'';
  for(const button of this.buttons)button.setAttribute('aria-pressed',String(this.hasSelection&&button.dataset.technology===this.selected.id));
  for(const category of this.root.querySelectorAll<HTMLElement>('[data-tech-category]'))category.classList.toggle('is-active-category',this.hasSelection&&category.dataset.techCategory===this.selected.category);
 }
 private asset(container:HTMLElement,entry:Entry):void{
  container.replaceChildren();container.setAttribute('data-tech-logo',entry.id);
  const fallback=document.createElement('span');fallback.className='tech-icon-fallback';fallback.setAttribute('data-tech-icon-fallback','');fallback.textContent=entry.icon.fallback;
  if(entry.icon.src?.startsWith('/technology-icons/')){
   const image=document.createElement('img');image.src=entry.icon.src;image.alt='';image.decoding='async';image.setAttribute('data-tech-image','');
   fallback.hidden=true;container.append(image);
  }
  container.append(fallback);
 }
 private populate():void{
  const entry=this.selected;
  this.focus.dataset.connection=entry.id;this.switcher.value=entry.id;
  this.root.querySelector('[data-tech-name]')!.textContent=entry.name;
  this.root.querySelector('[data-tech-category-name]')!.textContent=entry.category;
  this.root.querySelector('[data-tech-description]')!.textContent=entry.description;
  this.root.querySelector('[data-tech-position]')!.textContent=String(this.entries.indexOf(entry)+1).padStart(2,'0')+' / '+String(this.entries.length).padStart(2,'0')+' IN THE TOOLKIT';
  this.asset(this.root.querySelector<HTMLElement>('[data-tech-focus-logo]')!,entry);
  const links=this.root.querySelector<HTMLElement>('[data-tech-projects]')!;links.replaceChildren();
  for(const project of entry.projects){const item=document.createElement('li'),link=document.createElement('a');link.href='#project-'+project.id;link.textContent=project.title;item.append(link);links.append(item);}
  this.root.querySelector<HTMLElement>('[data-tech-no-projects]')!.hidden=entry.projects.length>0;
  const docs=this.root.querySelector<HTMLAnchorElement>('[data-tech-documentation]')!;docs.href=entry.documentation;
  for(const card of document.querySelectorAll<HTMLElement>('[data-project]'))card.dataset.related=String(card.dataset.technologies?.split(' ').includes(entry.id)??false);
  this.root.querySelector('[data-tech-status]')!.textContent=entry.name+'. '+entry.category+'. '+(entry.projects.length?entry.projects.length+' related featured projects.':'No featured project is tagged with this technology yet.');
 }
 private focusIfAppropriate(element:HTMLElement):void{
  if(document.hidden||Math.abs(scrollY-this.transitionScrollY)>64)return;
  const active=document.activeElement;
  if(active&&active!==document.body&&!this.root.contains(active))return;
  element.focus({preventScroll:true});
  const r=element.getBoundingClientRect();
  if(r.top<100||r.top>innerHeight-80)element.scrollIntoView({block:'nearest',behavior:'instant'});
 }
 private commitFocus(moveFocus:boolean):void{
  if(this.deferPresentation(()=>this.commitFocus(moveFocus)))return;
  this.cancel();this.wantsFocus=true;this.overview.hidden=true;this.overview.inert=true;this.focus.hidden=false;this.focus.inert=false;this.setView('focus');this.placeDock('focus');
  if(moveFocus)this.focusIfAppropriate(this.focus);
 }
 private commitOverview(restore:boolean):void{
  if(this.deferPresentation(()=>this.commitOverview(restore)))return;
  this.cancel();this.wantsFocus=false;this.overview.hidden=false;this.overview.inert=false;this.focus.hidden=true;this.focus.inert=true;this.setView('overview');this.placeDock('overview');
  if(restore){
   const button=this.buttons.find(item=>item.dataset.technology===this.selected.id);
   if(button&&!document.hidden&&Math.abs(scrollY-this.transitionScrollY)<64){button.focus({preventScroll:true});const r=button.getBoundingClientRect();if(r.top<100||r.bottom>innerHeight-10)button.scrollIntoView({block:'nearest',behavior:'instant'});}
  }
 }
 private frame(node:HTMLElement,target:Rect,base:Rect):void{
  node.style.left=target.left-base.left+'px';node.style.top=target.top-base.top+'px';node.style.width=target.width+'px';node.style.height=target.height+'px';
 }
 private flip(from:Rect,to:Rect,uniform=false):string{
  const x=from.left-to.left,y=from.top-to.top,sx=from.width/Math.max(1,to.width),sy=from.height/Math.max(1,to.height);
  return 'translate('+x+'px, '+y+'px) scale('+sx+', '+(uniform?sx:sy)+')';
 }
 private zoomBetween(from:Rect,to:Rect,logoFrom:Rect,logoTo:Rect,finished:()=>void):void{
  const key=this.epoch,base=this.views.getBoundingClientRect();
  const plane=document.createElement('div');plane.className='toolkit-zoom-plane';plane.setAttribute('data-tech-zoom-plane','');this.frame(plane,to,base);
  const logo=document.createElement('span');logo.className='toolkit-zoom-logo';this.asset(logo,this.selected);this.frame(logo,logoTo,base);
  this.zoom.append(plane,logo);
  const light=motionPolicy(preferences(false)).tier==='light';
  const duration=light?240:540,options={duration,easing:'cubic-bezier(.22,.72,.24,1)',fill:'both' as FillMode};
  const background=plane.animate([{transform:light?'translateY(12px) scale(.98)':this.flip(from,to),opacity:.76},{transform:'translate(0px, 0px) scale(1, 1)',opacity:1}],options);
  const brand=logo.animate([{transform:light?'translateY(8px) scale(.92)':this.flip(logoFrom,logoTo,true)},{transform:'translate(0px, 0px) scale(1, 1)'}],options);
  this.track(background);this.track(brand);
  void Promise.all([background.finished,brand.finished]).then(()=>{if(key===this.epoch&&!this.destroyed)finished();}).catch(()=>{});
 }
 private select(id:string,animate=true,moveFocus=true,requestScroll=scrollY):void{
  const entry=this.entries.find(item=>item.id===id);if(!entry)return;
  if(this.deferPresentation(()=>this.select(id,animate,moveFocus,requestScroll),true))return;
  this.transitionScrollY=requestScroll;
  const focused=this.view==='focus';
  const button=this.buttons.find(item=>item.dataset.technology===id)!;
  const category=button.closest<HTMLElement>('[data-tech-category]')!;
  const origin=category.getBoundingClientRect(),logoOrigin=button.querySelector<HTMLElement>('[data-tech-logo]')!.getBoundingClientRect();
  this.cancel();this.selected=entry;this.hasSelection=true;this.wantsFocus=true;this.populate();this.markSelection();
  if(focused){
   this.setView('focus');this.focus.hidden=false;this.focus.inert=false;this.placeDock('focus');
   if(animate&&this.allowed()){const body=this.root.querySelector<HTMLElement>('[data-tech-focus-body]')!;this.track(body.animate([{opacity:.72,transform:'translateY(6px)'},{opacity:1,transform:'translateY(0)'}],{duration:180,easing:'ease-out'}));}
   return;
  }
  this.overview.hidden=false;this.overview.inert=true;this.focus.hidden=false;this.focus.inert=true;this.setView('opening');
  if(!animate||!this.allowed()||typeof this.views.animate!=='function'||!origin.width){this.commitFocus(moveFocus);return;}
  const destination=this.focus.getBoundingClientRect(),logoDestination=this.root.querySelector<HTMLElement>('[data-tech-focus-logo]')!.getBoundingClientRect();
  this.zoomBetween(origin,destination,logoOrigin,logoDestination,()=>this.commitFocus(moveFocus));
 }
 private returnToOverview(animate=true,restore=true,requestScroll=scrollY):void{
  if(this.deferPresentation(()=>this.returnToOverview(animate,restore,requestScroll),true))return;
  this.transitionScrollY=requestScroll;
  if(this.view==='overview'){if(restore)this.commitOverview(true);return;}
  if(this.view!=='focus'||!animate||!this.allowed()){this.commitOverview(restore);return;}
  const origin=this.focus.getBoundingClientRect(),logoOrigin=this.root.querySelector<HTMLElement>('[data-tech-focus-logo]')!.getBoundingClientRect();
  this.cancel();this.wantsFocus=false;this.overview.hidden=false;this.overview.inert=true;this.focus.inert=true;this.setView('closing');
  const button=this.buttons.find(item=>item.dataset.technology===this.selected.id)!;
  const destination=button.closest<HTMLElement>('[data-tech-category]')!.getBoundingClientRect(),logoDestination=button.querySelector<HTMLElement>('[data-tech-logo]')!.getBoundingClientRect();
  this.zoomBetween(origin,destination,logoOrigin,logoDestination,()=>this.commitOverview(restore));
 }
 private settle():void{
  if(this.view==='opening')this.commitFocus(false);
  else if(this.view==='closing')this.commitOverview(false);
  else this.cancel();
 }
 private bind():void{
  const signal=this.events.signal;
  this.root.addEventListener('click',event=>{
   const trigger=event.target instanceof Element?event.target.closest<HTMLButtonElement>('button[data-technology],[data-tech-back]'):null;
   if(!trigger)return;
   if(trigger.hasAttribute('data-tech-back'))this.returnToOverview();else if(trigger.dataset.technology)this.select(trigger.dataset.technology);
  },{signal});
  this.switcher.addEventListener('change',()=>this.select(this.switcher.value,true,false),{signal});
  document.addEventListener('keydown',event=>{
   const active=document.activeElement;
   const within=this.root.contains(active);
   const openingHere=(this.view==='opening'||this.view==='closing')&&active===document.body&&Math.abs(scrollY-this.transitionScrollY)<64;
   if(!within&&!openingHere)return;
   if(event.key!=='Escape'||event.defaultPrevented||this.view==='overview'||this.busyMascot())return;
   event.preventDefault();this.returnToOverview();
  },{signal});
  this.root.addEventListener('error',event=>{
   if(!(event.target instanceof HTMLImageElement)||!event.target.hasAttribute('data-tech-image'))return;
   event.target.hidden=true;const fallback=event.target.closest('[data-tech-logo]')?.querySelector<HTMLElement>('[data-tech-icon-fallback]');if(fallback)fallback.hidden=false;
  },{signal,capture:true});
  for(const image of this.root.querySelectorAll<HTMLImageElement>('img[data-tech-image]'))if(image.complete&&!image.naturalWidth){image.hidden=true;image.closest('[data-tech-logo]')?.querySelector<HTMLElement>('[data-tech-icon-fallback]')?.removeAttribute('hidden');}
  const policy=():void=>{if(!this.allowed())this.settle();};
  document.addEventListener('visibilitychange',policy,{signal});matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',policy,{signal});
  const pause=document.querySelector('[data-fresh-pause]'),observer=new MutationObserver(policy);
  if(pause)observer.observe(pause,{attributes:true,attributeFilter:['aria-pressed']});this.observers.push(observer);
  const companion=this.companion();
  if(companion){
   const state=new MutationObserver(()=>{
    if(this.busyMascot())return;
    const action=this.pendingPresentation;this.pendingPresentation=undefined;action?.();
    if(this.pendingDock)this.placeDock(this.desiredAnchor);
   });
   state.observe(companion,{attributes:true,attributeFilter:['data-state','data-current-section']});this.observers.push(state);
  }
  window.addEventListener('resize',()=>{this.settle();if(!this.busyMascot())this.placeDock(this.desiredAnchor);},{signal,passive:true});
  window.addEventListener('hashchange',()=>{if(location.hash.startsWith('#technology-'))this.select(location.hash.slice(12),false);},{signal});
  window.addEventListener('pagehide',()=>this.destroy(),{signal});document.addEventListener('astro:before-swap',()=>this.destroy(),{signal});
 }
 destroy():void{
  if(this.destroyed)return;this.destroyed=true;this.pendingPresentation=undefined;this.cancel();this.events.abort();for(const observer of this.observers)observer.disconnect();
  this.root.dataset.galleryView=this.wantsFocus?'focus':'overview';delete this.root.dataset.galleryEnhanced;
  this.overview.hidden=false;this.overview.inert=false;this.focus.hidden=true;this.focus.inert=false;
  this.buttons.forEach(button=>button.disabled=true);this.root.querySelector<HTMLElement>('[data-tech-static]')!.hidden=false;
  this.views.style.removeProperty('min-height');if(!this.busyMascot())this.placeDock('overview');
 }
}
export function initTechnologies():void{
 current?.destroy();current=undefined;
 const root=document.querySelector<HTMLElement>('[data-tech-gallery]');
 if(root)try{current=new TechnologyGallery(root);}catch(error){if(import.meta.env.DEV)console.error('Technology gallery unavailable; static toolkit restored.',error);}
}
