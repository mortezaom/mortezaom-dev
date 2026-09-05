import { useEffect, useRef } from 'react';

type RGB = { r: number; g: number; b: number };

const GAP = 20;
const BASE_R = 1;
// Same ~4% static dots as the original design. Brightness never changes;
// dots only shift a few px away from the cursor.
const BASE_A = 0.047;
const MAX_SHIFT = 6;
const SIGMA = 150;
const LERP = 0.28;
const IDLE_MS = 4000;
// Middle-only fade baked per dot (matches old vignette: full till 30%,
// gone by 72%). Keeps the canvas a plain layer: no mask composite pass.
const FADE_IN = 0.3;
const FADE_OUT = 0.72;

function parseRGB(value: string): RGB {
  const m = value.trim().match(/(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})/);
  if (m) {
    return {
      r: Math.min(255, Number(m[1])),
      g: Math.min(255, Number(m[2])),
      b: Math.min(255, Number(m[3])),
    };
  }
  const h = value.trim().replace('#', '');
  if (h.length === 3 || h.length === 6) {
    const full =
      h.length === 3
        ? h
            .split('')
            .map((c) => c + c)
            .join('')
        : h;
    const n = Number.parseInt(full, 16);
    if (Number.isFinite(n)) {
      return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
    }
  }
  return { r: 245, g: 245, b: 245 };
}

function readInk(): RGB {
  const v = getComputedStyle(document.documentElement).getPropertyValue(
    '--c-ink',
  );
  return parseRGB(v || '#f5f5f5');
}

/**
 * Same middle-faded dot grid as before. Dots near the cursor push away
 * a few px and settle back. Alpha/size untouched, so it can't glow.
 *
 * Perf: base grid cached offscreen; per frame only the dirty zone around
 * the cursor is restored + redrawn (no full-screen blit, no mask layer).
 * Loop parks when settled or idle; touch drift runs at 30fps.
 */
