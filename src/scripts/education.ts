import { createEducationCamera } from './education-camera';
/** Native chapter links remain the fallback; enhancement owns only Education interaction. */
let dispose: (() => void) | undefined;
export function initEducationJourney(): void {
  dispose?.();
  const root=document.querySelector<HTMLElement>('[data-education-journey]');if(!root)return;
  const panels=[...root.querySelectorAll<HTMLElement>('[data-education-panel]')];
  const places=[...root.querySelectorAll<HTMLAnchorElement>('[data-education-place]')];
  const stages=[...root.querySelectorAll<HTMLAnchorElement>('[data-education-stage]')];
  const points=[...root.querySelectorAll<SVGElement>('[data-map-point]')];
  const controls=[...root.querySelectorAll<HTMLElement>('[data-education-controls],[data-education-camera-controls],[data-education-chapter-controls]')];
  const select=root.querySelector<HTMLSelectElement>('[data-education-location-select]');
  const previous=root.querySelector<HTMLButtonElement>('[data-education-previous]');
  const next=root.querySelector<HTMLButtonElement>('[data-education-next]');
  const status=root.querySelector<HTMLElement>('[data-education-status]');
  const stageNav=root.querySelector<HTMLElement>('[data-education-stage-nav]');
  if(!panels.length||!select||!previous||!next)return;
  const savedFocus=root.dataset.mapFocus,camera=createEducationCamera(root);
  const events=new AbortController(),{signal}=events,remembered=new Map<string,string>();
  let current='';
  function show(id:string,announce=true,zoom=true):void {
    const panel=panels.find(panel=>panel.dataset.educationPanel===id),place=panel?.dataset.entryPlace;
    if(!panel||!place)return;
    if(zoom)camera.focus(place);
    if(current===id)return;
    current=id;remembered.set(place,id);
    for(const item of panels){
      const inactive=item!==panel;item.hidden=false;item.inert=inactive;
      item.classList.toggle('is-inactive',inactive);item.setAttribute('aria-hidden',String(inactive));
    }
    for(const link of places){
      if(link.dataset.educationPlace===place)link.setAttribute('aria-current','location');
      else link.removeAttribute('aria-current');
    }
    for(const point of points)point.classList.toggle('is-selected',point.dataset.mapPoint===place);
    for(const link of stages){
      const item=link.closest('li');if(item)item.hidden=link.dataset.stagePlace!==place;
      if(link.dataset.educationStage===id)link.setAttribute('aria-current','step');else link.removeAttribute('aria-current');
    }
    select!.value=place;
    const location=select!.selectedOptions[0]?.textContent??place,index=panels.indexOf(panel);
    const focused=document.activeElement;
    previous!.disabled=index===0;next!.disabled=index===panels.length-1;
    if(focused===previous&&previous!.disabled)next!.focus({preventScroll:true});
    if(focused===next&&next!.disabled)previous!.focus({preventScroll:true});
    stageNav?.setAttribute('aria-label','Education stages in '+location);
    root!.dataset.currentEntry=id;
    if(announce&&status)status.textContent=`${String(index+1).padStart(2,'0')} of ${String(panels.length).padStart(2,'0')}. ${panel.querySelector('.education-level')?.textContent}. ${panel.querySelector('h3')?.textContent}. ${location}`;
  }
  function choosePlace(place:string):void {
    const id=remembered.get(place)??panels.find(panel=>panel.dataset.entryPlace===place)?.dataset.educationPanel;
    if(id)show(id);
  }
  root.addEventListener('click',event=>{
    if(event.button!==0||event.ctrlKey||event.metaKey||event.altKey||event.shiftKey)return;
    const trigger=event.target instanceof Element?event.target.closest<HTMLElement|SVGElement>('[data-education-place],[data-education-pin],[data-education-stage],[data-education-previous],[data-education-next],[data-education-reset]'):null;
    if(!trigger||!root.contains(trigger))return;
    event.preventDefault();
    const place=trigger.dataset.educationPlace??trigger.dataset.educationPin;
    if(place)choosePlace(place);
    else if(trigger.dataset.educationStage)show(trigger.dataset.educationStage);
    else if(trigger.hasAttribute('data-education-reset')){
      camera.reset();if(status)status.textContent='Full Philippines view. Current chapter unchanged.';
    }else{
      const index=panels.findIndex(panel=>panel.dataset.educationPanel===current);
      const panel=panels[index+(trigger.hasAttribute('data-education-next')?1:-1)];
      if(panel?.dataset.educationPanel)show(panel.dataset.educationPanel);
    }
  },{signal});
  select.addEventListener('change',()=>choosePlace(select.value),{signal});
  const fragment=():string=>{const id=location.hash.replace('#education-stage-','');return id==='grade-1-2'?'kindergarten':id;};
  window.addEventListener('hashchange',()=>show(fragment()),{signal});
  root.addEventListener('error',event=>{
    if(event.target instanceof HTMLImageElement&&event.target.matches('[data-education-logo]')){
      event.target.hidden=true;
    }
  },{signal,capture:true});
  for(const image of root.querySelectorAll<HTMLImageElement>('[data-education-logo]')){
    if(image.complete&&!image.naturalWidth)image.hidden=true;
  }
  root.dataset.enhanced='';for(const control of controls)control.hidden=false;
  const initial=[root.dataset.currentEntry,fragment(),'nursery'].find(id=>panels.some(panel=>panel.dataset.educationPanel===id));
  if(initial)show(initial,false,false);
  if(savedFocus)camera.focus(savedFocus,false);
  dispose=()=>{
    camera.destroy();events.abort();
    for(const panel of panels){panel.hidden=false;panel.inert=false;panel.classList.remove('is-inactive');panel.removeAttribute('aria-hidden');}
    for(const link of stages){const item=link.closest('li');if(item)item.hidden=false;}
    for(const control of controls)control.hidden=true;
    delete root.dataset.enhanced;
  };
  window.addEventListener('pagehide',dispose,{signal,once:true});
  document.addEventListener('astro:before-swap',dispose,{signal,once:true});
}
