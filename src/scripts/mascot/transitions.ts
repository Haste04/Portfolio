import { assets, frames, assetUrl, type AssetId } from "./assets.ts";
import { headAreas } from "./head-areas.ts";
/** Two display layers, bounded decode cache, and a generation guard for slow image loads. */
export class CharacterView {
  private host: HTMLElement;
  private actor: HTMLButtonElement;
  private layers: HTMLElement[];
  private cache = new Map<AssetId, Promise<HTMLImageElement>>();
  private serial = 0;
  private index = 0;
  private size = 200;
  private current: AssetId = "sitting-in-container";
  private animations = new Set<Animation>();
  motion = true;
  intensity = 1;
  constructor(host: HTMLElement, actor: HTMLButtonElement) {
    this.host = host;
    this.actor = actor;
    this.layers = [
      ...actor.querySelectorAll<HTMLElement>("[data-fresh-layer]"),
    ];
    this.index = Math.max(
      0,
      this.layers.findIndex((layer) => !layer.hidden),
    );
    const displayed = host.dataset.pose;
    if (displayed && displayed in assets) this.current = displayed as AssetId;
    const original = this.layers[this.index]?.querySelector("img");
    if (original) this.cache.set(this.current, Promise.resolve(original));
  }
  setSize(size: number): void {
    this.size = size;
    this.actor.style.width = size + "px";
    this.actor.style.height = size + "px";
  }
  position(x: number, y: number, rotation = 0): void {
    this.actor.style.transform = "translate3d(" + x + "px," + y + "px,0)";
    this.actor.style.setProperty("--fresh-rotation", rotation + "deg");
  }
  attention(x = 0, y = 0): void {
    this.actor.style.setProperty("--fresh-tilt", x + "deg");
    this.actor.style.setProperty("--fresh-lift", y + "px");
  }
  private load(id: AssetId): Promise<HTMLImageElement> {
    const existing = this.cache.get(id);
    if (existing) return existing;
    const img = new Image();
    img.decoding = "async";
    img.alt = "";
    img.draggable = false;
    img.src = assetUrl(
      id,
      this.size * (window.devicePixelRatio || 1) > 512 ? 960 : 512,
    );
    const pending = img
      .decode()
      .then(() => img)
      .catch((error) => {
        this.cache.delete(id);
        throw error;
      });
    this.cache.set(id, pending);
    if (this.cache.size > 8)
      for (const key of this.cache.keys()) {
        if (key !== this.current && key !== id) {
          this.cache.delete(key);
          break;
        }
      }
    return pending;
  }
  preload(ids: readonly AssetId[]): void {
    for (const id of ids) void this.load(id).catch(() => {});
  }
  async show(id: AssetId): Promise<boolean> {
    const serial = ++this.serial;
    let img: HTMLImageElement;
    try {
      img = await this.load(id);
    } catch {
      return false;
    }
    if (serial !== this.serial) return false;
    const current = this.layers[this.index],
      next = this.layers[1 - this.index];
    if (!current || !next) return false;
    for (const layer of this.layers)
      for (const animation of layer.getAnimations()) {
        animation.onfinish = null;
        animation.cancel();
        this.animations.delete(animation);
      }
    current.hidden = false;
    next.hidden = true;
    if (id === this.current && current.contains(img)) {
      this.host.dataset.pose = id;
      return true;
    }
    const profile = frames[assets[id].profile];
    img.style.width = profile.width * 100 + "%";
    img.style.bottom = profile.bottom * 100 + "%";
    img.style.transformOrigin = profile.origin;
    img.dataset.framing = assets[id].profile;
    img.width = assets[id].width;
    img.height = assets[id].height;
    next.replaceChildren(img);
    next.hidden = false;
    const sameFrame = assets[this.current].profile === assets[id].profile;
    if (this.motion && sameFrame) {
      this.animate(current, [{ opacity: 1 }, { opacity: 0 }], 90, () => {
        if (serial === this.serial) current.hidden = true;
      });
      this.animate(next, [{ opacity: 0 }, { opacity: 1 }], 130);
    } else {
      current.hidden = true;
      if (this.motion)
        this.animate(
          next,
          [
            { opacity: 0, transform: "translateY(5px) scale(.98)" },
            { opacity: 1, transform: "none" },
          ],
          140,
        );
    }
    this.index = 1 - this.index;
    this.current = id;
    this.host.dataset.pose = id;
    return true;
  }
  cue(kind: "bounce" | "shake" | "dip" | "walk" | "wake"): void {
    this.cancelAnimations();
    if (!this.motion) return;
    const node = this.actor.querySelector<HTMLElement>(".fresh-cue");
    if (!node) return;
    const transforms = {
      bounce: ["translateY(0)", "translateY(-12px)", "translateY(0)"],
      shake: [
        "translateX(0)",
        "translateX(-5px)",
        "translateX(5px)",
        "translateX(-3px)",
        "translateX(0)",
      ],
      dip: [
        "translateY(0) scale(1)",
        "translateY(12px) scale(.96)",
        "translateY(0) scale(1)",
      ],
      walk: ["translateX(-16px)", "translateX(0)"],
      wake: [
        "rotate(-3deg) scale(.98)",
        "rotate(2deg) scale(1.015)",
        "rotate(0) scale(1)",
      ],
    };
    this.animate(
      node,
      transforms[kind].map((transform) => ({
        transform: transform.replace(
          /(-?\d+(?:\.\d+)?)(px|deg)/g,
          (_, value: string, unit: string) =>
            Number(value) * this.intensity + unit,
        ),
      })),
      kind === "walk" ? 600 : 420,
    );
  }
  private animate(
    node: HTMLElement,
    frames: Keyframe[],
    duration: number,
    finish?: () => void,
  ): void {
    const animation = node.animate(frames, { duration, easing: "ease-out" });
    this.animations.add(animation);
    animation.onfinish = () => {
      this.animations.delete(animation);
      finish?.();
    };
  }
  private cancelAnimations(): void {
    for (const animation of this.animations) {
      animation.onfinish = null;
      animation.cancel();
    }
    this.animations.clear();
  }
  /** True when a pointer position lands on Mr. Fresh's head in the pose currently on screen. */
  headHit(clientX: number, clientY: number): boolean {
    const area = headAreas[this.current];
    const img = this.layers[this.index]?.querySelector("img");
    if (!area || !img) return false;
    const r = img.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    const x = (clientX - r.left) / r.width,
      y = (clientY - r.top) / r.height;
    return x >= area[0] && x <= area[2] && y >= area[1] && y <= area[3];
  }
  stop(): void {
    this.serial++;
    this.cancelAnimations();
    this.attention();
    for (let i = 0; i < this.layers.length; i++)
      this.layers[i]!.hidden = i !== this.index;
  }
  destroy(): void {
    this.stop();
    this.cache.clear();
  }
}
