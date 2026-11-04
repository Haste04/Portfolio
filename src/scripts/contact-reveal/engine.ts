export interface ContactReveal {
  render(): void;
  suspend(): void;
  resume(): void;
  refresh(): void;
  settle(): void;
  unsettle(): void;
  destroy(): void;
}

/**
 * Pinned, scroll-scrubbed Contact reveal.
 *
 * Contact arrives blank and then LOCKS in place: the section itself becomes sticky (100svh) and an
 * empty spacer right after it supplies the scroll runway. While locked, scroll position alone drives five steps, in order:
 *
 *   1  "07 / Contact" label + heading      4  email + social links + résumé
 *   2  introduction                        5  Mr. Fresh
 *   3  "Start with a hello"
 *
 * Because Contact is taller than most screens, the content slides up during the lock (a "camera"
 * on the content container) so each newly revealed item stays in view. Backgrounds stay put.
 * Scroll stops => nothing moves. Scroll up => everything reverses, step by step.
 *
 * Rules this module follows:
 *  - It only READS layout/scroll. It never writes the scroll position: html{scroll-behavior:smooth}
 *    turns any scripted scroll write into a competing smooth scroll that cancels the visitor's own.
 *  - Geometry is measured with offsetTop (ignores CSS transforms), so animating an element can
 *    never move its own measurement.
 */
type ItemKind = "heading" | "intro" | "hello" | "links" | "mascot";

interface ItemSpec {
  els: HTMLElement[];
  kind: ItemKind;
  start: number;
  end: number;
  lift: boolean;
}

/** Reveal windows over reveal progress 0..1. A slim overlap keeps hand-offs continuous. */
const WINDOWS: Record<ItemKind, { start: number; end: number }> = {
  heading: { start: 0.05, end: 0.17 }, // blank -> heading
  intro: { start: 0.27, end: 0.39 }, // heading -> supporting sentence
  hello: { start: 0.49, end: 0.57 }, // supporting sentence -> "Start with a hello"
  links: { start: 0.65, end: 0.75 }, // hello -> email + social links
  mascot: { start: 0.85, end: 1 }, // links -> Mr. Fresh
};

/** How much scrolling the five reveals take, in stage heights ("about 2 screens"). */
const REVEAL_SCREENS = 4;
const BOTTOM_SPACE = 40;
/** Lift distance for text steps, in px. */
const LIFT = 28;

