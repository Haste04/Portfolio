import { gsap } from "gsap";
import { motionPolicy, preferences } from "../motion/policy";

/**
 * Scroll-scrubbed About entrances.
 *
 * Progress is derived from scrollY and measured entry geometry only. Nothing in this module may
 * WRITE the scroll position. With `html{scroll-behavior:smooth}`, any scripted scroll write
 * (e.g. ScrollTrigger.refresh(), which resets every scroller to 0 and then restores it) starts a
 * competing smooth scroll that cancels the visitor's in-flight Back to Top / anchor / wheel scroll
 * and strands them mid-page (the Education boundary). Measuring layout is read-only and safe.
 */
export interface AboutSlides {
  render(): void;
  suspend(): void;
  resume(): void;
  refresh(): void;
  destroy(): void;
}
interface Slide {
  entry: HTMLElement;
  tween: gsap.core.Tween;
  start: number;
  end: number;
  progress: number;
}

gsap.config({ autoSleep: 1 });

export function createAboutSlides(root: HTMLElement): AboutSlides {
  const panels = [...root.querySelectorAll<HTMLElement>(".photo-story")],
    slides: Slide[] = [];
  let running = true,
    destroyed = false;
  const context = gsap.context(() => {}, root);
  const distance = (panel: HTMLElement) => {
    const width = panel.offsetWidth,
      tier = motionPolicy(preferences(false)).tier;
    if (innerWidth >= 1024) return width * (tier === "light" ? 0.55 : 0.62);
    if (innerWidth >= 640) return Math.min(width * 0.36, innerWidth * 0.32);
    return Math.min(width * 0.24, innerWidth * 0.22);
  };
  /** Same range the ScrollTrigger used: 'top <viewport height>' -> 'top <55% of viewport height>'. */
  function measure() {
    for (const slide of slides) {
      const top = slide.entry.getBoundingClientRect().top + scrollY;
      slide.start = top - innerHeight;
      slide.end = top - innerHeight * 0.55;
      slide.tween.invalidate(); // re-evaluate the viewport-dependent travel distance on next render
      slide.progress = -1; // force the next render() to apply it
    }
  }
  function render() {
    if (!running || destroyed) return;
    for (const slide of slides) {
      const span = slide.end - slide.start;
      const progress =
        span > 0 ? Math.min(1, Math.max(0, (scrollY - slide.start) / span)) : 1;
      if (progress !== slide.progress) {
        slide.progress = progress;
        slide.tween.totalProgress(progress);
      }
    }
  }
  function refresh() {
    if (!running || destroyed) return;
    measure();
    render();
  }
  try {
    context.add(() =>
      panels.forEach((panel, index) => {
        const entry = panel.closest<HTMLElement>("[data-about-entry]");
        if (!entry) return;
        const tween = gsap.fromTo(
          panel,
          {
            x: () => distance(panel) * (index % 2 === 0 ? 1 : -1),
            opacity: 0.35,
          },
          {
            x: 0,
            opacity: 1,
            ease: "none",
            duration: 1,
            force3D: false,
            paused: true,
          },
        );
        slides.push({ entry, tween, start: 0, end: 1, progress: -1 });
      }),
    );
    measure();
    render();
  } catch (error) {
    context.revert();
    throw error;
  }
  return {
    render,
    suspend() {
      running = false;
    },
    resume() {
      if (!destroyed && !running) {
        running = true;
        refresh();
      }
    },
    refresh,
    destroy() {
      if (destroyed) return;
      destroyed = true;
      context.revert();
      slides.length = 0;
    },
  };
}
