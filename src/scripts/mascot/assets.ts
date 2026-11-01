/** Verified original paths. Only derived URLs are requested by the browser. */
export const frames = {
  sitting: { width: .84, bottom: .025, origin: '50% 92%' },
  portrait: { width: .64, bottom: .18, origin: '50% 78%' },
  wide: { width: .94, bottom: .04, origin: '50% 92%' },
  container: { width: .92, bottom: .03, origin: '50% 92%' },
  extended: { width: .64, bottom: .025, origin: '50% 92%' },
  action: { width: .84, bottom: .035, origin: '50% 75%' },
  peek: { width: .78, bottom: .025, origin: '50% 92%' },
  base: { width: .69, bottom: .025, origin: '50% 92%' },
} as const;
interface Asset { source: string; kind: 'base'|'pose'|'expression'; width:number; height:number; profile:keyof typeof frames; label:string; }
export const assets = {
  "base": {
    "source": "mr-fresh/base/mr-fresh-base.png",
    "kind": "base",
    "width": 1122,
    "height": 1402,
    "profile": "base",
    "label": "Original Mr. Fresh"
  },
  "judgmental-side-eye": {
    "source": "mr-fresh/expressions/judgmental-side-eye.png",
    "kind": "expression",
    "width": 1254,
    "height": 1254,
    "profile": "portrait",
    "label": "judgmental side eye"
  },
  "neutral-relaxed": {
    "source": "mr-fresh/expressions/neutral-relaxed.png",
    "kind": "expression",
    "width": 1254,
    "height": 1254,
    "profile": "portrait",
    "label": "neutral relaxed"
  },
  "curious": {
    "source": "mr-fresh/expressions/curious.png",
    "kind": "expression",
    "width": 1254,
    "height": 1254,
    "profile": "portrait",
    "label": "curious"
  },
  "happy-content": {
    "source": "mr-fresh/expressions/happy-content.png",
    "kind": "expression",
    "width": 1254,
    "height": 1254,
    "profile": "portrait",
    "label": "happy content"
  },
  "annoyed": {
    "source": "mr-fresh/expressions/annoyed.png",
    "kind": "expression",
    "width": 1254,
    "height": 1254,
    "profile": "portrait",
    "label": "annoyed"
  },
  "surprised": {
    "source": "mr-fresh/expressions/surprised.png",
    "kind": "expression",
    "width": 1254,
    "height": 1254,
    "profile": "portrait",
    "label": "surprised"
  },
  "sleepy": {
    "source": "mr-fresh/expressions/sleepy.png",
    "kind": "expression",
    "width": 1254,
    "height": 1254,
    "profile": "portrait",
    "label": "sleepy"
  },
  "yawning": {
    "source": "mr-fresh/expressions/yawning.png",
    "kind": "expression",
    "width": 1254,
    "height": 1254,
    "profile": "portrait",
    "label": "yawning"
  },
  "smug": {
    "source": "mr-fresh/expressions/smug.png",
    "kind": "expression",
    "width": 1254,
    "height": 1254,
    "profile": "portrait",
    "label": "smug"
  },
  "confused": {
    "source": "mr-fresh/expressions/confused.png",
    "kind": "expression",
    "width": 1254,
    "height": 1254,
    "profile": "portrait",
    "label": "confused"
  },
  "dizzy": {
    "source": "mr-fresh/expressions/dizzy.png",
    "kind": "expression",
    "width": 1254,
    "height": 1254,
    "profile": "portrait",
    "label": "dizzy"
  },
  "default-sitting": {
    "source": "mr-fresh/poses/default-sitting.png",
    "kind": "pose",
    "width": 1254,
    "height": 1254,
    "profile": "sitting",
    "label": "default sitting"
  },
  "curious-lean": {
    "source": "mr-fresh/poses/curious-lean.png",
    "kind": "pose",
    "width": 1254,
    "height": 1254,
    "profile": "sitting",
    "label": "curious lean"
  },
  "peeking": {
    "source": "mr-fresh/poses/peeking.png",
    "kind": "pose",
    "width": 1254,
    "height": 1254,
    "profile": "peek",
    "label": "peeking"
  },
  "walking": {
    "source": "mr-fresh/poses/walking.png",
    "kind": "pose",
    "width": 1254,
    "height": 1254,
    "profile": "action",
    "label": "walking"
  },
  "sleeping-curl": {
    "source": "mr-fresh/poses/sleeping-curl.png",
    "kind": "pose",
    "width": 1536,
    "height": 1024,
    "profile": "wide",
    "label": "sleeping curl"
  },
  "jumping": {
    "source": "mr-fresh/poses/jumping.png",
    "kind": "pose",
    "width": 1254,
    "height": 1254,
    "profile": "action",
    "label": "jumping"
  },
  "falling-tossed": {
    "source": "mr-fresh/poses/falling-tossed.png",
    "kind": "pose",
    "width": 1254,
    "height": 1254,
    "profile": "action",
    "label": "falling tossed"
  },
  "stretching": {
    "source": "mr-fresh/poses/stretching.png",
    "kind": "pose",
    "width": 1254,
    "height": 1254,
    "profile": "action",
    "label": "stretching"
  },
  "paw-swipe": {
    "source": "mr-fresh/poses/paw-swipe.png",
    "kind": "pose",
    "width": 1086,
    "height": 1448,
    "profile": "extended",
    "label": "paw swipe"
  },
  "sitting-in-container": {
    "source": "mr-fresh/poses/sitting-in-container.png",
    "kind": "pose",
    "width": 1254,
    "height": 1254,
    "profile": "container",
    "label": "sitting in container"
  }
} as const satisfies Record<string,Asset>;
export type AssetId=keyof typeof assets;
export function assetUrl(id:AssetId,width:512|960=512):string { return '/assets/mr-fresh/'+(id==='sitting-in-container'?'container':id)+'-'+width+'.webp'; }
