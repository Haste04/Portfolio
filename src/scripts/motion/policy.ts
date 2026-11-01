/** Shared capability/preferences policy for user-triggered transitions. No scroll driver. */
export interface MotionPreferences { width:number; reduced:boolean; paused:boolean; hidden:boolean; cores:number; memory:number; coarse:boolean; saveData:boolean; }
export interface MotionPolicy { mode:'active'|'paused'|'reduced'|'hidden'; tier:'full'|'balanced'|'light'|'off'; }
export function motionPolicy(p:MotionPreferences):MotionPolicy {
  if(p.hidden)return {mode:'hidden',tier:'off'};
  if(p.paused)return {mode:'paused',tier:'off'};
  if(p.reduced)return {mode:'reduced',tier:'off'};
  if(p.width<768||p.saveData||p.memory<=2||p.cores<=2)return {mode:'active',tier:'light'};
  if(p.width<1440||p.coarse||p.memory<=4||p.cores<=4)return {mode:'active',tier:'balanced'};
  return {mode:'active',tier:'full'};
}
export function preferences(paused:boolean):MotionPreferences {
  const nav=navigator as Navigator & {deviceMemory?:number;connection?:{saveData?:boolean}};
  return {width:innerWidth,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,paused,hidden:document.hidden,cores:navigator.hardwareConcurrency||4,memory:nav.deviceMemory??8,coarse:!matchMedia('(any-pointer: fine)').matches,saveData:nav.connection?.saveData??false};
}
