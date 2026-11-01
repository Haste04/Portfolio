import {motionPolicy,preferences} from '../motion/policy';
import type {AboutSlides} from './engine';

let dispose:(()=>void)|undefined;
export function initAboutSlides():void{
 dispose?.();
 const root=document.querySelector<HTMLElement>('#about');
 if(!root)return;
 const abort=new AbortController(),signal=abort.signal;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 let visible=false,destroyed=false,failed=false,pending=false,frame=0,renderFrame=0,engine:AboutSlides|undefined;
 const paused=()=>document.querySelector('[data-fresh-pause]')?.getAttribute('aria-pressed')==='true';
 function sync(){
  if(destroyed)return;
  const policy=motionPolicy(preferences(paused()));
  if(policy.mode==='reduced'||policy.mode==='paused'){
   engine?.destroy();engine=undefined;root!.dataset.aboutMotion=policy.mode;return;
  }
  if(policy.mode==='hidden'||document.documentElement.hasAttribute('data-theme-revealing')){
   engine?.suspend();root!.dataset.aboutMotion='suspended';return;
  }
  if(!visible){engine?.suspend();root!.dataset.aboutMotion='offscreen';return}
  if(engine){engine.resume();root!.dataset.aboutMotion='active';return}
  if(pending||failed)return;
  pending=true;
  import('./engine').then(module=>{
   pending=false;
   if(destroyed)return;
   const current=motionPolicy(preferences(paused()));
   if(!visible||current.mode!=='active'||document.documentElement.hasAttribute('data-theme-revealing'))return;
   engine=module.createAboutSlides(root!);root!.dataset.aboutMotion='active';
  }).catch(()=>{pending=false;failed=true;if(!destroyed)root!.dataset.aboutMotion='fallback'});
 }
 function refresh(){frame=0;sync();engine?.refresh()}
 const schedule=()=>{if(!frame&&!destroyed)frame=requestAnimationFrame(refresh)};
 const observer=new IntersectionObserver(entries=>{visible=entries[0]?.isIntersecting??false;sync()},{threshold:0});
 observer.observe(root);
 const resize=new ResizeObserver(schedule);resize.observe(root);
 const mutation=new MutationObserver(sync);
 mutation.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme-revealing']});
 const button=document.querySelector('[data-fresh-pause]');
 if(button)mutation.observe(button,{attributes:true,attributeFilter:['aria-pressed']});
 window.addEventListener('resize',schedule,{passive:true,signal});
 window.addEventListener('scroll',()=>{
  if(!renderFrame&&engine&&root.dataset.aboutMotion==='active')renderFrame=requestAnimationFrame(()=>{renderFrame=0;engine?.render()});
 },{passive:true,signal});
 document.addEventListener('visibilitychange',sync,{signal});reduced.addEventListener('change',sync,{signal});
 document.fonts.ready.then(()=>{if(!destroyed)schedule()});
 sync();
 dispose=()=>{
  if(destroyed)return;destroyed=true;abort.abort();observer.disconnect();resize.disconnect();mutation.disconnect();
  cancelAnimationFrame(frame);cancelAnimationFrame(renderFrame);engine?.destroy();engine=undefined;delete root.dataset.aboutMotion;
 };
 window.addEventListener('pagehide',()=>dispose?.(),{once:true,signal});
 document.addEventListener('astro:before-swap',()=>dispose?.(),{once:true,signal});
}
window.addEventListener('pageshow',event=>{if(event.persisted)initAboutSlides()});
