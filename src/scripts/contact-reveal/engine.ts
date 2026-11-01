export interface ContactReveal {
  render(): void;
  suspend(): void;
  resume(): void;
  refresh(): void;
  settle(): void;
  unsettle(): void;
  destroy(): void;
}

type ItemKind = 'heading' | 'intro' | 'links' | 'mascot';

interface ItemSpec {
  el: HTMLElement;
  kind: ItemKind;
  start: number;
  end: number;
}

const WINDOWS: Record<ItemKind, { start: number; end: number }> = {
  heading: { start: 0, end: 0.28 },
  intro: { start: 0.18, end: 0.46 },
  links: { start: 0.36, end: 0.64 },
  mascot: { start: 0.54, end: 1 },
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function localProgress(progress: number, start: number, end: number): number {
  if (end <= start) return progress >= end ? 1 : 0;
  return clamp((progress - start) / (end - start), 0, 1);
}

export function createContactReveal(root: HTMLElement): ContactReveal {
  const heading = root.querySelector<HTMLElement>('.section-heading');
  const intro = root.querySelector<HTMLElement>('.section-introduction');
  const links = root.querySelector<HTMLElement>('.contact-main');
  const mascot = root.querySelector<HTMLElement>('.resting-stage');
  if (!heading || !intro || !links || !mascot) {
    throw new Error('Contact reveal targets missing');
  }

  heading.setAttribute('data-contact-item', 'heading');
  intro.setAttribute('data-contact-item', 'intro');
  links.setAttribute('data-contact-item', 'links');
  mascot.setAttribute('data-contact-item', 'mascot');

  const items: ItemSpec[] = [
    { el: heading, kind: 'heading', ...WINDOWS.heading },
    { el: intro, kind: 'intro', ...WINDOWS.intro },
    { el: links, kind: 'links', ...WINDOWS.links },
    { el: mascot, kind: 'mascot', ...WINDOWS.mascot },
  ];

  let running = true;
  let destroyed = false;
  let settled = false;

  function progressFromScroll(): number {
    const rect = root.getBoundingClientRect();
    const start = innerHeight * 0.92;
    const end = innerHeight * 0.28;
    return clamp((start - rect.top) / (start - end), 0, 1);
  }

  function apply(progress: number): void {
    root.dataset.contactProgress = progress.toFixed(3);
    const locals: Record<string, number> = {};
    for (const item of items) {
      const local = localProgress(progress, item.start, item.end);
      locals[item.kind] = local;
      item.el.style.opacity = String(local);
      if (item.kind === 'mascot') {
        item.el.style.removeProperty('transform');
      } else {
        item.el.style.transform = `translateY(${(1 - local) * 24}px)`;
      }
    }
    // #region agent log
    fetch('http://127.0.0.1:7629/ingest/985cb880-9aaf-469c-9afb-ae819edc9274',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e2f8c4'},body:JSON.stringify({sessionId:'e2f8c4',runId:'pre-fix',hypothesisId:'A,B',location:'contact-reveal/engine.ts:apply',message:'contact reveal apply',data:{progress,top:root.getBoundingClientRect().top,vh:innerHeight,locals,kinds:items.map(i=>i.kind)},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
  }

  function clearStyles(): void {
    delete root.dataset.contactProgress;
    for (const item of items) {
      item.el.style.removeProperty('opacity');
      item.el.style.removeProperty('transform');
    }
  }

  function render(): void {
    if (!running || destroyed) return;
    if (settled || root.contains(document.activeElement)) {
      settled = true;
      apply(1);
      return;
    }
    apply(progressFromScroll());
  }

  return {
    render,
    suspend() {
      running = false;
    },
    resume() {
      if (destroyed) return;
      running = true;
      // Recompute from current scroll — never restart from zero.
      render();
    },
    refresh() {
      if (destroyed) return;
      if (!running) return;
      render();
    },
    settle() {
      if (destroyed) return;
      settled = true;
      apply(1);
    },
    unsettle() {
      if (destroyed) return;
      if (root.contains(document.activeElement)) return;
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
