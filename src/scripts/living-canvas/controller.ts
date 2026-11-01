import {motionPolicy,preferences} from '../motion/policy';
import {influence,ringDistance,segmentDistance} from './proximity';

type Target={node:HTMLElement|SVGElement;kind:string;x:number;y:number;rx:number;ry:number;points:[number,number][]};
type Stage={root:HTMLElement;section:HTMLElement;visible:boolean;running:boolean;targets:Target[];x:number;y:number;width:number;height:number};
let dispose:(()=>void)|undefined;

/** One controller; input-driven RAF batches only. CSS owns idle and spring-back. */
export function initLivingCanvas():void{
 dispose?.();
 const abort=new AbortController(),signal=abort.signal;
 const roots=[...document.querySelectorAll<HTMLElement>('[data-living-canvas]')];
 if(!roots.length)return;
 const stages:Stage[]=roots.map(root=>({root,section:root.closest<HTMLElement>('[data-section]')!,visible:false,running:false,targets:[],x:0,y:0,width:0,height:0}));
 const reduced=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(any-pointer: fine)');
 let pointer:{x:number;y:number}|null=null,frame=0,measureFrame=0,burst:Animation|undefined,lastRipple=-Infinity,destroyed=false;
 const suspended=new Map<Stage,Set<Animation>>();
 const pause=()=>document.querySelector('[data-fresh-pause]')?.getAttribute('aria-pressed')==='true';
 function reset(stage:Stage){for(const t of stage.targets){t.node.style.setProperty('--near','0');t.node.style.setProperty('--living-dx','0px');t.node.style.setProperty('--living-dy','0px')}}
 function sync(){
  const policy=motionPolicy(preferences(pause()));
  const frozen=policy.mode!=='active'||document.documentElement.hasAttribute('data-theme-revealing');
  for(const s of stages){
   s.running=s.visible&&!frozen;s.root.dataset.running=String(s.running);if(policy.tier!=='off')s.root.dataset.tier=policy.tier;
   s.root.dataset.visible=String(s.visible);s.section.dataset.livingVisible=String(s.visible);
   if(!s.visible)reset(s);
   if(!s.running&&s.root.dataset.livingCanvas==='contact'){burst?.cancel();burst=undefined;}
   s.section.dataset.livingRunning=String(s.running);
   // CSS animation clocks obey play-state. CSS transitions need explicit suspension.
   if(!s.running){
    const animations=new Set<Animation>(suspended.get(s)??[]);
    const owned=[...s.root.getAnimations({subtree:true}),...s.targets.filter(t=>t.kind==='ring').flatMap(t=>t.node.getAnimations({subtree:true}))];
    for(const animation of owned)if(animation instanceof CSSTransition&&animation.playState==='running'){animation.pause();animations.add(animation)}
    suspended.set(s,animations);
   }else{
    for(const animation of suspended.get(s)??[])if(animation.playState==='paused')animation.play();
    suspended.delete(s);
   }
  }
  if(frozen){pointer=null;if(frame)cancelAnimationFrame(frame);frame=0;burst?.cancel();burst=undefined;}
  else schedule(); // Reconcile pointer movement/exit accumulated during suspension, once.
 }
 function measure(){
  measureFrame=0;
  for(const s of stages){
   const r=s.section.getBoundingClientRect();s.x=r.left+scrollX;s.y=r.top+scrollY;s.width=r.width;s.height=r.height;
   s.targets=[...s.section.querySelectorAll<HTMLElement|SVGElement>('[data-living-ring],[data-living-target]')].map(node=>{
    const b=node.getBoundingClientRect();const kind=node.getAttribute('data-living-ring')!==null?'ring':node.getAttribute('data-living-target')!;
    const target:Target={node,kind,x:b.left+scrollX-s.x+b.width/2,y:b.top+scrollY-s.y+b.height/2,rx:b.width/2,ry:b.height/2,points:[]};
    // Account for our own response offsets when recaching layout after a resize.
    let shiftX=0,shiftY=0;
    for(let parent:Element|null=node;parent&&parent!==s.section;parent=parent.parentElement){
     if(parent.hasAttribute('data-living-target')||parent.hasAttribute('data-living-ring')){
      const xy=getComputedStyle(parent).translate.split(' ');shiftX+=parseFloat(xy[0]??'0')||0;shiftY+=parseFloat(xy[1]??'0')||0;
     }
    }
    target.x-=shiftX;target.y-=shiftY;
    if(kind==='ring'&&node instanceof HTMLElement){
     const matrix=new DOMMatrix(getComputedStyle(node).transform);
     for(let i=0;i<=64;i++){
      const angle=i*Math.PI/32,point=new DOMPoint(node.offsetWidth/2*Math.cos(angle),node.offsetHeight/2*Math.sin(angle)).matrixTransform(matrix);
      target.points.push([target.x+point.x,target.y+point.y]);
     }
    }
    if(node instanceof SVGGeometryElement&&kind==='path'){
     const matrix=node.getScreenCTM(),length=node.getTotalLength();
     if(matrix)for(let i=0;i<=16;i++){const p=node.getPointAtLength(length*i/16),q=new DOMPoint(p.x,p.y).matrixTransform(matrix);target.points.push([q.x+scrollX-s.x-shiftX,q.y+scrollY-s.y-shiftY])}
    }
    return target;
   });
  }
 }
 const scheduleMeasure=()=>{if(!measureFrame&&!destroyed)measureFrame=requestAnimationFrame(measure)};
 function update(){
  frame=0;if(destroyed)return;
  for(const s of stages){
   if(!s.running)continue;
   const x=pointer?pointer.x+scrollX-s.x:-10000,y=pointer?pointer.y+scrollY-s.y:-10000;
   const inside=x>=0&&y>=0&&x<=s.width&&y<=s.height;
   for(const t of s.targets){
    let distance=Math.hypot(x-t.x,y-t.y);
    if(t.kind==='ring')distance=ringDistance(x,y,t.x,t.y,t.rx,t.ry);
    if(t.points.length>1){distance=Infinity;for(let i=1;i<t.points.length;i++){const a=t.points[i-1]!,b=t.points[i]!;distance=Math.min(distance,segmentDistance(x,y,a[0],a[1],b[0],b[1]))}}
    const near=inside?influence(distance,t.kind==='glow'?Math.max(s.width,s.height):200):0;
    t.node.style.setProperty('--near',near.toFixed(3));
    const travel=t.kind==='ring'?18:t.kind==='glow'?80:4;
    t.node.style.setProperty('--living-dx',(near*Math.max(-1,Math.min(1,(x-t.x)/200))*travel).toFixed(2)+'px');
    t.node.style.setProperty('--living-dy',(near*Math.max(-1,Math.min(1,(y-t.y)/200))*travel).toFixed(2)+'px');
   }
   if(s.root.dataset.livingCanvas==='contact'&&inside&&performance.now()-lastRipple>1800){
    const node=s.root.querySelector<SVGElement>('[data-living-burst]');
    const cx=s.width*.5,cy=s.height*.56;
    if(node&&Math.hypot(x-cx,y-cy)<220){
     lastRipple=performance.now();burst?.cancel();
     burst=node.animate([{opacity:.38,transform:'scale(.55)'},{opacity:0,transform:'scale(1.65)'}],{duration:1200,easing:'cubic-bezier(.2,.65,.3,1)'});
     burst.finished.catch(()=>{}).finally(()=>{if(burst?.playState==='finished')burst=undefined});
    }
   }
  }
 }
 const schedule=()=>{if(!frame&&stages.some(s=>s.running))frame=requestAnimationFrame(update)};
 const observer=new IntersectionObserver(entries=>{for(const e of entries){const s=stages.find(s=>s.section===e.target);if(s)s.visible=e.isIntersecting}sync()},{threshold:0});
 stages.forEach(s=>observer.observe(s.section));
 const resize=new ResizeObserver(scheduleMeasure);stages.forEach(s=>resize.observe(s.section));
 const mutation=new MutationObserver(sync);mutation.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme-revealing']});
 const pauseButton=document.querySelector('[data-fresh-pause]');if(pauseButton)mutation.observe(pauseButton,{attributes:true,attributeFilter:['aria-pressed']});
 document.addEventListener('pointermove',e=>{if(e.pointerType==='touch'){pointer=null;schedule();return}if(!fine.matches)return;pointer={x:e.clientX,y:e.clientY};schedule()},{passive:true,signal});
 document.addEventListener('pointerout',e=>{if(!e.relatedTarget){pointer=null;schedule()}},{passive:true,signal});
 document.addEventListener('visibilitychange',sync,{signal});
 window.addEventListener('resize',()=>{scheduleMeasure();sync()},{passive:true,signal});
 reduced.addEventListener('change',sync,{signal});fine.addEventListener('change',()=>{pointer=null;sync();schedule()},{signal});
 measure();sync();
 dispose=()=>{
  if(destroyed)return;destroyed=true;abort.abort();observer.disconnect();resize.disconnect();mutation.disconnect();
  cancelAnimationFrame(frame);cancelAnimationFrame(measureFrame);burst?.cancel();
  for(const animations of suspended.values())for(const animation of animations)animation.cancel();suspended.clear();
  for(const s of stages){s.root.dataset.running='false';s.root.dataset.visible='false';s.section.dataset.livingRunning='false';s.section.dataset.livingVisible='false';reset(s);for(const animation of s.root.getAnimations({subtree:true}))if(animation instanceof CSSTransition)animation.cancel();for(const t of s.targets.filter(t=>t.kind==='ring'))for(const animation of t.node.getAnimations({subtree:true}))if(animation instanceof CSSTransition)animation.cancel()}
 };
 window.addEventListener('pagehide',()=>dispose?.(),{once:true,signal});
 document.addEventListener('astro:before-swap',()=>dispose?.(),{once:true,signal});
}
window.addEventListener('pageshow',e=>{if(e.persisted)initLivingCanvas()});
