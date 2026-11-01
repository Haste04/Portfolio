import assert from 'node:assert/strict';
import { test } from 'node:test';
const modules = await Promise.all(['state','gestures','physics','idle','capabilities'].map(name => import('../src/scripts/mascot/'+name+'.ts').catch(()=>null)));
const [state, gestures, physics, idle, capabilities] = modules;
test('mascot behavior modules are available', () => assert.ok(modules.every(Boolean), 'Phase 3 behavior modules are not implemented'));
function clock() { let time=0, next=0; const jobs=new Map(); return {now:()=>time,set:(fn,ms)=>{jobs.set(++next,{fn,at:time+ms});return next},clear:id=>jobs.delete(id),tick(ms){const end=time+ms;for(;;){const item=[...jobs].sort((a,b)=>a[1].at-b[1].at)[0];if(!item||item[1].at>end)break;time=item[1].at;jobs.delete(item[0]);item[1].fn()}time=end},get size(){return jobs.size}};}
if(state) {
 test('dragging excludes reactions and rejects direct airborne entry',()=>{const m=new state.StateMachine();assert.equal(m.start('airborne'),null);const key=m.start('dragging');assert.ok(key);assert.equal(m.start('reacting'),null);assert.equal(m.advance(key,'sleeping'),false);assert.equal(m.advance(key,'airborne'),true);assert.equal(m.start('section-transitioning'),null);assert.equal(m.state,'airborne');assert.equal(m.advance(key,'settling'),true);assert.equal(m.advance(key,'returning'),true);assert.equal(m.finish(key),true);assert.equal(m.state,'idle')});
 test('new actions cancel old callbacks, and stale finish cannot change state',()=>{const c=clock(),m=new state.StateMachine(c);let fired=0;const old=m.start('reacting');m.after(old,400,()=>fired++);const fresh=m.start('section-transitioning');c.tick(1000);assert.equal(fired,0);assert.equal(m.finish(old),false);assert.equal(m.state,'section-transitioning');m.finish(fresh);assert.equal(c.size,0)});
 test('rapid replacement has one live timer; destroy removes it and rejects work',()=>{const c=clock(),m=new state.StateMachine(c);for(let i=0;i<20;i++){const k=m.start('reacting');m.after(k,1000,()=>assert.fail('stale timer'))}assert.equal(c.size,1);m.destroy();assert.equal(c.size,0);assert.equal(m.start('idle'),null);c.tick(2000)});
}
if(gestures) {
 test('clicks escalate and swipe has a bounded cooldown',()=>{const c=new gestures.ClickTracker();assert.equal(c.click(0),'surprised');c.click(150);assert.equal(c.click(300),'annoyed');c.click(450);assert.equal(c.click(600),'paw-swipe');assert.equal(c.click(700),null);assert.equal(c.click(2200),'surprised')});
 test('drag threshold suppresses click while touch displacement stays scroll-only',()=>{const d=new gestures.DragTracker();d.begin(10,10,0,'mouse');assert.equal(d.move(13,12,10),'pending');assert.equal(d.move(40,20,40),'dragging');assert.equal(d.end().click,false);d.begin(10,10,100,'touch');assert.equal(d.move(10,90,130),'scrolling');assert.equal(d.end().click,false);d.begin(1,1,200,'touch');assert.equal(d.end().click,true)});
 test('stationary hover and a single pass never count as petting',()=>{const p=new gestures.PetRecognizer();for(let i=0;i<20;i++)assert.equal(p.move(i*5,40,i*20,true),false);p.reset();for(let i=0;i<20;i++)assert.equal(p.move(40,40,i*30,true),false)});
 test('three gentle strokes count, high-speed movement and leaving hitbox do not',()=>{const p=new gestures.PetRecognizer();let happy=false;let time=0;for(const x of [20,40,60,80,60,40,20,40,60,80])happy=p.move(x,50,time+=65,true)||happy;assert.equal(happy,true);p.reset();for(const x of [0,100,0,100,0])assert.equal(p.move(x,50,time+=5,true),false);p.reset();p.move(0,0,0,true);p.move(90,0,100,true);p.move(0,0,150,false);assert.equal(p.move(90,0,200,true),false)});
}
if(physics) {
 test('velocity uses recent trajectory, rejects stale launches and caps magnitude',()=>{const v=physics.releaseVelocity([{x:0,y:0,t:0},{x:20,y:0,t:20},{x:40,y:0,t:40},{x:40,y:0,t:41}],41,1100);assert.ok(v.x>700&&v.x<1100);assert.equal(v.y,0);assert.deepEqual(physics.releaseVelocity([{x:0,y:0,t:0},{x:100,y:0,t:10}],200),{x:0,y:0});const cap=physics.releaseVelocity([{x:0,y:0,t:0},{x:500,y:500,t:10}],10,900);assert.ok(Math.hypot(cap.x,cap.y)<=900.001)});
 test('collisions remain bounded, lose energy, settle, and have a hard deadline',()=>{const bounds={minX:0,maxX:200,minY:0,maxY:200};let body=physics.createBody(100,120,{x:250,y:450});let firstBounce;for(let i=0;i<1000&&!body.settled;i++){body=physics.stepBody(body,bounds,1/120);assert.ok(body.x>=0&&body.x<=200&&body.y>=0&&body.y<=200);if(body.bounces===1&&!firstBounce)firstBounce=Math.abs(body.vy)}assert.ok(firstBounce>0&&firstBounce<450);assert.equal(body.settled,true);assert.ok(body.elapsed<=6.1);assert.ok(body.bounces>=2);const forced=physics.stepBody({...physics.createBody(30,30,{x:800,y:-800}),elapsed:5.99},bounds,.03);assert.equal(forced.settled,true)});
 test('return easing starts at origin and reaches anchor without unbounded oscillation',()=>{assert.equal(physics.springProgress(0),0);assert.equal(physics.springProgress(1),1);const values=Array.from({length:101},(_,i)=>physics.springProgress(i/100));assert.ok(Math.max(...values)<1.2);assert.ok(values.every(v=>v>=0))});
}
if(idle) {
 test('sleep stages fire at 30/45/60 seconds with one scheduled timeout',()=>{const c=clock(),events=[];const i=new idle.Inactivity(c,s=>events.push(s));i.reset();c.tick(29999);assert.deepEqual(events,[]);c.tick(1);assert.deepEqual(events,['sleepy']);c.tick(15000);assert.deepEqual(events,['sleepy','yawning']);c.tick(15000);assert.deepEqual(events,['sleepy','yawning','sleeping']);assert.equal(c.size,0)});
 test('interaction resets inactivity and hidden time is excluded',()=>{const c=clock(),events=[];const i=new idle.Inactivity(c,s=>events.push(s));i.reset();c.tick(20000);i.pause();c.tick(60000);assert.deepEqual(events,[]);i.resume();c.tick(9999);assert.deepEqual(events,[]);c.tick(1);assert.deepEqual(events,['sleepy']);i.reset();c.tick(15000);assert.deepEqual(events,['sleepy']);i.destroy();c.tick(90000);assert.equal(events.length,1);assert.equal(c.size,0)});
}
if(capabilities) test('reduced motion wins; low resources/coarse input balance independently of width',()=>{assert.equal(capabilities.chooseTier({reduced:true,cores:16,memory:16,coarse:false,saveData:false}),'C');assert.equal(capabilities.chooseTier({reduced:false,cores:4,memory:8,coarse:false,saveData:false}),'B');assert.equal(capabilities.chooseTier({reduced:false,cores:16,memory:8,coarse:false,saveData:false}),'A')});

test('all 22 manifest entries match source dimensions and transparent optimized copies',async()=>{
 const {assets,assetUrl}=await import('../src/scripts/mascot/assets.ts');
 const {default:sharp}=await import('sharp');
 assert.equal(Object.keys(assets).length,22);
 assert.equal(Object.values(assets).filter(a=>a.kind==='expression').length,11);
 assert.equal(Object.values(assets).filter(a=>a.kind==='pose').length,10);
 for(const [id,a] of Object.entries(assets)){
  const source=await sharp(a.source).metadata();assert.equal(source.width,a.width,id);assert.equal(source.height,a.height,id);
  for(const width of [512,960]){
   const output=await sharp('public'+assetUrl(id,width)).metadata();
   assert.equal(output.width,width,id);assert.equal(output.format,'webp');assert.equal(output.hasAlpha,true,id);
   assert.ok(Math.abs(output.width/output.height-a.width/a.height)<.003,id+' proportions');
  }
 }
});