export function DotBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const coarse = window.matchMedia('(hover: none), (pointer: coarse)');
    const dpr = Math.min(
      window.devicePixelRatio || 1,
      coarse.matches ? 1.5 : 2,
    );

    let w = 0;
    let h = 0;
    let ink: RGB = readInk();
    let raf = 0;
    let scheduled = false;
    let destroyed = false;
    let running = true;
    let idleTimer: ReturnType<typeof setTimeout> | 0 = 0;
    let lastFrame = 0;

    const base = document.createElement('canvas');
    const baseCtx = base.getContext('2d');

    let fx = -9999;
    let fy = -9999;
    let tx = -9999;
    let ty = -9999;
    let amp = 0;
    let lastPointerT = -Infinity;
    let pointerSeen = false;
    // Dirty zone from the previous frame (CSS px), restored before redraw.
    let prev: { x: number; y: number; w: number; h: number } | null = null;

    const fadeAt = (x: number, y: number) => {
      const nx = (x - w / 2) / (w / 2);
      const ny = (y - h / 2) / (h / 2);
      const n = Math.sqrt(nx * nx + ny * ny) / Math.SQRT2;
      if (n <= FADE_IN) return 1;
      if (n >= FADE_OUT) return 0;
      const t = (n - FADE_IN) / (FADE_OUT - FADE_IN);
      return 1 - t * t * (3 - 2 * t);
    };

    const paintBase = () => {
      if (!baseCtx) return;
      base.width = Math.max(1, Math.round(w * dpr));
      base.height = Math.max(1, Math.round(h * dpr));
      baseCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      baseCtx.clearRect(0, 0, w, h);
      for (let gy = GAP / 2; gy < h; gy += GAP) {
        for (let gx = GAP / 2; gx < w; gx += GAP) {
          const a = BASE_A * fadeAt(gx, gy);
          if (a < 0.004) continue;
          baseCtx.fillStyle = `rgba(${ink.r},${ink.g},${ink.b},${a.toFixed(3)})`;
          baseCtx.beginPath();
          baseCtx.arc(gx, gy, BASE_R, 0, 6.2832);
          baseCtx.fill();
        }
      }
    };

    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintBase();
      prev = null;
      blit();
    };

    const blit = () => {
      ctx.clearRect(0, 0, w, h);
      if (base.width > 1) ctx.drawImage(base, 0, 0, w, h);
    };

    /** Restore one zone from cache in device px (no full-screen blit). */
    const restoreZone = (z: { x: number; y: number; w: number; h: number }) => {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      const sx = Math.max(0, Math.floor(z.x * dpr));
      const sy = Math.max(0, Math.floor(z.y * dpr));
      const sw = Math.min(base.width - sx, Math.ceil(z.w * dpr));
      const sh = Math.min(base.height - sy, Math.ceil(z.h * dpr));
      ctx.clearRect(sx, sy, sw, sh);
      if (sw > 0 && sh > 0) ctx.drawImage(base, sx, sy, sw, sh, sx, sy, sw, sh);
      ctx.restore();
    };

    const ghost = (t: number) => ({
      x: w * (0.5 + 0.22 * Math.sin(t * 0.00006)),
      y: h * (0.4 + 0.2 * Math.cos(t * 0.00005 + 0.6)),
    });

    const drawZone = () => {
      const rad = SIGMA * 3 + MAX_SHIFT + 2;
      // Dot index range first: every drawn dot must lie inside the cleared
      // bbox, or it stacks over the cached base as a permanent bright dot.
      const maxCol = Math.floor((w - 1 - GAP / 2) / GAP);
      const maxRow = Math.floor((h - 1 - GAP / 2) / GAP);
      const col0 = Math.max(0, Math.ceil((fx - rad - GAP / 2) / GAP));
      const col1 = Math.min(maxCol, Math.floor((fx + rad - GAP / 2) / GAP));
      const row0 = Math.max(0, Math.ceil((fy - rad - GAP / 2) / GAP));
      const row1 = Math.min(maxRow, Math.floor((fy + rad - GAP / 2) / GAP));
      if (col1 < col0 || row1 < row0) return;
      // Bbox covers dots + max shift + radius + AA, snapped to device px
      // so fractional clearRect edges leave no residue strips.
      const PAD = MAX_SHIFT + BASE_R + 1;
      const x0 = Math.max(
        0,
        Math.floor((GAP / 2 + col0 * GAP - PAD) * dpr) / dpr,
      );
      const x1 = Math.min(
        w,
        Math.ceil((GAP / 2 + col1 * GAP + PAD) * dpr) / dpr,
      );
      const y0 = Math.max(
        0,
        Math.floor((GAP / 2 + row0 * GAP - PAD) * dpr) / dpr,
      );
      const y1 = Math.min(
        h,
        Math.ceil((GAP / 2 + row1 * GAP + PAD) * dpr) / dpr,
      );
      ctx.clearRect(x0, y0, x1 - x0, y1 - y0);
      for (let r = row0; r <= row1; r++) {
        const y = GAP / 2 + r * GAP;
        for (let c = col0; c <= col1; c++) {
          const x = GAP / 2 + c * GAP;
          const a = BASE_A * fadeAt(x, y);
          // Same skip threshold as paintBase: both leave transparent.
          if (a < 0.004) continue;
          const dx = x - fx;
          const dy = y - fy;
          const d2 = dx * dx + dy * dy;
          const g = Math.exp(-d2 / (2 * SIGMA * SIGMA)) * amp;
          let px = x;
          let py = y;
          if (g >= 0.03) {
            const dist = Math.sqrt(d2) || 1;
            const shift = MAX_SHIFT * g;
            px = x + (dx / dist) * shift;
            py = y + (dy / dist) * shift;
          }
          ctx.fillStyle = `rgba(${ink.r},${ink.g},${ink.b},${a.toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(px, py, BASE_R, 0, 6.2832);
          ctx.fill();
        }
      }
      prev = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    };

    const frame = (now: number) => {
      raf = 0;
      scheduled = false;
      if (!running || destroyed) return;

      // Touch drift idles at 30fps; direct touch input stays full-rate.
      if (coarse.matches && now - lastPointerT > IDLE_MS) {
        if (now - lastFrame < 33) {
          scheduled = true;
          raf = requestAnimationFrame(frame);
          return;
        }
      }
      lastFrame = now;

      const pointerActive = coarse.matches
        ? true
        : pointerSeen && now - lastPointerT < IDLE_MS;

      if (coarse.matches && now - lastPointerT > IDLE_MS) {
        const g = ghost(now);
        tx = g.x;
        ty = g.y;
      }

      fx += (tx - fx) * LERP;
      fy += (ty - fy) * LERP;
      const target = pointerActive ? 1 : 0;
      amp += (target - amp) * (target > amp ? 0.25 : 0.06);

      if (prev) {
        restoreZone(prev);
        prev = null;
      }
      if (amp > 0.01) drawZone();
      else amp = 0;

      const settled =
        Math.abs(fx - tx) < 0.05 &&
        Math.abs(fy - ty) < 0.05 &&
        Math.abs(amp - target) < 0.01;
      // Park the loop when settled; pointermove/timeout re-kicks.
      if (!settled || coarse.matches) kick();
    };

    const kick = () => {
      if (destroyed || !running || scheduled) return;
      scheduled = true;
      raf = requestAnimationFrame(frame);
    };

    const armIdleTimer = () => {
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(kick, IDLE_MS + 100);
    };

    const onMove = (e: PointerEvent) => {
      tx = e.clientX;
      ty = e.clientY;
      if (!pointerSeen) {
        fx = tx;
        fy = ty;
      }
      lastPointerT = performance.now();
      pointerSeen = true;
      kick();
      armIdleTimer();
    };

    let resizeQueued = false;
    const onResize = () => {
      if (resizeQueued) return;
      resizeQueued = true;
      requestAnimationFrame(() => {
        resizeQueued = false;
        if (!destroyed) resize();
      });
    };

    const onVis = () => {
      running = document.visibilityState !== 'hidden';
      if (running) {
        if (amp > 0.01 || coarse.matches || prev) {
          if (prev) {
            prev = null;
            blit();
          }
          kick();
        }
      } else {
        if (raf) cancelAnimationFrame(raf);
        raf = 0;
        scheduled = false;
        if (idleTimer) clearTimeout(idleTimer);
        idleTimer = 0;
      }
    };

    const onTheme = () => {
      ink = readInk();
      paintBase();
      // Parked frames hold dots in old ink; repaint fully (rare event).
      if (!scheduled) {
        prev = null;
        blit();
      }
    };
    const themeObs = new MutationObserver(onTheme);
    themeObs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style', 'data-theme'],
    });

    resize();

    if (!reduced.matches) {
      window.addEventListener('pointermove', onMove, { passive: true });
      window.addEventListener('pointerdown', onMove, { passive: true });
      window.addEventListener('resize', onResize);
      document.addEventListener('visibilitychange', onVis);
      if (coarse.matches) {
        const g = ghost(performance.now());
        fx = tx = g.x;
        fy = ty = g.y;
        amp = 1;
        kick();
      }
    }

    return () => {
      destroyed = true;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      scheduled = false;
      if (idleTimer) clearTimeout(idleTimer);
      themeObs.disconnect();
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerdown', onMove);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);

  return <canvas ref={ref} className="dot-canvas" aria-hidden="true" />;
}
