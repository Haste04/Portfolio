import { browserClock, type Clock } from './state.ts';
export type SleepStage='sleepy'|'yawning'|'sleeping';
export class Inactivity {
  private clock:Clock; private notify:(stage:SleepStage)=>void;
  private elapsed=0; private started=0; private index=0; private timer:number|undefined; private running=false; private destroyed=false;
  constructor(clock:Clock=browserClock,notify:(stage:SleepStage)=>void){this.clock=clock;this.notify=notify;}
  /** A completed yawn rests sleepy; sleep remains valid after the last timer has fired. */
  get stage():SleepStage|null{return this.index>=3?'sleeping':this.index>=1?'sleepy':null;}
  reset():void{if(this.destroyed)return;this.pause();this.elapsed=0;this.index=0;this.resume();}
  pause():void{if(this.running)this.elapsed+=this.clock.now()-this.started;this.running=false;if(this.timer!==undefined)this.clock.clear(this.timer);this.timer=undefined;}
  resume():void{if(this.running||this.destroyed)return;this.running=true;this.started=this.clock.now();this.schedule();}
  private schedule():void {
    const stages:readonly [number,SleepStage][]=[[30000,'sleepy'],[45000,'yawning'],[60000,'sleeping']];
    const next=stages[this.index];if(!next||!this.running)return;
    this.timer=this.clock.set(()=>{this.timer=undefined;if(!this.running)return;this.index++;this.notify(next[1]);this.schedule();},Math.max(0,next[0]-this.elapsed-(this.clock.now()-this.started)));
  }
  destroy():void{this.pause();this.destroyed=true;}
}
