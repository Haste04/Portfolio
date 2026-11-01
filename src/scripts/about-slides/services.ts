import {gsap} from 'gsap';

/** Scope the installed plugin's registrations to a synchronous construction pass.
 * Its global disable() does not unregister GSAP media hooks or native orientation listeners.
 * No API remains wrapped after work returns. */
type MediaCallback=()=>void;
type MediaRuntime=typeof gsap & {
 addEventListener(type:string,callback:MediaCallback):void;
 removeEventListener(type:string,callback:MediaCallback):void;
};
type QueryCallback=((this:MediaQueryList,event:MediaQueryListEvent)=>unknown)|null;
type CompatibleQuery=Omit<MediaQueryList,'addListener'|'removeListener'>&{
 addListener?:(callback:QueryCallback)=>void;removeListener:(callback:QueryCallback)=>void;
};
export function withRegistrationServices<T>(work:()=>T):T{
 // These runtime event APIs are present in pinned GSAP 3.15 but omitted from its bundled typings.
 const runtime=gsap as MediaRuntime;
 const add=runtime.addEventListener,media=gsap.matchMedia,match=window.matchMedia;
 const listeners:Parameters<typeof runtime.addEventListener>[]=[],release:(()=>void)[]=[],restore:(()=>void)[]=[];
 runtime.addEventListener=(...args)=>{listeners.push(args);return add(...args)};
 gsap.matchMedia=(...args)=>{const mm=media(...args);release.push(()=>mm.revert());return mm};
 window.matchMedia=query=>{
  const mq=match.call(window,query) as CompatibleQuery;
  if(mq.addListener){
   const original=mq.addListener;
   mq.addListener=callback=>{release.push(()=>mq.removeListener(callback));return original.call(mq,callback)};
   restore.push(()=>{mq.addListener=original});
  }else{
   const original=mq.addEventListener;
   mq.addEventListener=(...args:Parameters<typeof original>)=>{
    release.push(()=>mq.removeEventListener(...args));return original.call(mq,...args);
   };
   restore.push(()=>{mq.addEventListener=original});
  }
  return mq as MediaQueryList;
 };
 try{return work()}finally{
  runtime.addEventListener=add;gsap.matchMedia=media;window.matchMedia=match;
  for(const undo of restore)undo();
  for(const args of listeners)runtime.removeEventListener(...args);
  for(const undo of release.reverse())undo();
 }
}
