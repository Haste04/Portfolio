import {gsap} from 'gsap';
import {ScrollTrigger} from 'gsap/ScrollTrigger';
import {motionPolicy,preferences} from '../motion/policy';
import {withRegistrationServices} from './services';

const prefix='about-story-';
gsap.registerPlugin(ScrollTrigger);
gsap.config({autoSleep:1});
function park(){
 if(ScrollTrigger.getAll().every(t=>String(t.vars.id).startsWith(prefix)))ScrollTrigger.disable(false);
}
// Covers cancelled lazy imports as well as the normal construction path.
park();
export interface AboutSlides {render():void;suspend():void;resume():void;refresh():void;destroy():void;}
export function createAboutSlides(root:HTMLElement):AboutSlides{
 const panels=[...root.querySelectorAll<HTMLElement>('.photo-story')],triggers:ScrollTrigger[]=[];
 let running=true,destroyed=false;
 const context=gsap.context(()=>{},root);
 const distance=(panel:HTMLElement)=>{
  const width=panel.offsetWidth,tier=motionPolicy(preferences(false)).tier;
  if(innerWidth>=1024)return width*(tier==='light'?.55:.62);
  if(innerWidth>=640)return Math.min(width*.36,innerWidth*.32);
  return Math.min(width*.24,innerWidth*.22);
 };
 function render(){
  if(!running||destroyed)return;
  // Use each ScrollTrigger's measured range for exact linear scrub progress.
  // Native input batches avoid the plugin's perpetual repaint/maintenance services.
  for(const t of triggers)t.animation!.totalProgress(gsap.utils.clamp(0,1,(scrollY-t.start)/(t.end-t.start)));
 }
 function refresh(){
  if(!running||destroyed)return;
  // Pinned runtime supports forced refresh of parked instances; its type declares only refresh().
  for(const t of triggers)(t.refresh as (soft:boolean,force:boolean)=>void)(false,true);
  render();
 }
 try{
  withRegistrationServices(()=>{
   ScrollTrigger.enable();
   try{
    context.add(()=>panels.forEach((panel,index)=>{
     const tween=gsap.fromTo(panel,{x:()=>distance(panel)*(index%2===0?1:-1),opacity:.35},{
      x:0,opacity:1,ease:'none',duration:1,force3D:false,
      scrollTrigger:{id:prefix+index,trigger:panel.closest<HTMLElement>('[data-about-entry]')!,
       start:()=> 'top '+innerHeight,end:()=> 'top '+innerHeight*.55,scrub:true,invalidateOnRefresh:true}
     });
     triggers.push(tween.scrollTrigger!);
    }));
    ScrollTrigger.refresh();
   }finally{park()}
  });
  render();
 }catch(error){context.revert();for(const t of triggers)t.kill();park();throw error}
 return{
  render,
  suspend(){running=false},
  resume(){if(!destroyed&&!running){running=true;refresh()}},
  refresh,
  destroy(){if(destroyed)return;destroyed=true;context.revert();for(const t of triggers)t.kill();park()}
 };
}
