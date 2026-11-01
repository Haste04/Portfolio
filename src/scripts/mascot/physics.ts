import type { Sample } from './gestures.ts';
export interface Velocity { x: number; y: number; }
export interface Bounds { minX: number; maxX: number; minY: number; maxY: number; }
export interface Body { x: number; y: number; vx: number; vy: number; angle: number; elapsed: number; bounces: number; settled: boolean; }
export const clamp = (value: number, low: number, high: number): number => Math.max(low, Math.min(high, value));
/** Least-squares velocity over the recent trajectory avoids a noisy final event. */
export function releaseVelocity(samples: readonly Sample[], now: number, cap=1100): Velocity {
  const recent=samples.filter(s=>now-s.t<=120);
  if(recent.length<2 || now-(recent.at(-1)?.t??0)>80) return {x:0,y:0};
  const mean=recent.reduce((a,s)=>({x:a.x+s.x,y:a.y+s.y,t:a.t+s.t}),{x:0,y:0,t:0});
  mean.x/=recent.length; mean.y/=recent.length; mean.t/=recent.length;
  let denominator=0,x=0,y=0;
  for(const s of recent){const dt=s.t-mean.t;denominator+=dt*dt;x+=dt*(s.x-mean.x);y+=dt*(s.y-mean.y)}
  if(denominator<1) return {x:0,y:0};
  x=x/denominator*1000;y=y/denominator*1000;
  const scale=Math.min(1,cap/Math.max(1,Math.hypot(x,y)));
  return {x:x*scale,y:y*scale};
}
export function createBody(x:number,y:number,v:Velocity):Body { return {x,y,vx:v.x,vy:v.y,angle:0,elapsed:0,bounces:0,settled:false}; }
export function stepBody(input:Body,bounds:Bounds,delta:number,retention=.52):Body {
  const b={...input}; if(b.settled)return b;
  const duration=clamp(delta,0,.05), steps=Math.max(1,Math.ceil(duration/(1/120))),dt=duration/steps;
  for(let i=0;i<steps&&!b.settled;i++){
    b.elapsed+=dt; b.vy+=1250*dt; b.vx*=Math.exp(-.42*dt); b.x+=b.vx*dt;b.y+=b.vy*dt;
    if(b.x<bounds.minX||b.x>bounds.maxX){b.x=clamp(b.x,bounds.minX,bounds.maxX);b.vx*=-retention;}
    if(b.y<bounds.minY){b.y=bounds.minY;b.vy=Math.abs(b.vy)*retention;}
    if(b.y>=bounds.maxY){b.y=bounds.maxY;
      if(Math.abs(b.vy)<90 && Math.abs(b.vx)<40) b.settled=true;
      else {b.vy=-Math.abs(b.vy)*retention;b.vx*=.65;b.bounces++;}
    }
    b.angle=clamp(b.vx*.025,-12,12);
    if(b.elapsed>=6)b.settled=true;
  }
  if(b.settled){b.x=clamp(b.x,bounds.minX,bounds.maxX);b.y=clamp(b.y,bounds.minY,bounds.maxY);b.vx=b.vy=b.angle=0;}
  return b;
}
export function springProgress(t:number):number { if(t<=0)return 0;if(t>=1)return 1;return 1-Math.exp(-7*t)*Math.cos(9*t); }
