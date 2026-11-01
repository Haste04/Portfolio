import assert from 'node:assert/strict';
import {test} from 'node:test';
import {wrapIndex,nearestTurn,orbitPoint,isHorizontalSwipe} from '../src/scripts/project-orbit-layout.ts';
test('orbit index navigation wraps and chooses bounded shortest rotations',()=>{
 assert.equal(wrapIndex(-1,4),3);assert.equal(wrapIndex(4,4),0);assert.equal(wrapIndex(103,4),3);
 assert.equal(nearestTurn(3,0,4),-1);assert.equal(nearestTurn(0,3,4),4);assert.equal(nearestTurn(2,1,4),2);
 for(let n=-100;n<100;n++)for(let i=0;i<4;i++){const next=nearestTurn(i,n,4);assert.equal(wrapIndex(next,4),i);assert.ok(Math.abs(next-n)<=2)}
});
test('ellipse positions stay bounded and all projects rotate into the same emphasis position',()=>{
 for(const [width,height] of [[280,390],[350,390],[600,590]]){
  const positions=Array.from({length:4},(_,i)=>orbitPoint(i,0,4,width,height,72,88));
  assert.equal(new Set(positions.map(p=>p.x.toFixed(2)+','+p.y.toFixed(2))).size,4);
  for(let selected=0;selected<4;selected++){
   assert.deepEqual(orbitPoint(selected,selected,4,width,height,72,88),positions[0]);
   for(let i=0;i<4;i++){const p=orbitPoint(i,selected,4,width,height,72,88);assert.ok(Math.abs(p.x)+36<=width/2);assert.ok(p.y+height*.46>=44&&p.y+height*.46<=height-44)}
  }
 }
});
test('horizontal swipe requires deliberate travel and rejects ordinary vertical page scrolling',()=>{
 assert.equal(isHorizontalSwipe(70,10),true);assert.equal(isHorizontalSwipe(-70,10),true);
 assert.equal(isHorizontalSwipe(20,0),false);assert.equal(isHorizontalSwipe(70,95),false);assert.equal(isHorizontalSwipe(0,120),false);
});

test('spatial orbit has real front/back depth and continuous billboard emphasis',async()=>{
 const {orbitProfile}=await import('../src/scripts/project-orbit-layout.ts');
 const profile=orbitProfile(1920,'full');
 const front=orbitPoint(0,0,4,600,590,108,98,profile),back=orbitPoint(2,0,4,600,590,108,98,profile);
 assert.ok(front.z>=150&&back.z<=-150,'real positive and negative depth');
 assert.ok(front.opacity>back.opacity&&front.layer>back.layer);
 const apparent=p=>p.scale*profile.perspective/(profile.perspective-p.z);
 assert.ok(apparent(front)/apparent(back)>1.4,'perspective creates meaningful apparent size');
 const path=[0,.25,.5,.75,1].map(turn=>orbitPoint(1,turn,4,600,590,108,98,profile));
 assert.ok(path.every((p,i)=>!i||p.z>path[i-1].z),'incoming depth advances continuously');
 assert.ok(path.every((p,i)=>!i||p.opacity>path[i-1].opacity));
});
test('dense 3D projection remains bounded across the six layout ranges',async()=>{
 const {orbitProfile}=await import('../src/scripts/project-orbit-layout.ts');
 for(const [viewport,width,height,item] of [[1920,600,590,108],[1366,600,590,108],[1024,469,480,84],[768,700,480,104],[390,350,460,78],[320,280,460,68]]){
  const profile=orbitProfile(viewport,viewport>=1440?'full':'balanced');
  if(viewport<768)assert.equal(profile.depth,0);
  for(let turn=0;turn<=4;turn+=.025)for(let index=0;index<4;index++){
   const p=orbitPoint(index,turn,4,width,height,item,98,profile),factor=profile.perspective/(profile.perspective-p.z);
   const x=width/2+p.x*factor,y=height*.46+p.y*factor,halfW=item*p.scale*factor/2,halfH=98*p.scale*factor/2;
   assert.ok(x-halfW>=0&&x+halfW<=width&&y-halfH>=0&&y+halfH<=height,'projected bounds '+JSON.stringify({viewport,turn,index,p,x,y}));
  }
 }
 assert.ok(orbitProfile(1920,'full').depth>orbitProfile(1366,'balanced').depth);
 assert.equal(orbitProfile(1920,'light').depth,0,'capability tier can simplify independently of width');
});

test('V2 foreground, two side banks and rear have strong projected emphasis without depth-slot teleports',async()=>{
 const {orbitProfile}=await import('../src/scripts/project-orbit-layout.ts'),profile=orbitProfile(1920,'full');
 const points=[0,1,2,3].map(i=>orbitPoint(i,0,4,600,590,104,98,profile));
 const projected=p=>p.scale*profile.perspective/(profile.perspective-p.z);
 assert.ok(points[0].z>=240&&points[2].z<=-240,'substantial real camera-space depth');
 assert.ok(projected(points[0])>=1.4&&projected(points[2])<=.6);
 assert.ok(projected(points[0])/projected(points[2])>=2.4,'immediately visible foreground/rear separation');
 assert.ok(projected(points[1])-projected(points[3])>=.2,'different emphasis at the side banks');
 assert.ok(points[2].opacity<=.55&&points[1].opacity-points[3].opacity>=.12);
 for(let t=0;t<4;t+=.01){
  const a=orbitPoint(0,t,4,600,590,104,98,profile),b=orbitPoint(0,t+.0001,4,600,590,104,98,profile);
  assert.ok(Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z)<.2,'continuous path across quadrant and depth boundaries');
  assert.ok(Math.abs(a.scale-b.scale)<.002&&Math.abs(a.opacity-b.opacity)<.002);
  assert.ok(projected(a)*a.captionScale>=.89,'rear captions retain a readable apparent scale');
 }
});
test('V2 small-laptop depth remains strong while tablet and compact profiles simplify safely',async()=>{
 const {orbitProfile}=await import('../src/scripts/project-orbit-layout.ts');
 const apparent=(i,p)=>{const a=orbitPoint(i,0,4,469,480,104,98,p);return a.scale*p.perspective/(p.perspective-a.z)};
 const laptop=orbitProfile(1024,'balanced'),tablet=orbitProfile(768,'balanced'),compact=orbitProfile(390,'full');
 assert.ok(apparent(0,laptop)/apparent(2,laptop)>2.2);
 assert.ok(tablet.depth<laptop.depth&&tablet.scaleAmplitude<laptop.scaleAmplitude);
 assert.equal(compact.depth,0);assert.equal(orbitProfile(1920,'light').depth,0);
});
