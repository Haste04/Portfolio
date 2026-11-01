import { orbitPoint, orbitProfile, type OrbitProfile, wrapIndex, nearestTurn, isHorizontalSwipe } from './project-orbit-layout';
import { motionPolicy, preferences } from './motion/policy';

let current:ProjectOrbit|undefined;
/** One selection state. Native animations own icon poses and details; GSAP and mascot stay isolated. */
class ProjectOrbit {
 private root:HTMLElement; private surface:HTMLElement; private camera:HTMLElement;
 private profile:OrbitProfile=orbitProfile(1366,'balanced');
 private items:HTMLButtonElement[]; private positions:HTMLElement[]; private captions:HTMLElement[]; private panels:HTMLElement[];
 private events=new AbortController(); private resize:ResizeObserver|undefined; private observers:MutationObserver[]=[];
 private selected=0; private turn=0; private fromTurn=0; private epoch=0;
 private animations=new Set<Animation>(); private rotation:Animation|undefined;
 private width=0; private height=0; private itemWidth=0; private itemHeight=0;
 private pointer:{id:number;x:number;y:number}|undefined; private hashFrame:number|undefined;
 constructor(root:HTMLElement){
  this.root=root;this.surface=root.querySelector<HTMLElement>('[data-orbit-surface]')!;
  this.camera=root.querySelector<HTMLElement>('[data-orbit-camera]')!;
  this.items=[...root.querySelectorAll<HTMLButtonElement>('[data-orbit-item]')];
  this.positions=[...root.querySelectorAll<HTMLElement>('[data-orbit-position]')];
  this.captions=[...root.querySelectorAll<HTMLElement>('.orbit-item-name')];
  this.panels=[...root.querySelectorAll<HTMLElement>('[data-project]')];
  if(!this.surface||!this.camera||this.positions.length!==this.items.length||this.captions.length!==this.items.length||this.items.length!==this.panels.length||!this.items.length)throw Error('Incomplete project orbit');
  const saved=root.dataset.selectedProject;
  const initial=this.panels.findIndex(p=>p.dataset.project===saved||(!saved&&p.id===location.hash.slice(1)));
  this.selected=initial<0?0:initial;this.turn=this.selected;this.fromTurn=this.turn;
  try{
  for(const control of root.querySelectorAll<HTMLElement>('[data-orbit-controls]'))control.hidden=false;
  this.bind();root.dataset.orbitEnhanced='';this.render();this.syncItems();
  this.resize=new ResizeObserver(()=>this.measure());this.resize.observe(this.surface);this.measure();
  if(!saved&&location.hash.startsWith('#project-'))this.hashFrame=requestAnimationFrame(()=>{this.hashFrame=undefined;this.panels[this.selected]?.scrollIntoView({block:'start',behavior:'instant'});});
  }catch(error){this.destroy();throw error;}
 }
 private policy(){return motionPolicy(preferences(document.querySelector('[data-fresh-pause]')?.getAttribute('aria-pressed')==='true'));}
 private allowed():boolean{return this.policy().mode==='active';}
 private measure():void{
  if(this.events.signal.aborted)return;
  const r=this.surface.getBoundingClientRect();
  // Logical dimensions must not feed perspective/scale back into the next layout.
  const sizes=this.items.map(n=>({width:n.offsetWidth,height:n.offsetHeight}));
  const hints=preferences(false);
  // Static depth stays stable when motion is paused; allowed() still respects every motion preference.
  const tier=motionPolicy({...hints,reduced:false,paused:false,hidden:false}).tier;
  const profile=orbitProfile(innerWidth,tier);
  const width=Math.max(...sizes.map(n=>n.width)),height=Math.max(...sizes.map(n=>n.height));
  if(Math.abs(r.width-this.width)<.5&&Math.abs(r.height-this.height)<.5&&Math.abs(width-this.itemWidth)<.5&&Math.abs(height-this.itemHeight)<.5&&profile.depth===this.profile.depth&&profile.perspective===this.profile.perspective)return;
  this.width=r.width;this.height=r.height;this.itemWidth=width;this.itemHeight=height;this.profile=profile;
  this.camera.style.perspective=profile.depth?profile.perspective+'px':'none';
  this.root.dataset.orbitMode=profile.depth?'spatial':'compact';this.settle();
 }
 private pose(index:number,turn:number):{transform:string;opacity:number;zIndex:string;captionTransform:string}{
  const p=orbitPoint(index,turn,this.items.length,this.width,this.height,this.itemWidth,this.itemHeight,this.profile);
  return {transform:'translate(-50%, -50%) translate3d('+p.x.toFixed(3)+'px, '+p.y.toFixed(3)+'px, '+p.z.toFixed(3)+'px) scale('+p.scale.toFixed(5)+')',opacity:p.opacity,zIndex:String(p.layer),captionTransform:'scale('+p.captionScale.toFixed(5)+')'};
 }
 private place():void{this.positions.forEach((node,index)=>{const p=this.pose(index,this.turn);node.style.transform=p.transform;node.style.opacity=String(p.opacity);node.style.zIndex=p.zIndex;this.captions[index]!.style.transform=p.captionTransform;});}
 private visualTurn():number{
  const progress=this.rotation?.effect?.getComputedTiming().progress;
  return typeof progress==='number'?this.fromTurn+(this.turn-this.fromTurn)*progress:this.turn;
 }
 private cancel():void{
  this.epoch++;for(const animation of this.animations)animation.cancel();this.animations.clear();this.rotation=undefined;
 }
 private track(animation:Animation):Animation{
  this.animations.add(animation);this.root.dataset.orbitMoving='true';
  const finished=():void=>{
   this.animations.delete(animation);
   queueMicrotask(()=>{if(!this.events.signal.aborted&&!this.animations.size)this.root.dataset.orbitMoving='false';});
  };
  void animation.finished.then(finished).catch(finished);return animation;
 }
 private settle():void{
  this.cancel();this.fromTurn=this.turn;this.place();this.render();this.root.dataset.orbitMoving='false';
 }
 private syncItems():void{
  this.items.forEach((item,index)=>{
   item.setAttribute('aria-pressed',String(index===this.selected));
   const related=this.panels[index]?.dataset.related;
   if(related)item.dataset.related=related;else delete item.dataset.related;
  });
  const panel=this.panels[this.selected]!;
  this.root.dataset.selectedProject=panel.dataset.project!;
  const indicator=this.root.querySelector<HTMLElement>('[data-orbit-indicator]');
  if(indicator)indicator.textContent=String(this.selected+1).padStart(2,'0')+' / '+String(this.items.length).padStart(2,'0');
 }
 private render():void{
  this.panels.forEach((panel,index)=>{
   const inactive=index!==this.selected;panel.inert=inactive;panel.classList.toggle('is-inactive',inactive);
   panel.setAttribute('aria-hidden',String(inactive));
  });
 }
 private select(index:number,animate=true,announce=true):void{
  index=wrapIndex(index,this.items.length);
  if(index===this.selected){if(!animate)this.settle();return;}
  const from=this.visualTurn(),previous=this.panels.find(p=>!p.classList.contains('is-inactive'));
  this.cancel();this.selected=index;this.turn=nearestTurn(index,from,this.items.length);this.fromTurn=from;
  const key=this.epoch;this.syncItems();this.place();
  const status=this.root.querySelector<HTMLElement>('[data-orbit-status]');
  if(announce&&status)status.textContent=String(index+1).padStart(2,'0')+' of 04. '+this.items[index]!.textContent?.trim().replace(/\s+/g,' ');
  if(!animate||!this.allowed()||typeof this.surface.animate!=='function'){this.render();this.root.dataset.orbitMoving='false';return;}
  const policy=this.policy(),duration=policy.tier==='light'?620:820,steps=policy.tier==='light'?16:40;
  this.root.dataset.orbitMoving='true';
  const rotations=this.positions.map((node,item)=>{
   const keyframes=Array.from({length:steps+1},(_,step)=>(this.pose(item,from+(this.turn-from)*step/steps)));
   const options={duration,easing:'cubic-bezier(.22,.72,.24,1)'};
   const animation=node.animate(keyframes.map(({captionTransform,...frame})=>frame),options);
   this.track(this.captions[item]!.animate(keyframes.map(frame=>({transform:frame.captionTransform})),options));
   this.track(animation);return animation;
  });
  this.rotation=rotations[0];
  const enter=():void=>{
   if(key!==this.epoch)return;this.render();
   const animation=this.panels[this.selected]!.animate([{opacity:.72,transform:'translateX(9px)'},{opacity:1,transform:'translateX(0)'}],{duration:180,easing:'ease-out'});
   this.track(animation);
  };
  if(previous&&previous!==this.panels[index]){
   const exit=previous.animate([{opacity:1},{opacity:.72}],{duration:100,easing:'ease-out'});this.track(exit);
   void exit.finished.then(enter).catch(()=>{});
  }else enter();
  void Promise.all(rotations.map(a=>a.finished)).then(()=>{
   if(key!==this.epoch)return;this.rotation=undefined;
  }).catch(()=>{});
 }
 private fragment():void{
  const index=this.panels.findIndex(p=>p.id===location.hash.slice(1));if(index<0)return;
  this.select(index,false);this.panels[index]!.focus({preventScroll:true});
 }
 private bind():void{
  const signal=this.events.signal;
  this.root.addEventListener('click',event=>{
   const target=event.target instanceof Element?event.target.closest<HTMLElement>('[data-orbit-item],[data-orbit-prev],[data-orbit-next]'):null;
   if(!target)return;
   const item=this.items.indexOf(target as HTMLButtonElement);
   this.select(item>=0?item:this.selected+(target.hasAttribute('data-orbit-next')?1:-1));
  },{signal});
  this.root.addEventListener('keydown',event=>{
   if(!(event.target instanceof Element)||event.target.closest('[data-fresh-dock]')||!event.target.closest('[data-orbit-item],.orbit-navigation'))return;
   const index=event.key==='ArrowRight'?this.selected+1:event.key==='ArrowLeft'?this.selected-1:event.key==='Home'?0:event.key==='End'?this.items.length-1:null;
   if(index===null)return;event.preventDefault();this.select(index);this.items[this.selected]!.focus({preventScroll:true});
  },{signal});
  this.surface.addEventListener('pointerdown',event=>{
   if(!event.isPrimary||event.button!==0||(event.target instanceof Element&&event.target.closest('button,a,summary,[data-fresh-dock]')))return;
   this.pointer={id:event.pointerId,x:event.clientX,y:event.clientY};this.surface.setPointerCapture(event.pointerId);
  },{signal});
  this.surface.addEventListener('pointerup',event=>{
   const start=this.pointer;if(!start||start.id!==event.pointerId)return;
   this.pointer=undefined;if(this.surface.hasPointerCapture(event.pointerId))this.surface.releasePointerCapture(event.pointerId);
   const dx=event.clientX-start.x,dy=event.clientY-start.y;
   if(isHorizontalSwipe(dx,dy))this.select(this.selected+(dx<0?1:-1));
  },{signal});
  this.surface.addEventListener('pointercancel',()=>{this.pointer=undefined;},{signal});
  this.surface.addEventListener('lostpointercapture',()=>{this.pointer=undefined;},{signal});
  document.addEventListener('click',event=>{
   if(event.button!==0||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey)return;
   const anchor=event.target instanceof Element?event.target.closest<HTMLAnchorElement>('a[href^="#project-"]'):null;
   const index=anchor?this.panels.findIndex(panel=>'#'+panel.id===anchor.getAttribute('href')):-1;
   if(index>=0)this.select(index,false);
  },{signal});
  window.addEventListener('hashchange',()=>this.fragment(),{signal});
  window.addEventListener('resize',()=>this.measure(),{signal,passive:true});
  const update=():void=>{if(!this.allowed())this.settle();};
  document.addEventListener('visibilitychange',update,{signal});
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',update,{signal});
  const policy=new MutationObserver(update);
  const pause=document.querySelector('[data-fresh-pause]');
  if(pause)policy.observe(pause,{attributes:true,attributeFilter:['aria-pressed']});
  this.observers.push(policy);
  const relationships=new MutationObserver(()=>this.syncItems());
  for(const panel of this.panels)relationships.observe(panel,{attributes:true,attributeFilter:['data-related']});
  this.observers.push(relationships);
  window.addEventListener('pagehide',()=>this.destroy(),{signal});
  document.addEventListener('astro:before-swap',()=>this.destroy(),{signal});
 }
 destroy():void{
  this.cancel();this.events.abort();this.resize?.disconnect();for(const observer of this.observers)observer.disconnect();
  if(this.hashFrame!==undefined)cancelAnimationFrame(this.hashFrame);
  this.pointer=undefined;this.root.dataset.orbitMoving='false';delete this.root.dataset.orbitEnhanced;delete this.root.dataset.orbitMode;this.camera?.style.removeProperty('perspective');
  for(const panel of this.panels){panel.inert=false;panel.classList.remove('is-inactive');panel.removeAttribute('aria-hidden');}
  for(const control of this.root.querySelectorAll<HTMLElement>('[data-orbit-controls]'))control.hidden=true;
 }
}
export function initProjectOrbit():void{
 current?.destroy();const root=document.querySelector<HTMLElement>('[data-project-orbit]');
 current=undefined;
 if(root)try{current=new ProjectOrbit(root)}catch(error){if(import.meta.env.DEV)console.error('Project orbit initialization failed; native project content restored.',error);}
}
