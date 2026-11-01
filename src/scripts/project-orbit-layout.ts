/** Pure geometry shared by the DOM controller and deterministic tests. */
export function wrapIndex(value:number,count:number):number { return ((value%count)+count)%count; }
export function nearestTurn(index:number,current:number,count:number):number { return index+Math.round((current-index)/count)*count; }
/** scaleAmplitude describes apparent emphasis after camera projection, not an extra zoom multiplier. */
export interface OrbitProfile { perspective:number; depth:number; scaleAmplitude:number; }
export interface OrbitPoint { x:number; y:number; z:number; scale:number; opacity:number; layer:number; captionScale:number; }
export function orbitProfile(viewport:number,tier:'full'|'balanced'|'light'|'off'):OrbitProfile {
 if(viewport<768||tier==='light')return {perspective:1200,depth:0,scaleAmplitude:.02};
 if(viewport<1024)return {perspective:1000,depth:130,scaleAmplitude:.22};
 if(viewport<1440||tier!=='full')return {perspective:850,depth:225,scaleAmplitude:.4};
 return {perspective:760,depth:260,scaleAmplitude:.45};
}
/** A smooth periodic emphasis curve, with zero slope at every cardinal position. */
function bank(angle:number,values:readonly number[]):number {
 const quadrant=wrapIndex(angle/(Math.PI/2),4),index=Math.floor(quadrant);
 const mix=(1-Math.cos((quadrant-index)*Math.PI))/2;
 return values[index]!+(values[(index+1)%4]!-values[index]!)*mix;
}
export function orbitPoint(index:number,turn:number,count:number,width:number,height:number,itemWidth:number,itemHeight:number,profile:OrbitProfile=orbitProfile(width,'balanced')):OrbitPoint {
 const angle=(index-turn)*Math.PI*2/count,depth=Math.min(profile.depth,profile.perspective*.4);
 const near=profile.perspective/(profile.perspective-depth),far=profile.perspective/(profile.perspective+depth);
 const nearScale=1+profile.scaleAmplitude,farScale=Math.max(.9,1-profile.scaleAmplitude);
 // Bound projected billboards, including readable enlarged rear captions. The camera never clips or flattens.
 const widestProjection=1/Math.sqrt(1-(depth/profile.perspective)**2);
 const rx=Math.max(0,(width/2-itemWidth*nearScale/2-16)/widestProjection);
 const ry=Math.max(0,Math.min(height*(depth?.255:.34),
  (height*.54-itemHeight*nearScale/2-20)/near,
  (height*.46-itemHeight*farScale/2-20)/far));
 const rearLift=depth?Math.max(0,Math.min(height*.12,(height*.46-itemHeight*farScale/2-20)/far-ry)):0;
 const facing=Math.cos(angle),z=facing*depth;
 const apparent=depth?bank(angle,[1+profile.scaleAmplitude,1,1-profile.scaleAmplitude,1-profile.scaleAmplitude*5/9]):1+profile.scaleAmplitude*facing;
 const contrast=Math.min(1,profile.scaleAmplitude/.45);
 return {x:Math.sin(angle)*rx,y:facing*ry-Math.max(0,-facing)**2*rearLift,z,
  // Compensate the explicit emphasis for perspective, so the requested apparent sizes stay bounded.
  scale:apparent*(profile.perspective-z)/profile.perspective,
  opacity:depth?bank(angle,[1,1-.14*contrast,1-.48*contrast,1-.32*contrast]):.8+.2*(facing+1)/2,
  layer:Math.round((facing+1)*100),captionScale:Math.max(1,.9/apparent)};
}
export function isHorizontalSwipe(dx:number,dy:number):boolean { return Math.abs(dx)>=45&&Math.abs(dx)>Math.abs(dy)*1.4; }
