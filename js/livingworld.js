/* ═══════════════════════════════════════════════════════════════════
   MAD — SCENE 01 · THE LIVING WORLD  (scroll redesign)
   ───────────────────────────────────────────────────────────────────
   The board's master motif, drawn in code: concentric rings — tree rings,
   a fingerprint, topographic contours are the same mark. A record of time,
   written in rings. "The planet keeps its own books."

   Then the first scroll SLICES the field into horizontal bands and shifts
   them out of alignment (the fingerprint pin), while the palette bleeds
   from living green toward ember. "Every one of them is breaking."

   All generative — no bitmaps, no licensing, ~6 KB, fully responsive.
   Honours prefers-reduced-motion: static field, no slicing, no drift.

   Designer knobs are marked TUNE.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  const cv = document.getElementById("lw");
  if (!cv) return;
  const ctx = cv.getContext("2d");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── palette (sampled from the reference board) ── */
  const GREEN_DEEP = "#26331e";   // bottle green ground (TUNE: living-world value)
  const GREEN_MID = "#2d5537";    // pine
  const BONE = "#efece5";         // paper / contour ink
  const EMBER = "#ff6b35";        // carbon & heat (site's data accent)

  const BANDS = 9;                // TUNE: how many slices the record breaks into
  const DRIFT = reduce ? 0 : 0.012; // TUNE: breathing speed

  let W = 0, H = 0, dpr = 1;
  let off = null, offCtx = null;  // offscreen: the intact ring field
  let progress = 0;               // 0 = living, 1 = fully sliced

  /* ── value noise (hash + smooth interpolation), seeded & deterministic ── */
  function hash(x, y) {
    let h = x * 374761393 + y * 668265263;
    h = (h ^ (h >> 13)) * 1274126177;
    return ((h ^ (h >> 16)) >>> 0) / 4294967295;
  }
  const fade = (t) => t * t * (3 - 2 * t);
  function noise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    const u = fade(xf), v = fade(yf);
    return a * (1 - u) * (1 - v) + b * u * (1 - v) + c * (1 - u) * v + d * u * v;
  }
  function fbm(x, y) { // fractal noise → organic contours
    let s = 0, amp = 0.5, f = 1;
    for (let i = 0; i < 5; i++) { s += amp * noise(x * f, y * f); f *= 2; amp *= 0.5; }
    return s;
  }

  /* ── marching squares: real iso-contours, like a survey map ── */
  function contour(c, level, cols, rows, cell, field) {
    c.beginPath();
    for (let j = 0; j < rows - 1; j++) {
      for (let i = 0; i < cols - 1; i++) {
        const tl = field[j * cols + i], tr = field[j * cols + i + 1];
        const bl = field[(j + 1) * cols + i], br = field[(j + 1) * cols + i + 1];
        let k = 0;
        if (tl > level) k |= 8; if (tr > level) k |= 4; if (br > level) k |= 2; if (bl > level) k |= 1;
        if (k === 0 || k === 15) continue;
        const x = i * cell, y = j * cell;
        const ip = (a, b) => (level - a) / (b - a || 1e-6);
        const T = [x + cell * ip(tl, tr), y], R = [x + cell, y + cell * ip(tr, br)];
        const B = [x + cell * ip(bl, br), y + cell], L = [x, y + cell * ip(tl, bl)];
        const seg = (p, q) => { c.moveTo(p[0], p[1]); c.lineTo(q[0], q[1]); };
        switch (k) {
          case 1: case 14: seg(L, B); break;
          case 2: case 13: seg(B, R); break;
          case 3: case 12: seg(L, R); break;
          case 4: case 11: seg(T, R); break;
          case 6: case 9: seg(T, B); break;
          case 7: case 8: seg(L, T); break;
          case 5: seg(L, T); seg(B, R); break;
          case 10: seg(T, R); seg(L, B); break;
        }
      }
    }
    c.stroke();
  }

  /* ── render the intact living field once, offscreen ── */
  function buildField(t) {
    const cell = 8;                                   // TUNE: contour resolution
    const cols = Math.ceil(W / cell) + 1, rows = Math.ceil(H / cell) + 1;
    const field = new Float32Array(cols * rows);
    const sc = 0.028;                                 // TUNE: landform scale
    for (let j = 0; j < rows; j++)
      for (let i = 0; i < cols; i++)
        field[j * cols + i] = fbm(i * cell * sc + t, j * cell * sc - t * 0.6);

    offCtx.fillStyle = GREEN_DEEP;
    offCtx.fillRect(0, 0, W, H);

    // dashed survey grid — the field-document framing (North Face catalogue pin)
    offCtx.save();
    offCtx.strokeStyle = "rgba(239,236,229,0.07)";
    offCtx.lineWidth = 1; offCtx.setLineDash([3, 6]);
    for (let x = 0; x < W; x += 96) { offCtx.beginPath(); offCtx.moveTo(x, 0); offCtx.lineTo(x, H); offCtx.stroke(); }
    for (let y = 0; y < H; y += 96) { offCtx.beginPath(); offCtx.moveTo(0, y); offCtx.lineTo(W, y); offCtx.stroke(); }
    offCtx.restore();

    // the rings themselves — thin bone contours, a few emphasised (index lines)
    const LEVELS = 16;                                // TUNE: ring density
    for (let n = 1; n < LEVELS; n++) {
      const lv = n / LEVELS;
      const major = n % 4 === 0;
      offCtx.strokeStyle = major ? "rgba(239,236,229,0.80)" : "rgba(239,236,229,0.32)";
      offCtx.lineWidth = major ? 1.5 : 0.8;
      contour(offCtx, lv, cols, rows, cell, field);
    }
    // faint pine wash so the ground reads as living, not black
    offCtx.globalCompositeOperation = "overlay";
    offCtx.fillStyle = GREEN_MID; offCtx.globalAlpha = 0.35;
    offCtx.fillRect(0, 0, W, H);
    offCtx.globalAlpha = 1; offCtx.globalCompositeOperation = "source-over";
  }

  /* ── blit to screen, slicing into displaced bands as scroll advances ── */
  function draw() {
    ctx.clearRect(0, 0, W, H);
    const bh = H / BANDS;
    for (let b = 0; b < BANDS; b++) {
      // alternating shear, eased — the record pulled out of alignment
      const dir = b % 2 ? 1 : -1;
      const ease = progress * progress;
      const dx = reduce ? 0 : dir * ease * W * (0.34 + (b % 3) * 0.17); // TUNE: slip distance (fraction of frame)
      // the ground the slip exposes: raw cut earth, not empty black
      if (Math.abs(dx) > 1) {
        ctx.fillStyle = `rgba(122,74,40,${0.30 + ease * 0.45})`;   // TUNE: cut-earth tone
        if (dx > 0) ctx.fillRect(0, b * bh, dx, bh);
        else ctx.fillRect(W + dx, b * bh, -dx, bh);
      }
      ctx.drawImage(off, 0, b * bh, W, bh, dx, b * bh, W, bh);
      // the severed edge
      if (Math.abs(dx) > 1) {
        ctx.fillStyle = `rgba(239,236,229,${0.16 + ease * 0.24})`;
        ctx.fillRect(dx > 0 ? dx : W + dx, b * bh, 1.2, bh);
      }
    }
    if (progress > 0.01 && !reduce) {
      // heat bleeds into the wound as the world is cut
      ctx.globalCompositeOperation = "overlay";
      ctx.globalAlpha = progress * 0.5;                 // TUNE: ember bleed
      ctx.fillStyle = EMBER; ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1; ctx.globalCompositeOperation = "source-over";
    }
  }

  function size() {
    const r = cv.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    off = document.createElement("canvas");
    off.width = W; off.height = H;
    offCtx = off.getContext("2d");
    buildField(0);
    draw();
  }

  /* scroll → progress across the first viewport; the hero is where it breaks */
  function onScroll() {
    const p = Math.min(1, Math.max(0, window.scrollY / (window.innerHeight * 0.85)));
    if (Math.abs(p - progress) < 0.004) return;
    progress = p;
    draw();
  }

  let t = 0, raf = null;
  function breathe() {           // slow drift: the world is alive, barely
    t += DRIFT;
    buildField(t);
    draw();
    raf = setTimeout(() => requestAnimationFrame(breathe), 1000 / 12); // 12fps is plenty
  }

  size();
  window.addEventListener("resize", () => { clearTimeout(raf); size(); if (!reduce) breathe(); }, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  if (!reduce) breathe();
  // belt & braces: the hero's height settles after fonts/layout, so paint again
  // once on the next frame and again on load. size() is idempotent.
  requestAnimationFrame(size);
  window.addEventListener("load", size);
})();
