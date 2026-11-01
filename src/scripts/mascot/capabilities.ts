export type Tier='A'|'B'|'C';
export interface Capabilities { reduced:boolean; saveData:boolean; coarse:boolean; cores:number; memory:number; }
export function chooseTier(c:Capabilities):Tier { if(c.reduced||c.saveData||c.memory<=2)return 'C';if(c.coarse||c.cores<=4||c.memory<=4)return 'B';return 'A'; }
export function readCapabilities():Capabilities {
  const nav=navigator as Navigator & {deviceMemory?:number; connection?:{saveData?:boolean}};
  return {reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,coarse:!matchMedia('(any-pointer: fine)').matches,cores:navigator.hardwareConcurrency||4,memory:nav.deviceMemory??8,saveData:nav.connection?.saveData??false};
}
