/** One-shot entrances on static outer containers. Functional transforms remain inside. */
const seen=new WeakSet<HTMLElement>();
let disposeCurrent:(()=>void)|undefined;

export function initComponentReveals():void{
 disposeCurrent?.();disposeCurrent=undefined;
 const targets=[...document.querySelectorAll<HTMLElement>('#home [data-component-reveal],#education [data-component-reveal],#projects [data-component-reveal],#tech-stack [data-component-reveal],#experience [data-component-reveal]')];
 if(!targets.length||typeof IntersectionObserver!=='function')return;
 const eligible=new Set(targets),order=new Map<Element,number>(targets.map((node,index)=>[node,index]));
 const active=new Map<HTMLElement,Animation>(),lastStart=new Map<string,number>(),events=new AbortController();
 const held=new Map<number,HTMLElement>(),resumeFrames=new Map<HTMLElement,number>();
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),button=document.querySelector('[data-fresh-pause]'),mascot=document.querySelector<HTMLElement>('#fresh-companion');
 let observer:IntersectionObserver|undefined,policyObserver:MutationObserver|undefined,destroyed=false;
 function paused():boolean{
  if(mascot?.dataset.ready==='true')return button?.getAttribute('aria-pressed')==='true';
  try{return localStorage.getItem('fresh-paused')==='true'}catch{return button?.getAttribute('aria-pressed')==='true'}
 }
 const disabled=()=>reduced.matches||paused()||document.hidden||document.documentElement.hasAttribute('data-theme-revealing');
 function settle(node:HTMLElement):void{
  const frame=resumeFrames.get(node);if(frame!==undefined){cancelAnimationFrame(frame);resumeFrames.delete(node)}
  for(const [pointer,owner]of held)if(owner===node)held.delete(pointer);
  const animation=active.get(node);if(animation){active.delete(node);animation.cancel()}
 }
 function settleAll():void{for(const node of active.keys())settle(node)}
 function consume(node:HTMLElement):void{seen.add(node);observer?.unobserve(node)}
 function reveal(node:HTMLElement):void{
  if(destroyed||seen.has(node))return;
  consume(node);
  if(disabled()||typeof node.animate!=='function')return;
  const group=node.dataset.componentReveal!.split(':')[0]!,now=performance.now(),start=Math.max(now,(lastStart.get(group)??-Infinity)+150);
  lastStart.set(group,start);
  try{
   const animation=node.animate([{opacity:0,transform:'translateY(40px)'},{opacity:1,transform:'translateY(0px)'}],{duration:850,delay:start-now,easing:'cubic-bezier(.22,.68,.25,1)',fill:'backwards'});
   animation.id='component-reveal:'+node.dataset.componentReveal;active.set(node,animation);
   void animation.finished.then(()=>settle(node),()=>settle(node));
  }catch{/* Default styles are already fully visible when native animation is unavailable. */}
 }
 const policyChanged=()=>{if(disabled())settleAll()};
 const targetFor=(event:Event)=>event.target instanceof Element?event.target.closest<HTMLElement>('[data-component-reveal]'):null;
 const interaction=(event:Event)=>{
  const node=targetFor(event);if(!node||!eligible.has(node))return;
  if(!seen.has(node))consume(node);
  if([...held.values()].includes(node)||resumeFrames.has(node))return;
  settle(node);
 };
 function press(event:PointerEvent):void{
  const node=targetFor(event);if(!node||!eligible.has(node))return;
  if(!seen.has(node))consume(node);
  const animation=active.get(node);if(!animation)return;
  const frame=resumeFrames.get(node);if(frame!==undefined){cancelAnimationFrame(frame);resumeFrames.delete(node)}
  const time=animation.currentTime;animation.pause();if(time!==null)animation.currentTime=time;
  held.set(event.pointerId,node);
 }
 function release(event:PointerEvent):void{
  const node=held.get(event.pointerId);if(!node)return;held.delete(event.pointerId);
  if([...held.values()].includes(node)||resumeFrames.has(node))return;
  // Keep the hitbox fixed through native mouse-up/click dispatch and functional geometry reads.
  resumeFrames.set(node,requestAnimationFrame(()=>{
   resumeFrames.delete(node);if(destroyed)return;
   if(disabled())settle(node);else if(![...held.values()].includes(node))active.get(node)?.play();
  }));
 }
 const restore=()=>initComponentReveals();
 function dispose():void{
  if(destroyed)return;destroyed=true;settleAll();observer?.disconnect();policyObserver?.disconnect();events.abort();
 }
 disposeCurrent=()=>{dispose();window.removeEventListener('pageshow',restore)};
 try{
  observer=new IntersectionObserver(entries=>{
   if(destroyed)return;
   for(const entry of entries.sort((a,b)=>order.get(a.target)!-order.get(b.target)!)){
    const node=entry.target as HTMLElement;
    if(entry.isIntersecting)reveal(node);
    else if(entry.boundingClientRect.height>0&&entry.boundingClientRect.bottom<=0&&!seen.has(node))consume(node);
   }
  },{threshold:0,rootMargin:'0px 0px 64px 0px'});
  policyObserver=new MutationObserver(policyChanged);
  policyObserver.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme-revealing']});
  if(button)policyObserver.observe(button,{attributes:true,attributeFilter:['aria-pressed']});
  const signal=events.signal;
  document.addEventListener('visibilitychange',policyChanged,{signal});reduced.addEventListener('change',policyChanged,{signal});
  document.addEventListener('pointerdown',press,{capture:true,passive:true,signal});
  window.addEventListener('pointerup',release,{capture:true,signal});window.addEventListener('pointercancel',release,{capture:true,signal});
  window.addEventListener('blur',settleAll,{signal});
  document.addEventListener('focusin',interaction,{capture:true,signal});document.addEventListener('click',interaction,{capture:true,signal});
  window.addEventListener('pagehide',event=>{dispose();if(event.persisted)window.addEventListener('pageshow',restore,{once:true})},{signal});
  document.addEventListener('astro:before-swap',()=>disposeCurrent?.(),{once:true,signal});
  const homeStart=scrollY<innerHeight*.5&&['','#home','#home-heading','#main-content'].includes(location.hash);
  for(const node of targets){
   if(seen.has(node))continue;
   if(node.dataset.componentReveal!.startsWith('home:')){if(homeStart)reveal(node);else consume(node);continue}
   const box=node.getBoundingClientRect();
   if(box.height>0&&box.bottom<=0)consume(node);else observer.observe(node);
  }
 }catch{dispose();for(const node of targets)seen.add(node)}
}