interface Key {
  p: number;
  cam: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function localProgress(progress: number, start: number, end: number): number {
  if (end <= start) return progress >= end ? 1 : 0;
  return clamp((progress - start) / (end - start), 0, 1);
}

/** Layout offset of `el` from `ancestor`'s top edge. Ignores transforms and sticky offsets. */
function offsetWithin(el: HTMLElement, ancestor: HTMLElement): number {
  let y = 0;
  let node: HTMLElement | null = el;
  while (node && node !== ancestor) {
    y += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }
  return y;
}

/** Keyboard focus (not a mouse click) settles the section so tabbing never lands on hidden content. */
function keyboardFocusInside(root: HTMLElement): HTMLElement | null {
  const active = document.activeElement;
  if (!(active instanceof HTMLElement) || !root.contains(active)) return null;
  try {
    return active.matches(":focus-visible") ? active : null;
  } catch {
    return active;
  }
}

export function createContactReveal(root: HTMLElement): ContactReveal {
  const runway =
    root.nextElementSibling instanceof HTMLElement &&
    root.nextElementSibling.hasAttribute("data-contact-runway")
      ? root.nextElementSibling
      : null;
  const container = root.querySelector<HTMLElement>(".content-container");
  const heading = root.querySelector<HTMLElement>(".section-heading");
  const marker = root.querySelector<HTMLElement>(".section-marker");
  const intro = root.querySelector<HTMLElement>(".section-introduction");
  const main = root.querySelector<HTMLElement>(".contact-main");
  const hello = root.querySelector<HTMLElement>(".contact-main .eyebrow");
  const email = root.querySelector<HTMLElement>(".contact-main .contact-email");
  const social = root.querySelector<HTMLElement>(
    ".contact-main .contact-links",
  );
  const mascot = root.querySelector<HTMLElement>(".resting-stage");
  if (
    !runway ||
    !container ||
    !heading ||
    !intro ||
    !main ||
    !hello ||
    !email ||
    !social ||
    !mascot
  ) {
    throw new Error("Contact reveal targets missing");
  }

  const groups: Array<{ kind: ItemKind; els: HTMLElement[]; lift: boolean }> = [
    {
      kind: "heading",
      els: marker ? [marker, heading] : [heading],
      lift: true,
    },
    { kind: "intro", els: [intro], lift: true },
    { kind: "hello", els: [hello], lift: true },
    { kind: "links", els: [email, social], lift: true },
    { kind: "mascot", els: [mascot], lift: false },
  ];
  const items: ItemSpec[] = groups.map((group) => {
    for (const el of group.els)
      el.setAttribute("data-contact-item", group.kind);
    return { ...group, ...WINDOWS[group.kind] };
  });

  let running = true;
  let destroyed = false;
  let settled = false;

  // Measured geometry (layout-only; refreshed on resize / fonts / size changes).
  let stageH = 0;
  let maxCam = 0;
  let revealPx = 0;
  let tailPx = 0;
  let endCam = 0;
  let keys: Key[] = [
    { p: 0, cam: 0 },
    { p: 1, cam: 0 },
  ];

  function measure(): void {
    const rootEl = root;
    const rel = (el: HTMLElement): number => offsetWithin(el, rootEl);
    stageH = rootEl.clientHeight || innerHeight;
    const contentH =
      rel(container as HTMLElement) +
      (container as HTMLElement).offsetHeight +
      BOTTOM_SPACE;
    maxCam = Math.max(0, contentH - stageH);

    const stageTop = rel(mascot as HTMLElement);
    const stageBottom = stageTop + (mascot as HTMLElement).offsetHeight;
    const mainBottom =
      rel(main as HTMLElement) + (main as HTMLElement).offsetHeight;
    const helloCenter =
      rel(hello as HTMLElement) + (hello as HTMLElement).offsetHeight / 2;

    // Pose per step: the camera offset that keeps that step's item comfortably in view.
    const c4 = clamp(mainBottom + stageH * 0.12 - stageH, 0, maxCam);
    const c3 = clamp(helloCenter - stageH * 0.6, 0, c4);
    // Final composition: Mr. Fresh together with the links if they fit on one screen, otherwise Mr. Fresh.
    const fitsTogether = mainBottom - stageTop <= stageH * 0.94;
    const focus = fitsTogether
      ? (stageTop + mainBottom) / 2
      : (stageTop + stageBottom) / 2;
    const c5 = clamp(focus - stageH / 2, 0, maxCam);

    keys = [
      { p: 0, cam: 0 },
      { p: WINDOWS.heading.end, cam: 0 },
      { p: WINDOWS.intro.end, cam: 0 },
      { p: WINDOWS.hello.end, cam: c3 },
      { p: WINDOWS.links.end, cam: c4 },
      { p: 1, cam: c5 },
    ];
    endCam = c5;
    revealPx = REVEAL_SCREENS * stageH;
    // After the reveal, a short tail brings the footer (© + Back to Top) into view.
    tailPx = Math.max(0, Math.ceil(maxCam - c5));
    (runway as HTMLElement).style.height = `${revealPx + tailPx}px`;
  }

  function cameraAt(p: number, t: number): number {
    if (p >= 1) return endCam + (maxCam - endCam) * t;
    for (let i = 1; i < keys.length; i++) {
      const a = keys[i - 1] as Key;
      const b = keys[i] as Key;
      if (p <= b.p) {
        const u = b.p === a.p ? 1 : (p - a.p) / (b.p - a.p);
        const eased = u * u * (3 - 2 * u);
        return a.cam + (b.cam - a.cam) * eased;
      }
    }
    return endCam;
  }

  function scrollState(): { p: number; t: number } {
    // The spacer is static (never stuck, never transformed) and the stage is exactly stageH tall, so the
    // section's natural top (where the lock begins) is the spacer's top minus the stage height.
    const pinStart =
      (runway as HTMLElement).getBoundingClientRect().top + scrollY - stageH;
    const s = scrollY - pinStart;
    const p = clamp(s / revealPx, 0, 1);
    const t =
      tailPx > 0 ? clamp((s - revealPx) / tailPx, 0, 1) : s >= revealPx ? 1 : 0;
    return { p, t };
  }

  function apply(progress: number, camera: number): void {
    root.dataset.contactProgress = progress.toFixed(3);
    root.dataset.contactCamera = camera.toFixed(1);
    (container as HTMLElement).style.transform =
      camera > 0 ? `translate3d(0, ${(-camera).toFixed(1)}px, 0)` : "none";
    for (const item of items) {
      const local = localProgress(progress, item.start, item.end);
      for (const el of item.els) {
        el.style.opacity = String(local);
        if (item.lift)
          el.style.transform = `translateY(${((1 - local) * LIFT).toFixed(2)}px)`;
        else el.style.removeProperty("transform");
      }
    }
  }

  function settledCamera(): number {
    const focused = keyboardFocusInside(root);
    if (!focused) return maxCam;
    const center = offsetWithin(focused, root) + focused.offsetHeight / 2;
    return clamp(center - stageH / 2, 0, maxCam);
  }

  function clearStyles(): void {
    delete root.dataset.contactProgress;
    delete root.dataset.contactCamera;
    (container as HTMLElement).style.removeProperty("transform");
    for (const item of items) {
      for (const el of item.els) {
        el.style.removeProperty("opacity");
        el.style.removeProperty("transform");
      }
    }
    (runway as HTMLElement).style.removeProperty("height");
    root.dataset.contactPin = "off";
  }

  function render(): void {
    if (!running || destroyed) return;
    if (settled || keyboardFocusInside(root)) {
      settled = true;
      apply(1, settledCamera());
      return;
    }
    const { p, t } = scrollState();
    apply(p, cameraAt(p, t));
  }

  // Engage the pinned layout first so measurement sees the real 100svh stage.
  root.dataset.contactPin = "on";
  measure();

  return {
    render,
    suspend() {
      running = false;
    },
    resume() {
      if (destroyed) return;
      running = true;
      // Recompute from the current scroll position, never restart from zero.
      render();
    },
    refresh() {
      if (destroyed) return;
      measure();
      if (running) render();
    },
    settle() {
      if (destroyed) return;
      settled = true;
      apply(1, settledCamera());
    },
    unsettle() {
      if (destroyed) return;
      if (keyboardFocusInside(root)) return;
      settled = false;
      if (running) render();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      running = false;
      settled = false;
      clearStyles();
    },
  };
}
