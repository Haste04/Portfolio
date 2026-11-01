export interface EducationView { scale: number; x: number; y: number; }
export const fullEducationView: EducationView = {scale:1,x:0,y:0};
const clamp = (n:number,low:number,high:number):number => Math.min(high,Math.max(low,n));
/** Bounded camera: retains context and keeps all six journey locations in the viewport. */
export function educationFocusView(point:readonly [number,number],zoom=1.85):EducationView {
  const scale=clamp(zoom,1,1.85);
  return {scale,x:clamp(300-point[0]*scale,600-600*scale,0),y:clamp(330-point[1]*scale,620-620*scale,0)};
}
export function educationCameraPoint(point:readonly [number,number],view:EducationView):[number,number] {
  return [point[0]*view.scale+view.x,point[1]*view.scale+view.y];
}
/** Independent SVG camera. No transforms on HTML labels or page-layout wrappers. */
export function createEducationCamera(root:HTMLElement) {
  const groups=[...root.querySelectorAll<SVGGElement>('[data-education-camera]')];
  const paths=[...root.querySelectorAll<SVGPathElement>('[data-map-connector]')].map(node=>({
    node,point:[Number(node.dataset.pointX),Number(node.dataset.pointY)] as const,
    label:[Number(node.dataset.labelX),Number(node.dataset.labelY)] as const,id:node.dataset.mapConnector!,
  }));
  const reset=root.querySelector<HTMLButtonElement>('[data-education-reset]');
  const caption=root.querySelector<HTMLElement>('[data-education-view-label]');
  const pause=document.querySelector('[data-fresh-pause]');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const events=new AbortController();
  let current={...fullEducationView},target={...fullEducationView},frame:number|undefined,destroyed=false,focus='';
  const allowed=():boolean=>!destroyed&&!reduced.matches&&!document.hidden&&pause?.getAttribute('aria-pressed')!=='true';
  function render(view:EducationView):void {
    current=view;
    const value=`matrix(${view.scale} 0 0 ${view.scale} ${view.x} ${view.y})`;
    for(const node of groups)node.setAttribute('transform',value);
    for(const item of paths){
      const [x,y]=educationCameraPoint(item.point,view);
      item.node.setAttribute('d',`M${x} ${y} L${item.label[0]} ${item.label[1]}`);
    }
  }
  function stop():void {
    if(frame!==undefined)cancelAnimationFrame(frame);
    frame=undefined;root.dataset.mapMoving='false';
  }
  function settle():void {stop();render({...target});}
  function move(next:EducationView,animate:boolean):void {
    stop();target=next;
    if(!animate||!allowed()){render({...target});return;}
    const from={...current},started=performance.now();
    root.dataset.mapMoving='true';
    const tick=(now:number):void=>{
      frame=undefined;
      if(destroyed)return;
      if(!allowed()){settle();return;}
      const progress=Math.min(1,(now-started)/650),ease=1-Math.pow(1-progress,3);
      render({scale:from.scale+(target.scale-from.scale)*ease,x:from.x+(target.x-from.x)*ease,y:from.y+(target.y-from.y)*ease});
      if(progress<1)frame=requestAnimationFrame(tick);
      else {render({...target});root.dataset.mapMoving='false';}
    };
    frame=requestAnimationFrame(tick);
  }
  const preference=():void=>{if(!allowed())settle();};
  reduced.addEventListener('change',preference,{signal:events.signal});
  document.addEventListener('visibilitychange',preference,{signal:events.signal});
  const observer=new MutationObserver(preference);
  if(pause)observer.observe(pause,{attributes:true,attributeFilter:['aria-pressed']});
  render(current);root.dataset.mapMoving='false';root.dataset.mapView='full';
  if(reset)reset.disabled=true;
  return {
    focus(id:string,animate=true):void {
      const item=paths.find(item=>item.id===id);if(!item||destroyed)return;
      if(focus===id&&root.dataset.mapView==='zoomed')return;
      focus=id;root.dataset.mapFocus=id;root.dataset.mapView='zoomed';
      if(reset)reset.disabled=false;if(caption)caption.textContent='Location detail · 1.85×';
      move(educationFocusView(item.point),animate);
    },
    reset(animate=true):void {
      if(destroyed)return;
      focus='';delete root.dataset.mapFocus;root.dataset.mapView='full';
      const resetFocused=document.activeElement===reset;
      if(reset)reset.disabled=true;
      if(resetFocused)root.querySelector<HTMLAnchorElement>('[data-education-place][aria-current]')?.focus({preventScroll:true});
      if(caption)caption.textContent='Full Philippines';
      move({...fullEducationView},animate);
    },
    destroy():void {settle();destroyed=true;events.abort();observer.disconnect();},
  };
}
