import { motionPolicy, preferences } from '../motion/policy';
import type { ContactReveal } from './engine';

let dispose: (() => void) | undefined;

/**
 * Scroll-progress Contact reveal. Sequence: heading → intro → links → mascot.
 * Independent of About's GSAP/ScrollTrigger engine.
 */
export function initContactReveal(): void {
  dispose?.();
  const section = document.querySelector<HTMLElement>('#contact');
  if (!section) return;
  const root = section;

  const abort = new AbortController();
  const signal = abort.signal;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false;
  let destroyed = false;
  let failed = false;
  let pending = false;
  let frame = 0;
  let renderFrame = 0;
  let engine: ContactReveal | undefined;

  const paused = (): boolean =>
    document.querySelector('[data-fresh-pause]')?.getAttribute('aria-pressed') === 'true';

  function showFull(): void {
    engine?.destroy();
    engine = undefined;
    delete root.dataset.contactProgress;
    for (const el of root.querySelectorAll<HTMLElement>('[data-contact-item]')) {
      el.style.removeProperty('opacity');
      el.style.removeProperty('transform');
    }
  }

  function attachEngine(module: { createContactReveal: (node: HTMLElement) => ContactReveal }): void {
    if (engine || destroyed) return;
    engine = module.createContactReveal(root);
    engine.render();
  }

  function sync(): void {
    if (destroyed) return;
    const policy = motionPolicy(preferences(paused()));

    if (policy.mode === 'reduced' || policy.mode === 'paused') {
      showFull();
      root.dataset.contactMotion = policy.mode;
      return;
    }

    if (policy.mode === 'hidden' || document.documentElement.hasAttribute('data-theme-revealing')) {
      engine?.suspend();
      root.dataset.contactMotion = 'suspended';
      return;
    }

    // Active motion: ensure engine exists even while offscreen so progress 0 can hide items.
    if (engine) {
      if (!visible) {
        engine.resume();
        engine.render();
        engine.suspend();
        root.dataset.contactMotion = 'offscreen';
        return;
      }
      engine.resume();
      root.dataset.contactMotion = 'active';
      return;
    }

    if (pending || failed) return;
    pending = true;
    import('./engine')
      .then((module) => {
        pending = false;
        if (destroyed) return;
        const current = motionPolicy(preferences(paused()));
        if (
          current.mode !== 'active' ||
          document.documentElement.hasAttribute('data-theme-revealing')
        ) {
          return;
        }
        attachEngine(module);
        if (!visible) {
          engine?.suspend();
          root.dataset.contactMotion = 'offscreen';
        } else {
          root.dataset.contactMotion = 'active';
        }
      })
      .catch(() => {
        pending = false;
        failed = true;
        if (!destroyed) {
          showFull();
          root.dataset.contactMotion = 'fallback';
        }
      });
  }

  function refresh(): void {
    frame = 0;
    sync();
    if (root.dataset.contactMotion === 'active' || root.dataset.contactMotion === 'offscreen') {
      engine?.refresh();
    }
  }

  const schedule = (): void => {
    if (!frame && !destroyed) frame = requestAnimationFrame(refresh);
  };

  const observer = new IntersectionObserver((entries) => {
    visible = entries[0]?.isIntersecting ?? false;
    // #region agent log
    fetch('http://127.0.0.1:7629/ingest/985cb880-9aaf-469c-9afb-ae819edc9274',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'e2f8c4'},body:JSON.stringify({sessionId:'e2f8c4',runId:'pre-fix',hypothesisId:'D',location:'contact-reveal/controller.ts:io',message:'IO visibility sync',data:{visible,progress:root.dataset.contactProgress,motion:root.dataset.contactMotion},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    sync();
  }, { threshold: 0 });
  observer.observe(root);

  const resize = new ResizeObserver(schedule);
  resize.observe(root);

  const mutation = new MutationObserver(sync);
  mutation.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme-revealing'],
  });
  const button = document.querySelector('[data-fresh-pause]');
  if (button) {
    mutation.observe(button, { attributes: true, attributeFilter: ['aria-pressed'] });
  }

  root.addEventListener(
    'focusin',
    () => {
      if (destroyed) return;
      if (engine) engine.settle();
      else showFull();
    },
    { signal }
  );
  root.addEventListener(
    'click',
    () => {
      if (destroyed) return;
      if (engine) engine.settle();
      else showFull();
    },
    { signal }
  );
  root.addEventListener(
    'focusout',
    () => {
      queueMicrotask(() => {
        if (destroyed || root.contains(document.activeElement)) return;
        engine?.unsettle();
      });
    },
    { signal }
  );

  window.addEventListener('resize', schedule, { passive: true, signal });
  window.addEventListener(
    'scroll',
    () => {
      if (
        !renderFrame &&
        engine &&
        (root.dataset.contactMotion === 'active' || root.dataset.contactMotion === 'offscreen')
      ) {
        // Offscreen still updates on scroll so leaving/returning tracks progress without zero-restart.
        renderFrame = requestAnimationFrame(() => {
          renderFrame = 0;
          if (root.dataset.contactMotion === 'offscreen') {
            engine?.resume();
            engine?.render();
            engine?.suspend();
          } else {
            engine?.render();
          }
        });
      }
    },
    { passive: true, signal }
  );
  document.addEventListener('visibilitychange', sync, { signal });
  reduced.addEventListener('change', sync, { signal });
  document.fonts.ready.then(() => {
    if (!destroyed) schedule();
  });

  sync();

  dispose = () => {
    if (destroyed) return;
    destroyed = true;
    abort.abort();
    observer.disconnect();
    resize.disconnect();
    mutation.disconnect();
    cancelAnimationFrame(frame);
    cancelAnimationFrame(renderFrame);
    showFull();
    delete root.dataset.contactMotion;
    delete root.dataset.contactProgress;
  };

  window.addEventListener('pagehide', () => dispose?.(), { once: true, signal });
  document.addEventListener('astro:before-swap', () => dispose?.(), { once: true, signal });
}

window.addEventListener('pageshow', (event) => {
  if (event.persisted) initContactReveal();
});
