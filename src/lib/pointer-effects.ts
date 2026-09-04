/** Global pointer tracker for cursor + halo. Transform writes only, no React state. */

const INTERACTIVE_SELECTOR =
  'a, button, input, select, textarea, summary, [role="button"], [data-cursor="interactive"]';
const HALO_SELECTOR = '.halo-target';
const FINE_POINTER_QUERY = '(hover: hover) and (pointer: fine)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

// Keep in sync with `.site-cursor` (18px) and the halo gradient (360px).
const CURSOR_OFFSET = 9;
const HALO_RADIUS = 360;

export function initPointerEffects(): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {};
  }

  const finePointer = window.matchMedia(FINE_POINTER_QUERY);
  if (!finePointer.matches) return () => {};

  const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY);
  const cursor = document.querySelector<HTMLElement>('.site-cursor');
  // No cursor element, nothing to drive.
  if (!cursor) return () => {};

  const html = document.documentElement;

  let raf = 0;
  let lastX = 0;
  let lastY = 0;
  let lastTarget: Element | null = null;
  let hasPointer = false;
  let isVisible = false;
  let isInteractive = false;
  let activeHalo: HTMLElement | null = null;
  let haloRect: DOMRect | null = null;
  let haloLayer: HTMLElement | null = null;

  // `cursor: none` must not apply under the intro overlay. Boolean so the
  // per-frame path never touches the DOM.
  let introBlocked =
    document.querySelector('.intro-loader:not(.is-exiting)') !== null;

  const syncCursorActiveClass = () => {
    if (isVisible && !introBlocked) {
      html.classList.add('custom-cursor-active');
    } else {
      html.classList.remove('custom-cursor-active');
    }
  };

  const setVisible = (visible: boolean) => {
    if (isVisible === visible) {
      if (visible) syncCursorActiveClass();
      return;
    }
    isVisible = visible;
    cursor.classList.toggle('is-visible', visible);
    syncCursorActiveClass();
    if (!visible) {
      isInteractive = false;
      cursor.classList.remove('is-interactive');
      activeHalo = null;
      haloRect = null;
      haloLayer = null;
    }
  };

  const renderPointerEffects = () => {
    raf = 0;
    if (!hasPointer) return;

    cursor.style.transform = `translate3d(${lastX - CURSOR_OFFSET}px, ${lastY - CURSOR_OFFSET}px, 0)`;
    if (!isVisible) setVisible(true);
    else syncCursorActiveClass();

    const interactive = lastTarget?.closest?.(INTERACTIVE_SELECTOR) != null;
    if (interactive !== isInteractive) {
      isInteractive = interactive;
      cursor.classList.toggle('is-interactive', interactive);
    }

    if (reducedMotion.matches) return;

    const nextHalo =
      (lastTarget?.closest?.(HALO_SELECTOR) as HTMLElement | null) ?? null;

    if (nextHalo !== activeHalo) {
      activeHalo = nextHalo;
      haloRect = null;
      haloLayer = null;
      if (activeHalo) {
        // One layout read per target switch.
        haloRect = activeHalo.getBoundingClientRect();
        haloLayer =
          activeHalo.querySelector<HTMLElement>(
            ':scope > .halo-light, :scope > .halo-overlay',
          ) ?? null;
      }
    } else if (activeHalo && !haloRect) {
      // Invalidated by scroll/resize.
      haloRect = activeHalo.getBoundingClientRect();
    }

    if (!activeHalo || !haloRect) return;

    const localX = lastX - haloRect.left;
    const localY = lastY - haloRect.top;
    const haloX = Math.round(localX - HALO_RADIUS);
    const haloY = Math.round(localY - HALO_RADIUS);

    if (haloLayer) {
      haloLayer.style.transform = `translate3d(${haloX}px, ${haloY}px, 0)`;
    } else {
      // Transform only; the gradient is never regenerated.
      activeHalo.style.setProperty('--halo-x', `${haloX}px`);
      activeHalo.style.setProperty('--halo-y', `${haloY}px`);
    }
  };

  const schedule = () => {
    if (!raf) raf = requestAnimationFrame(renderPointerEffects);
  };

  const onPointerMove = (event: PointerEvent) => {
    lastX = event.clientX;
    lastY = event.clientY;
    lastTarget = event.target instanceof Element ? event.target : null;
    hasPointer = true;
    schedule();
  };

  const onHide = () => {
    hasPointer = false;
    lastTarget = null;
    if (raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
    setVisible(false);
  };

  const onInvalidateHaloRect = () => {
    haloRect = null;
    // Refresh once if parked over a halo target during scroll.
    if (activeHalo && hasPointer) schedule();
  };

  const onReducedMotionChange = () => {
    // Drop stale transforms when the preference flips mid-session.
    if (reducedMotion.matches) {
      haloRect = null;
    }
  };

  window.addEventListener('pointermove', onPointerMove, { passive: true });
  document.documentElement.addEventListener('pointerleave', onHide);
  document.addEventListener('pointercancel', onHide);
  window.addEventListener('blur', onHide);
  window.addEventListener('scroll', onInvalidateHaloRect, {
    passive: true,
    capture: true,
  });
  window.addEventListener('resize', onInvalidateHaloRect);
  reducedMotion.addEventListener?.('change', onReducedMotionChange);

  // Disconnects once the intro unmounts: zero steady-state cost.
  const introObserver = new MutationObserver(() => {
    introBlocked =
      document.querySelector('.intro-loader:not(.is-exiting)') !== null;
    if (document.querySelector('.intro-loader') === null) {
      introObserver.disconnect();
    }
    syncCursorActiveClass();
  });
  if (document.querySelector('.intro-loader') !== null) {
    introObserver.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class'],
    });
  }

  return () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    window.removeEventListener('pointermove', onPointerMove);
    document.documentElement.removeEventListener('pointerleave', onHide);
    document.removeEventListener('pointercancel', onHide);
    window.removeEventListener('blur', onHide);
    window.removeEventListener('scroll', onInvalidateHaloRect, true);
    window.removeEventListener('resize', onInvalidateHaloRect);
    reducedMotion.removeEventListener?.('change', onReducedMotionChange);
    introObserver.disconnect();
    cursor.classList.remove('is-visible', 'is-interactive');
    cursor.style.transform = '';
    html.classList.remove('custom-cursor-active');
  };
}
