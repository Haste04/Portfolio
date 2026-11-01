/** Pure, bounded geometry. All distances are CSS pixels. */
export function influence(distance:number,radius:number):number{
 if(radius<=0||!Number.isFinite(distance))return 0;
 const t=Math.max(0,Math.min(1,1-distance/radius));return t*t*(3-2*t);
}
export function segmentDistance(x:number,y:number,ax:number,ay:number,bx:number,by:number):number{
 const dx=bx-ax,dy=by-ay,d=dx*dx+dy*dy;
 const t=d?Math.max(0,Math.min(1,((x-ax)*dx+(y-ay)*dy)/d)):0;
 return Math.hypot(x-ax-t*dx,y-ay-t*dy);
}
export function ringDistance(x:number,y:number,cx:number,cy:number,rx:number,ry:number):number{
 if(rx<=0||ry<=0)return Infinity;
 const dx=x-cx,dy=y-cy;if(!dx&&!dy)return Math.min(rx,ry);
 const angle=Math.atan2(dy/ry,dx/rx);
 return Math.hypot(dx-rx*Math.cos(angle),dy-ry*Math.sin(angle));
}
