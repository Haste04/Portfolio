import { StateMachine, browserClock, type State } from "./state.ts";
import { DragTracker, ClickTracker, PetRecognizer } from "./gestures.ts";
import {
  clamp,
  createBody,
  stepBody,
  releaseVelocity,
  springProgress,
  type Bounds,
} from "./physics.ts";
import { Inactivity, type SleepStage } from "./idle.ts";
import { CharacterView } from "./transitions.ts";
import { chooseTier, readCapabilities, type Tier } from "./capabilities.ts";
import type { AssetId } from "./assets.ts";

const physical = new Set<State>([
  "dragging",
  "airborne",
  "bouncing",
  "settling",
  "returning",
]);
const sleeping = new Set<State>(["sleepy", "yawning", "sleeping", "waking"]);
type Geometry = {
  bounds: Bounds;
  x: number;
  y: number;
  left: number;
  top: number;
  width: number;
  height: number;
  size: number;
};
/** One owner for state, DOM movement, event listeners, timers and active frame work. */
export class MascotController {
  private host: HTMLElement;
  private actor: HTMLButtonElement;
  private playground: HTMLElement;
  private dock: HTMLElement;
  private pending: HTMLElement;
  private docks: HTMLElement[];
  private view: CharacterView;
  private machine = new StateMachine();
  private idle: Inactivity;
  private drag = new DragTracker();
  private clicks = new ClickTracker();
  private pet = new PetRecognizer();
  private events = new AbortController();
  private observers: (
    IntersectionObserver | ResizeObserver | MutationObserver
  )[] = [];
  private tier: Tier = chooseTier(readCapabilities());
  private paused = false;
  private visible = false;
  private entered = false;
  private bedtime = false;
  private bedtimeDone = false;
  private contactAsleep = false;
  private geometry: Geometry = {
    bounds: { minX: 4, maxX: 4, minY: 4, maxY: 4 },
    x: 4,
    y: 4,
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    size: 0,
  };
  private x = 0;
  private y = 0;
  private frame = 0;
  private pointer: number | null = null;
  private offset = { x: 0, y: 0 };
  private suppressClick = false;
  private attentionTimer: number | undefined;
  private lastPet = -Infinity;
  private slowFrames = 0;
  private observedFrames = 0;
  private destroyed = false;
  constructor(host: HTMLElement) {
    this.host = host;
    this.actor = host.querySelector<HTMLButtonElement>("[data-fresh-actor]")!;
    this.playground = host.querySelector<HTMLElement>(".fresh-playground")!;
    this.dock = host.closest<HTMLElement>("[data-fresh-dock]")!;
    this.pending = this.dock;
    this.docks = [
      ...document.querySelectorAll<HTMLElement>("[data-fresh-dock]"),
    ];
    this.view = new CharacterView(host, this.actor);
    this.idle = new Inactivity(browserClock, (stage) => this.sleep(stage));
    this.host.dataset.ready = "true";
    this.actor.disabled = false;
    this.bind();
    this.measure();
    this.observe();
    this.syncPolicy();
    this.syncSection();
  }
  private state(): void {
    if (this.host.dataset.state !== this.machine.state)
      this.host.dataset.state = this.machine.state;
  }
  private active(): boolean {
    return !this.paused && !document.hidden && this.visible && !this.destroyed;
  }
  private motion(): boolean {
    return this.active() && this.tier !== "C";
  }
  private measure(): void {
    const rect = this.playground.getBoundingClientRect();
    const hero = this.dock.dataset.freshSection === "home";
    const size = Math.max(
      50,
      Math.min(rect.width * (hero ? 0.72 : 0.86), rect.height - 12),
    );
    const bounds = {
      minX: 4,
      maxX: Math.max(4, rect.width - size - 4),
      minY: 4,
      maxY: Math.max(4, rect.height - size - 4),
    };
    this.geometry = {
      bounds,
      x: (bounds.maxX + 4) / 2,
      y: Math.max(4, bounds.maxY - (hero ? 20 : 0)),
      left: rect.left + scrollX,
      top: rect.top + scrollY,
      width: rect.width,
      height: rect.height,
      size,
    };
    this.view.setSize(size);
    this.position(this.geometry.x, this.geometry.y);
  }
  private position(x: number, y: number, rotation = 0): void {
    this.x = clamp(x, this.geometry.bounds.minX, this.geometry.bounds.maxX);
    this.y = clamp(y, this.geometry.bounds.minY, this.geometry.bounds.maxY);
    this.view.position(this.x, this.y, rotation);
  }
  private bind(): void {
    const signal = this.events.signal;
    this.actor.addEventListener("dragstart", (e) => e.preventDefault(), {
      signal,
    });
    this.actor.addEventListener("pointerdown", (e) => this.down(e), { signal });
    window.addEventListener("pointermove", (e) => this.move(e), {
      signal,
      passive: true,
    });
    window.addEventListener("pointerup", (e) => this.up(e), { signal });
    window.addEventListener(
      "pointercancel",
      (e) => {
        if (e.pointerId === this.pointer) this.reset();
      },
      { signal },
    );
    this.actor.addEventListener(
      "lostpointercapture",
      (e) => {
        if (e.pointerId === this.pointer) this.reset();
      },
      { signal },
    );
    this.actor.addEventListener(
      "click",
      (e) => {
        if (this.suppressClick && e.detail !== 0) {
          this.suppressClick = false;
          return;
        }
        // A click or tap on his head pets him: the same pet picture and bounce the Pet button used to give.
        // Keyboard activation has detail 0 and keeps saying hello; keyboard petting is the P key below.
        if (e.detail !== 0 && this.view.headHit(e.clientX, e.clientY)) {
          this.interact("pet");
          return;
        }
        this.interact("click");
      },
      { signal },
    );
    this.actor.addEventListener(
      "keydown",
      (e) => {
        if (
          (e.key === "p" || e.key === "P") &&
          !e.ctrlKey &&
          !e.metaKey &&
          !e.altKey
        ) {
          e.preventDefault();
          this.interact("pet");
        }
      },
      { signal },
    );
    // Pointer cursor over his head so people can discover it.
    this.actor.addEventListener(
      "pointermove",
      (e) => {
        if (e.pointerType !== "mouse" || e.buttons !== 0) return;
        const over = this.view.headHit(e.clientX, e.clientY);
        if (over !== (this.actor.dataset.head === "true"))
          this.actor.dataset.head = String(over);
      },
      { signal, passive: true },
    );
    this.actor.addEventListener(
      "pointerleave",
      () => {
        delete this.actor.dataset.head;
      },
      { signal },
    );
    window.addEventListener(
      "keydown",
      (e) => {
        if (e.key === "Escape" && physical.has(this.machine.state)) {
          e.preventDefault();
          this.reset();
        }
      },
      { signal },
    );
    document.addEventListener("visibilitychange", () => this.syncPolicy(), {
      signal,
    });
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    reduced.addEventListener(
      "change",
      () => {
        this.tier = chooseTier(readCapabilities());
        if (this.tier === "C") {
          this.stopAction();
          if (this.dock.dataset.freshSection === "contact")
            this.bedtimeDone = false;
        }
        this.syncPolicy();
      },
      { signal },
    );
    window.addEventListener(
      "resize",
      () => {
        if (physical.has(this.machine.state)) this.reset();
        this.measure();
      },
      { signal, passive: true },
    );
    document.addEventListener("focusin", (e) => this.technologyAttention(e), {
      signal,
    });
    document.addEventListener("click", (e) => this.technologyAttention(e), {
      signal,
    });
    window.addEventListener("pagehide", () => this.destroy(), { signal });
    document.addEventListener("astro:before-swap", () => this.destroy(), {
      signal,
    });
  }
  private observe(): void {
    const visible = new IntersectionObserver(
      (entries) => {
        const entry = entries.at(-1);
        if (!entry) return;
        this.visible = entry.isIntersecting && entry.intersectionRatio > 0.05;
        this.syncPolicy();
      },
      { threshold: [0, 0.05, 0.2] },
    );
    visible.observe(this.playground);
    this.observers.push(visible);
    const navigation = document.querySelector(".desktop-navigation");
    if (navigation) {
      const current = new MutationObserver(() => this.syncSection());
      current.observe(navigation, {
        attributes: true,
        subtree: true,
        attributeFilter: ["aria-current"],
      });
      this.observers.push(current);
    }
    const projects = new IntersectionObserver(() => this.syncSection(), {
      rootMargin: "-15% 0px -20% 0px",
      threshold: [0, 0.3, 0.7],
    });
    for (const dock of this.docks.filter((d) =>
      d.dataset.freshDock?.startsWith("project-"),
    ))
      projects.observe(dock);
    this.observers.push(projects);
    const size = new ResizeObserver(() => {
      const rect = this.playground.getBoundingClientRect();
      if (
        Math.abs(rect.width - this.geometry.width) > 1 ||
        Math.abs(rect.height - this.geometry.height) > 1
      ) {
        if (physical.has(this.machine.state)) this.reset();
        this.measure();
      }
    });
    size.observe(this.playground);
    this.observers.push(size);
  }
  private syncSection(): void {
    const section =
      document
        .querySelector('.desktop-navigation [aria-current="location"]')
        ?.getAttribute("href")
        ?.slice(1) ?? "home";
    let dock = this.docks.find((d) => d.dataset.freshDock === section);
    if (section === "projects") {
      const candidates = this.docks
        .filter((d) => d.dataset.freshSection === "projects")
        .map((d) => ({ d, r: d.getBoundingClientRect() }))
        .filter(
          ({ r }) =>
            r.top < innerHeight * 0.85 && r.bottom > innerHeight * 0.15,
        );
      dock =
        candidates.sort(
          (a, b) =>
            Math.abs(a.r.top - innerHeight * 0.5) -
            Math.abs(b.r.top - innerHeight * 0.5),
        )[0]?.d ?? dock;
    }
    if (dock) this.moveTo(dock);
  }
  private moveTo(next: HTMLElement): void {
    if (
      next === this.pending &&
      (next === this.dock || this.machine.state === "section-transitioning")
    )
      return;
    this.pending = next;
    if (physical.has(this.machine.state)) return;
    if (
      this.dock.dataset.freshSection === "contact" &&
      next.dataset.freshSection !== "contact"
    )
      this.contactAsleep = false;
    // Physical work keeps its stage until completion; offscreen suspension may cancel it.
    this.stopAction();
    this.idle.pause();
    this.bedtime = false;
    this.bedtimeDone = false;
    const key = this.machine.start("section-transitioning");
    if (key === null) return;
    this.state();
    this.host.style.opacity = "0";
    this.machine.after(key, this.motion() ? 110 : 0, () => {
      const focused = this.host.contains(document.activeElement)
        ? (document.activeElement as HTMLElement)
        : null;
      this.dock = this.pending;
      this.dock.append(this.host);
      this.host.dataset.currentSection =
        this.dock.dataset.freshSection ?? "home";
      this.host.dataset.dock = this.dock.dataset.freshDock ?? "home";
      this.measure();
      this.view.motion = this.motion();
      void this.view.show(this.restingPose());
      const rect = this.playground.getBoundingClientRect();
      this.visible = rect.bottom > 90 && rect.top < innerHeight;
      this.host.style.opacity = "1";
      focused?.focus({ preventScroll: true });
      this.machine.after(key, this.motion() ? 140 : 0, () => {
        this.machine.finish(key);
        this.state();
        this.syncPolicy();
      });
    });
  }
  private restingPose(): AssetId {
    switch (this.dock.dataset.freshSection) {
      case "about":
      case "education":
      case "projects":
        return "peeking";
      case "tech-stack":
        return "curious-lean";
      case "experience":
        return "judgmental-side-eye";
      default:
        return "default-sitting";
    }
  }
  private syncPolicy(): void {
    if (this.destroyed) return;
    this.host.dataset.tier = this.tier;
    this.host.dataset.paused = String(!this.active());
    this.host.dataset.visible = String(this.visible);
    this.view.motion = this.motion();
    this.view.intensity = this.tier === "A" ? 1 : 0.65;
    const hint = document.querySelector<HTMLElement>("[data-fresh-hint]");
    if (hint)
      hint.textContent =
        this.tier === "C"
          ? "Say hello, or click his head for a gentle reaction."
          : readCapabilities().coarse
            ? "Tap to say hello. Tap his head for a gentle reaction."
            : "Say hello. Click his head. Try a little toss.";
    if (!this.active()) {
      if (this.bedtime && !this.contactAsleep) this.bedtimeDone = false;
      this.stopAction();
      this.idle.pause();
      this.host.style.opacity = "1";
      this.position(this.geometry.x, this.geometry.y);
      if (this.pending !== this.dock) this.moveTo(this.pending);
      return;
    }
    if (this.machine.state === "section-transitioning") return;
    if (this.dock.dataset.freshSection === "home" && !this.entered) {
      this.entrance();
      return;
    }
    if (this.dock.dataset.freshSection === "contact" && !this.bedtimeDone) {
      this.bedtimeSequence();
      return;
    }
    if (this.machine.state === "idle") this.rest(false);
  }
  private stopAction(): void {
    if (this.frame) cancelAnimationFrame(this.frame);
    this.frame = 0;
    this.host.dataset.frameActive = "false";
    this.machine.cancel();
    this.view.stop();
    this.pet.reset();
    if (this.attentionTimer !== undefined) clearTimeout(this.attentionTimer);
    this.attentionTimer = undefined;
    this.releasePointer();
    this.bedtime = false;
    this.state();
  }
  private releasePointer(): void {
    const pointer = this.pointer;
    this.pointer = null;
    if (pointer !== null && this.actor.hasPointerCapture(pointer))
      this.actor.releasePointerCapture(pointer);
  }
  private rest(resetClock = true): void {
    this.machine.cancel();
    this.state();
    this.view.attention();
    if (resetClock) {
      this.contactAsleep = false;
      this.idle.reset();
    }
    if (this.pending !== this.dock) {
      this.moveTo(this.pending);
      return;
    }
    this.position(this.geometry.x, this.geometry.y);
    const contactSleep =
      this.contactAsleep && this.dock.dataset.freshSection === "contact";
    const stage = !resetClock
      ? contactSleep
        ? "sleeping"
        : this.idle.stage
      : null;
    if (stage) {
      if (this.active()) {
        this.sleep(stage);
        if (contactSleep) this.idle.pause();
        else this.idle.resume();
      } else {
        this.idle.pause();
        void this.view.show(stage === "sleeping" ? "sleeping-curl" : "sleepy");
      }
      return;
    }
    void this.view.show(this.restingPose());
    if (!this.active()) {
      this.idle.pause();
      return;
    }
    if (!resetClock) this.idle.resume();
    const key = this.machine.start("idle");
    this.state();
    if (key !== null && this.motion())
      this.machine.after(key, 12000 + Math.random() * 7000, () => {
        const curious = this.machine.start("curious");
        if (curious === null) return;
        this.state();
        void this.view.show("curious-lean");
        this.machine.after(curious, 1200, () => {
          this.machine.finish(curious);
          this.rest(false);
        });
      });
  }
  private entrance(): void {
    this.entered = true;
    if (!this.motion()) {
      this.rest();
      return;
    }
    const key = this.machine.start("entering");
    if (key === null) return;
    this.state();
    this.idle.pause();
    this.view.preload(["default-sitting", "jumping"]);
    void this.view.show("sitting-in-container");
    this.view.cue("dip");
    this.machine.after(key, 650, () => {
      void this.view.show("jumping");
      this.view.cue("bounce");
    });
    this.machine.after(key, 1100, () => {
      void this.view.show("default-sitting");
    });
    this.machine.after(key, 1550, () => {
      this.machine.finish(key);
      this.rest();
    });
  }
  private interact(kind: "click" | "pet"): void {
    if (physical.has(this.machine.state)) return;
    if (this.bedtime || sleeping.has(this.machine.state)) {
      this.wake(kind);
      return;
    }
    const pose =
      kind === "pet" ? "happy-content" : this.clicks.click(performance.now());
    if (!pose) return;
    const key = this.machine.start(kind === "pet" ? "petting" : "reacting");
    if (key === null) return;
    this.contactAsleep = false;
    this.idle.reset();
    this.idle.pause();
    this.view.stop();
    this.state();
    this.view.motion = this.motion();
    void this.view.show(pose);
    this.view.cue(pose === "annoyed" ? "shake" : "bounce");
    this.announce(
      kind === "pet"
        ? "Mr. Fresh approves of the attention."
        : pose === "paw-swipe"
          ? "Mr. Fresh would like a little space."
          : pose === "annoyed"
            ? "Mr. Fresh is getting annoyed."
            : "You surprised Mr. Fresh.",
    );
    this.machine.after(key, pose === "paw-swipe" ? 1500 : 1200, () => {
      this.machine.finish(key);
      this.rest();
    });
  }
  private wake(kind: "click" | "pet"): void {
    this.stopAction();
    this.bedtimeDone = true;
    this.contactAsleep = false;
    this.idle.reset();
    this.idle.pause();
    const key = this.machine.start("waking");
    if (key === null) return;
    this.state();
    void this.view.show("neutral-relaxed");
    this.view.cue("wake");
    this.announce("Mr. Fresh is awake.");
    this.machine.after(key, this.motion() ? 650 : 0, () => {
      this.machine.finish(key);
      this.rest();
      if (kind === "pet") this.interact("pet");
    });
  }
  private sleep(stage: SleepStage): void {
    if (!this.active() || this.bedtime || physical.has(this.machine.state))
      return;
    const key = this.machine.start(stage);
    if (key === null) return;
    this.view.stop();
    this.state();
    void this.view.show(stage === "sleeping" ? "sleeping-curl" : stage);
    if (stage === "yawning") {
      this.view.cue("wake");
      this.machine.after(key, 1400, () => {
        this.machine.advance(key, "sleepy");
        this.state();
        void this.view.show("sleepy");
      });
    }
  }
  private bedtimeSequence(): void {
    this.stopAction();
    this.bedtime = true;
    this.bedtimeDone = true;
    this.contactAsleep = false;
    this.idle.pause();
    if (!this.motion()) {
      this.contactAsleep = true;
      this.machine.start("sleeping");
      this.state();
      void this.view.show("sleeping-curl");
      this.bedtime = false;
      return;
    }
    const key = this.machine.start("entering");
    if (key === null) return;
    this.state();
    void this.view.show("walking");
    this.view.cue("walk");
    this.view.preload(["stretching"]);
    this.machine.after(key, 950, () => {
      void this.view.show("stretching");
      this.view.preload(["yawning"]);
    });
    this.machine.after(key, 2050, () => {
      void this.view.show("yawning");
      this.view.preload(["sleeping-curl"]);
    });
    this.machine.after(key, 3250, () => {
      this.contactAsleep = true;
      this.machine.advance(key, "sleeping");
      this.state();
      this.bedtime = false;
      void this.view.show("sleeping-curl");
    });
  }
  private down(e: PointerEvent): void {
    if (!e.isPrimary || e.button !== 0 || this.pointer !== null) return;
    this.suppressClick = false;
    this.pointer = e.pointerId;
    this.pet.reset();
    this.drag.begin(e.clientX, e.clientY, performance.now(), e.pointerType);
    const rect = this.playground.getBoundingClientRect();
    this.geometry.left = rect.left + scrollX;
    this.geometry.top = rect.top + scrollY;
    this.offset = {
      x: e.clientX + scrollX - this.geometry.left - this.x,
      y: e.clientY + scrollY - this.geometry.top - this.y,
    };
  }
  private move(e: PointerEvent): void {
    if (this.pointer === e.pointerId && e.buttons !== 0) {
      const result = this.drag.move(e.clientX, e.clientY, performance.now());
      if (result === "scrolling") {
        this.suppressClick = true;
        return;
      }
      if (result === "dragging") {
        this.suppressClick = true;
        if (e.pointerType === "touch" || this.tier === "C" || !this.active())
          return;
        if (this.machine.state !== "dragging") {
          const key = this.machine.start("dragging");
          if (key === null) return;
          this.contactAsleep = false;
          this.idle.reset();
          this.idle.pause();
          this.view.stop();
          this.bedtime = false;
          this.bedtimeDone = true;
          this.state();
          this.actor.setPointerCapture(e.pointerId);
          void this.view.show("default-sitting");
        }
        this.position(
          e.clientX + scrollX - this.geometry.left - this.offset.x,
          e.clientY + scrollY - this.geometry.top - this.offset.y,
        );
      }
      return;
    }
    if (
      e.pointerType === "touch" ||
      e.buttons ||
      !this.active() ||
      physical.has(this.machine.state)
    )
      return;
    // Event-driven geometry read, never inside a physics frame.
    const rect = this.actor.getBoundingClientRect();
    const inside =
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom;
    if (
      this.pet.move(e.clientX, e.clientY, performance.now(), inside) &&
      performance.now() - this.lastPet > 1000
    ) {
      this.lastPet = performance.now();
      this.interact("pet");
      return;
    }
    if (this.machine.state !== "idle" && this.machine.state !== "curious")
      return;
    const near =
      Math.hypot(
        e.clientX - (rect.left + rect.width / 2),
        e.clientY - (rect.top + rect.height / 2),
      ) <
      rect.width * 0.9;
    if (near && this.motion()) {
      this.view.attention(
        clamp(
          ((e.clientX - rect.left - rect.width / 2) / rect.width) * 16,
          -8,
          8,
        ) * this.view.intensity,
        -2 * this.view.intensity,
      );
      if (this.machine.state === "idle") {
        const key = this.machine.start("curious");
        if (key !== null) {
          this.state();
          void this.view.show("curious-lean");
        }
      }
      if (this.attentionTimer !== undefined) clearTimeout(this.attentionTimer);
      this.attentionTimer = window.setTimeout(() => {
        this.attentionTimer = undefined;
        if (this.machine.state === "curious") this.rest(false);
      }, 1100);
    } else this.view.attention();
  }
  private up(e: PointerEvent): void {
    if (e.pointerId !== this.pointer) return;
    const result = this.drag.end();
    const wasDragging = this.machine.state === "dragging";
    this.suppressClick = !result.click;
    this.releasePointer();
    if (wasDragging) {
      if (this.pending !== this.dock) {
        this.stopAction();
        this.moveTo(this.pending);
        return;
      }
      this.launch(
        releaseVelocity(
          result.samples,
          performance.now(),
          this.tier === "A" ? 1100 : 800,
        ),
      );
    }
  }
  private launch(velocity: { x: number; y: number }): void {
    // Keep the drag operation's epoch, so no lower-priority task can replace it.
    const key = this.machine.start("dragging");
    if (key === null) return;
    this.machine.advance(key, "airborne");
    this.state();
    void this.view.show("falling-tossed");
    let body = createBody(this.x, this.y, velocity),
      last = performance.now();
    const start = last;
    const tick = (now: number): void => {
      this.frame = 0;
      if (!this.machine.valid(key) || !this.active()) return;
      const delta = now - last;
      last = now;
      this.observeFrame(delta);
      if (this.tier === "C") {
        this.host.dataset.frameActive = "false";
        this.machine.finish(key);
        this.rest();
        return;
      }
      body = stepBody(
        body,
        this.geometry.bounds,
        delta / 1000,
        this.tier === "A" ? 0.52 : 0.45,
      );
      if (now - start >= 6000) body.settled = true;
      this.position(body.x, body.y, body.angle);
      if (body.bounces > 0) this.machine.advance(key, "bouncing");
      this.state();
      if (body.settled) {
        this.host.dataset.frameActive = "false";
        this.machine.advance(key, "settling");
        this.state();
        void this.view.show("default-sitting");
        this.machine.after(key, 1000, () => this.returnToAnchor(key));
        return;
      }
      this.frame = requestAnimationFrame(tick);
      this.host.dataset.frameActive = "true";
    };
    this.frame = requestAnimationFrame(tick);
    this.host.dataset.frameActive = "true";
  }
  private returnToAnchor(key: number): void {
    if (!this.machine.advance(key, "returning")) return;
    this.state();
    if (!this.motion()) {
      this.machine.finish(key);
      this.rest();
      return;
    }
    const start = performance.now(),
      fromX = this.x,
      fromY = this.y;
    const tick = (now: number): void => {
      this.frame = 0;
      if (!this.machine.valid(key) || !this.active()) return;
      const t = Math.min(1, (now - start) / 780),
        progress = springProgress(t);
      this.position(
        fromX + (this.geometry.x - fromX) * progress,
        fromY + (this.geometry.y - fromY) * progress,
      );
      if (t >= 1) {
        this.host.dataset.frameActive = "false";
        this.machine.finish(key);
        this.rest();
        return;
      }
      this.frame = requestAnimationFrame(tick);
      this.host.dataset.frameActive = "true";
    };
    this.frame = requestAnimationFrame(tick);
    this.host.dataset.frameActive = "true";
  }
  private observeFrame(delta: number): void {
    this.observedFrames++;
    if (delta > 34) this.slowFrames++;
    if (this.observedFrames >= 60) {
      if (this.slowFrames / this.observedFrames > 0.35) {
        this.tier = this.tier === "A" ? "B" : "C";
        this.host.dataset.tier = this.tier;
        this.view.motion = this.motion();
      }
      this.observedFrames = this.slowFrames = 0;
    }
  }
  private technologyAttention(e: Event): void {
    if (
      this.dock.dataset.freshSection !== "tech-stack" ||
      !this.active() ||
      physical.has(this.machine.state)
    )
      return;
    if (
      !(e.target instanceof Element) ||
      !e.target.closest("[data-technology]")
    )
      return;
    const key = this.machine.start("reacting");
    if (key === null) return;
    this.idle.reset();
    this.idle.pause();
    this.view.stop();
    this.state();
    void this.view.show(e.type === "click" ? "paw-swipe" : "curious-lean");
    this.machine.after(key, 800, () => {
      this.machine.finish(key);
      this.rest();
    });
  }
  private reset(): void {
    this.suppressClick = true;
    this.stopAction();
    this.bedtimeDone = true;
    if (this.pending !== this.dock) this.moveTo(this.pending);
    else this.rest();
  }
  private announce(text: string): void {
    const status = this.host.querySelector<HTMLElement>("[data-fresh-status]");
    if (status) status.textContent = text;
  }
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.stopAction();
    this.idle.destroy();
    this.machine.destroy();
    this.view.destroy();
    this.events.abort();
    for (const observer of this.observers) observer.disconnect();
    this.observers = [];
    this.host.dataset.ready = "false";
    this.host.dataset.paused = "true";
  }
}
let controller: MascotController | undefined;
export function initMascot(): void {
  const host = document.getElementById("fresh-companion");
  if (!host || host.dataset.ready === "true") return;
  controller?.destroy();
  controller = new MascotController(host);
}
