/** Progressive enhancement only: native anchors and disclosure work without this module. */
export function initNavigation(): void {
  const navigation = document.querySelector<HTMLElement>('[data-navigation]');
  const menu = document.querySelector<HTMLDetailsElement>('[data-mobile-menu]');
  const trigger = menu?.querySelector<HTMLElement>('summary');
  const sections = [...document.querySelectorAll<HTMLElement>('[data-section]')];
  if (!navigation || !menu || !trigger || sections.length === 0) return;

  const links = [...navigation.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')];
  const desktop = window.matchMedia('(min-width: 768px)');

  function setActive(id: string): void {
    for (const link of links) {
      if (link.hash === '#' + id) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    }
  }

  function updateActive(): void {
    const line = Math.floor(window.innerHeight * 0.35);
    const current = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2
      ? sections.at(-1)
      : sections.filter((section) => section.getBoundingClientRect().top <= line).at(-1) ?? sections[0];
    if (current) setActive(current.id);
  }

  function syncMenu(): void {
    trigger?.setAttribute('aria-expanded', String(menu?.open ?? false));
  }

  function closeMenu(restoreFocus = false): void {
    if (!menu) return;
    menu.open = false;
    syncMenu();
    if (restoreFocus) trigger?.focus({ preventScroll: true });
  }

  // Hide the navigation content only: active-section observers and the restore button stay available.
  const content = navigation.querySelector<HTMLElement>('[data-navigation-content]');
  const visibility = navigation.querySelector<HTMLButtonElement>('[data-navigation-visibility]');
  if (content && visibility) {
    let targetHidden = Boolean(content.hidden);
    let animation: Animation | undefined;
    let generation = 0;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const pause = document.querySelector<HTMLButtonElement>('[data-fresh-pause]');
    const allowsMotion = (): boolean => !reduced.matches && !document.hidden
      && pause?.getAttribute('aria-pressed') !== 'true';

    function settle(): void {
      generation++;
      animation?.cancel();
      animation = undefined;
      content!.hidden = targetHidden;
      content!.inert = targetHidden;
      if (targetHidden) content!.setAttribute('aria-hidden', 'true'); else content!.removeAttribute('aria-hidden');
      // Collapse the bar's space only after its exit, keeping Show available throughout.
      navigation!.dataset.navigationHidden = String(targetHidden);
      navigation!.dataset.navigationMotion = 'idle';
    }

    visibility.addEventListener('click', () => {
      const previous = animation ? {
        transform: getComputedStyle(content).transform,
        opacity: Number(getComputedStyle(content).opacity),
      } : undefined;
      const key = ++generation;
      animation?.cancel();
      animation = undefined;
      targetHidden = !targetHidden;
      if (targetHidden) {
        closeMenu();
        visibility.focus({ preventScroll: true });
      }
      content.inert = targetHidden;
      if (targetHidden) content.setAttribute('aria-hidden', 'true'); else content.removeAttribute('aria-hidden');
      visibility.setAttribute('aria-expanded', String(!targetHidden));
      visibility.setAttribute('aria-label', targetHidden ? 'Show navigation bar' : 'Hide navigation bar');
      const label = visibility.querySelector('[data-navigation-visibility-label]');
      if (label) label.textContent = targetHidden ? 'Show' : 'Hide';

      if (!allowsMotion() || typeof content.animate !== 'function') {
        settle();
        return;
      }
      navigation.dataset.navigationHidden = 'false';
      content.hidden = false;
      const bounds = content.getBoundingClientRect();
      // Keep the upward exit; restoration enters fully from the viewport's left edge.
      const distance = targetHidden
        ? bounds.height + (parseFloat(getComputedStyle(navigation).top) || 0) + 12
        : bounds.right + 12;
      const rest = { transform: targetHidden ? 'translateY(0px)' : 'translateX(0px)', opacity: 1 };
      const outside = { transform: (targetHidden ? 'translateY(-' : 'translateX(-') + distance + 'px)', opacity: 0 };
      const running = content.animate(
        [previous ?? (targetHidden ? rest : outside), targetHidden ? outside : rest],
        { duration: 320, easing: 'cubic-bezier(.4, 0, .2, 1)', fill: 'both' },
      );
      animation = running;
      navigation.dataset.navigationMotion = targetHidden ? 'hiding' : 'showing';
      void running.finished.then(() => {
        if (key === generation) settle();
      }).catch(() => { /* A reversed or suspended slide is intentionally cancelled. */ });
    });
    const applyPolicy = (): void => { if (animation && !allowsMotion()) settle(); };
    reduced.addEventListener('change', applyPolicy);
    document.addEventListener('visibilitychange', applyPolicy);
    const observer = new MutationObserver(applyPolicy);
    if (pause) observer.observe(pause, { attributes: true, attributeFilter: ['aria-pressed'] });
    window.addEventListener('resize', () => { if (animation) settle(); }, { passive: true });
    window.addEventListener('pagehide', settle);
    document.addEventListener('astro:before-swap', () => { settle(); observer.disconnect(); }, { once: true });
    navigation.dataset.navigationMotion = 'idle';
    visibility.hidden = false;
  }

  navigation.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href^="#"]') : null;
    const destination = sections.find((section) => '#' + section.id === link?.hash);
    if (!link || !destination) return;
    setActive(destination.id);
    if (menu.contains(link)) {
      closeMenu();
      destination.focus({ preventScroll: true });
    }
  });

  menu.addEventListener('toggle', syncMenu);
  menu.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu.open) {
      event.preventDefault();
      closeMenu(true);
    }
  });
  menu.addEventListener('focusout', (event) => {
    if (menu.open && event.relatedTarget instanceof Node && !menu.contains(event.relatedTarget)) closeMenu();
  });
  document.addEventListener('pointerdown', (event) => {
    if (menu.open && event.target instanceof Node && !menu.contains(event.target)) {
      closeMenu(menu.contains(document.activeElement));
    }
  });

  desktop.addEventListener('change', () => {
    const focused = document.activeElement;
    if (desktop.matches) {
      const hadMenuFocus = menu.contains(focused);
      closeMenu();
      if (hadMenuFocus) navigation.querySelector<HTMLAnchorElement>('.desktop-navigation a[aria-current]')?.focus({ preventScroll: true });
    } else if (focused && navigation.querySelector('.desktop-navigation')?.contains(focused)) {
      trigger.focus({ preventScroll: true });
    }
    updateActive();
  });

  function updateFromHash(): void {
    const destination = sections.find((section) => '#' + section.id === window.location.hash);
    if (destination) setActive(destination.id);
    else updateActive();
  }
  window.addEventListener('hashchange', updateFromHash);

  if ('IntersectionObserver' in window) {
    let sectionObserver: IntersectionObserver | undefined;
    let observedHeight = 0;

    function observeSections(): void {
      if (observedHeight === window.innerHeight) return;
      observedHeight = window.innerHeight;
      sectionObserver?.disconnect();
      // A one-pixel band uses the observer's actual intersections as the source
      // of truth, avoiding disagreement with a separately rounded cutoff.
      const line = Math.floor(observedHeight * 0.35);
      const intersecting = new Set<Element>();
      const observer: IntersectionObserver = new IntersectionObserver((entries) => {
        if (observer !== sectionObserver) return;
        for (const entry of entries) {
          if (entry.isIntersecting) intersecting.add(entry.target);
          else intersecting.delete(entry.target);
        }
        const current = sections.filter((section) => intersecting.has(section)).at(-1);
        if (current) setActive(current.id);
      }, { rootMargin: `-${line}px 0px -${Math.max(0, observedHeight - line - 1)}px 0px`, threshold: 0 });
      sectionObserver = observer;
      for (const section of sections) observer.observe(section);
    }

    observeSections();
    window.addEventListener('resize', () => {
      observeSections();
      updateActive();
    }, { passive: true });

    const sentinel = document.getElementById('page-top');
    if (sentinel) {
      const headerObserver = new IntersectionObserver(([entry]) => {
        navigation.classList.toggle('is-scrolled', !entry?.isIntersecting);
      }, { rootMargin: '24px 0px 0px 0px' });
      headerObserver.observe(sentinel);
    }
  }

  syncMenu();
  updateFromHash();
  void document.fonts.ready.then(updateActive);
}
