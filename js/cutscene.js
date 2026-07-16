/* ═══════════════════════════════════════════════════════════════════
   MAD — TRANSITION 01→02 · THE SAME MARK AT THREE SCALES
   ───────────────────────────────────────────────────────────────────
   The argument is the zoom-out, not a photograph.

     p 0.00–0.30  A RING IS A YEAR.
                  One set of growth rings fills the frame — the hero's
                  contour language, read close: a tree from directly above.
     p ~0.30      THE CUT. A bone blade sweeps the frame. The bark goes;
                  the rings are left as a cut face. The record is closed.
     p 0.30–0.68  A STUMP IS A RECORD, CLOSED.
                  The camera pulls back. One stump becomes a field of
                  stumps — each a tiny ring-set. Ground drains green→ash.
     p 0.68–1.00  FROM ORBIT, THE CUT HAS A SHAPE.
                  Pull back again: the stumps are too small to resolve and
                  organise into the FISHBONE — the real satellite signature
                  of Amazon clear-cutting (a spine road, ribs either side).
                  Which is Chapter 02. The map takes over.

   One tree's rings → a forest of stumps → a continent's scar. Same
   primitive, three scales. Generative: no bitmaps, no licensing.
   prefers-reduced-motion: draws the final orbital state, static.
   Designer knobs marked TUNE.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  const cv = document.getElementById("cutCanvas");
  if (!cv) return;
  const ctx = cv.getContext("2d");
  const scene = document.getElementById("cutScene");
  const lines = [...document.querySelectorAll("#cutScene .cut-line")];
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* palette — continuous with the hero.
     Tonality follows real satellite imagery: the FOREST is dark, the CLEARED
     land is pale. So the ground stays green and the cuts read bright against
     it — the loss is what catches the light. */
  const GREEN = [38, 51, 30];     // living forest ground
  const ASH = [30, 38, 26];       // forest, drained — still forest, not black
  const BONE = "239,236,229";
  const EMBER = "255,107,53";

  const BEATS = [0.06, 0.38, 0.72];   // TUNE: where each line takes over
  const CUT_AT = 0.30;                // TUNE: when the blade passes
  const STUMPS = 72;                  // TUNE: how many stumps in the field

  let W = 0, H = 0, dpr = 1, p = 0;

  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const smooth = (e0, e1, x) => { const t = clamp01((x - e0) / (e1 - e0 || 1e-6)); return t * t * (3 - 2 * t); };
  function rnd(i) { // deterministic per-stump jitter
    let h = Math.imul(i ^ 0x9e3779b9, 2654435761);
    return ((h ^ (h >>> 15)) >>> 0) / 4294967295;
  }

  /* ── one stump: concentric growth rings, gently irregular ── */
  function stump(cx, cy, r, seed, alpha, cut) {
    if (r < 0.6) { // too small to resolve — a mark
      ctx.fillStyle = `rgba(${BONE},${0.5 * alpha})`;
      ctx.fillRect(cx - 0.6, cy - 0.6, 1.2, 1.2);
      return;
    }
    const rings = Math.max(3, Math.min(26, Math.round(r / 3.4)));  // TUNE: ring density
    // the cut face — pale heartwood
    if (cut) {
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7);
      ctx.fillStyle = `rgba(${BONE},${0.10 * alpha})`; ctx.fill();
    }
    for (let n = 1; n <= rings; n++) {
      const rr = (n / rings) * r;
      const major = n % 5 === 0;                        // a decade mark
      ctx.beginPath();
      const steps = Math.max(10, Math.min(64, Math.round(rr * 0.9)));
      for (let s = 0; s <= steps; s++) {
        const a = (s / steps) * Math.PI * 2;
        // irregularity: rings are not circles, they're a record of years
        const wob = 1 + 0.055 * Math.sin(a * 3 + seed * 6.3) + 0.035 * Math.sin(a * 7 - seed * 3.1 + n * 0.35);
        const x = cx + Math.cos(a) * rr * wob, y = cy + Math.sin(a) * rr * wob * 0.94;
        s ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.closePath();
      ctx.strokeStyle = `rgba(${BONE},${(major ? 0.72 : 0.30) * alpha})`;
      ctx.lineWidth = major ? 1.4 : 0.7;
      ctx.stroke();
    }
    // bark: only while the tree still stands
    if (!cut) {
      ctx.beginPath(); ctx.arc(cx, cy, r * 1.045, 0, 7);
      ctx.strokeStyle = `rgba(${BONE},${0.5 * alpha})`; ctx.lineWidth = 3.2; ctx.stroke();
    }
  }

  /* ── the fishbone: a spine road, ribs either side (Rondônia's signature) ── */
  function fishbone(alpha, grow) {
    ctx.save();
    ctx.lineCap = "round";
    const spines = 3;                                   // TUNE: how many roads
    for (let s = 0; s < spines; s++) {
      const y0 = H * (0.22 + s * 0.30) + (rnd(s * 7) - 0.5) * H * 0.04;
      const drift = (rnd(s * 13) - 0.5) * H * 0.10;
      const len = W * grow;
      // ribs first, so the spine road sits on top of its own clearings.
      // Spaced wide and cut thin — forest must survive BETWEEN them, or the
      // pattern reads as a barcode instead of a fishbone.
      const ribs = 17;                                  // TUNE: rib count (spacing)
      for (let i = 1; i < ribs; i++) {
        const f = i / ribs;
        if (f * W > len) break;
        const x = f * W, y = y0 + drift * grow * f;
        // ribs shorten with distance along the road — the cut is youngest at the end
        const rl = H * (0.035 + rnd(s * 100 + i) * 0.075) * clamp01((grow - f) * 3);
        if (rl <= 0) continue;
        const skew = (rnd(s * 200 + i) - 0.5) * 10;
        // the cleared parcel: PALE, THIN — bare earth catching the light
        const w = 2 + rnd(s * 300 + i) * 5;             // TUNE: parcel width
        ctx.fillStyle = `rgba(${BONE},${0.16 * alpha})`;
        ctx.fillRect(x - w / 2, y - rl, w, rl * 2);
        // the track down the middle of it
        ctx.beginPath(); ctx.moveTo(x, y - rl); ctx.lineTo(x + skew, y + rl);
        ctx.strokeStyle = `rgba(${BONE},${0.5 * alpha})`; ctx.lineWidth = 0.9; ctx.stroke();
      }
      // the spine road last
      ctx.beginPath();
      ctx.moveTo(0, y0);
      ctx.lineTo(len, y0 + drift * grow);
      ctx.strokeStyle = `rgba(${BONE},${0.75 * alpha})`; ctx.lineWidth = 2.2; ctx.stroke();
    }
    ctx.restore();
  }

  function draw() {
    const cx = W / 2, cy = H / 2;
    const cut = p >= CUT_AT;

    // ground: living green draining to ash as the cut spreads
    const g = smooth(0.28, 0.85, p);
    ctx.fillStyle = `rgb(${Math.round(lerp(GREEN[0], ASH[0], g))},${Math.round(lerp(GREEN[1], ASH[1], g))},${Math.round(lerp(GREEN[2], ASH[2], g))})`;
    ctx.fillRect(0, 0, W, H);

    // phase alphas — the tree holds full size THROUGH the cut, then pulls back
    const aSingle = 1 - smooth(0.44, 0.62, p);
    const aField = smooth(0.44, 0.64, p) * (1 - smooth(0.70, 0.86, p));
    const aFish = smooth(0.62, 0.92, p);

    // 1 · the single tree. Full frame until the blade lands; then it recedes.
    if (aSingle > 0.01) {
      const r = Math.min(W, H) * lerp(0.42, 0.09, smooth(CUT_AT, 0.62, p));  // TUNE: pull-back
      stump(cx, cy, r, 0.42, aSingle, cut);
    }

    // 2 · the field it turns out to be part of
    if (aField > 0.01) {
      const shrink = 1 - smooth(0.46, 0.9, p);
      for (let i = 0; i < STUMPS; i++) {
        const sx = rnd(i * 3 + 1) * W, sy = rnd(i * 3 + 2) * H;
        const r = Math.min(W, H) * (0.010 + rnd(i * 3 + 3) * 0.026) * (0.35 + shrink * 1.5);
        stump(sx, sy, r, rnd(i * 5), aField * (0.55 + rnd(i) * 0.45), true);
      }
    }

    // 3 · from orbit: the shape the loss makes
    if (aFish > 0.01) fishbone(aFish, smooth(0.62, 1.0, p));

    // heat bleeds as the cut spreads — carbon released, not metaphor
    const heat = smooth(0.4, 1.0, p) * 0.24;            // TUNE: ember bleed
    if (heat > 0.01) {
      ctx.globalCompositeOperation = "overlay";
      ctx.fillStyle = `rgba(${EMBER},${heat})`;
      ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = "source-over";
    }

    // the blade: one unhurried pass — a saw-line, not a slab. The machinery
    // is mournful: no sparks, no speed. It simply crosses, and the tree ends.
    const blade = smooth(CUT_AT - 0.10, CUT_AT, p) * (1 - smooth(CUT_AT + 0.02, CUT_AT + 0.14, p));
    if (blade > 0.01) {
      const bx = lerp(-W * 0.08, W * 1.08, smooth(CUT_AT - 0.10, CUT_AT + 0.14, p));
      const halo = ctx.createLinearGradient(bx - 40, 0, bx + 40, 0);   // TUNE: halo width
      halo.addColorStop(0, `rgba(${BONE},0)`);
      halo.addColorStop(0.5, `rgba(${BONE},${0.16 * blade})`);
      halo.addColorStop(1, `rgba(${BONE},0)`);
      ctx.fillStyle = halo; ctx.fillRect(bx - 40, 0, 80, H);
      ctx.beginPath(); ctx.moveTo(bx, 0); ctx.lineTo(bx, H);          // the cut itself
      ctx.strokeStyle = `rgba(${BONE},${0.95 * blade})`; ctx.lineWidth = 1.25; ctx.stroke();
    }
  }

  function setLines() {
    let active = 0;
    for (let i = 0; i < BEATS.length; i++) if (p >= BEATS[i]) active = i;
    lines.forEach((el, i) => el.classList.toggle("on", i === active));
  }

  function size() {
    const r = cv.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  let ticking = false, hold = false;
  function update() {
    ticking = false;
    if (hold) return;                 // a designer is driving it by hand
    const r = scene.getBoundingClientRect();
    const total = scene.offsetHeight - window.innerHeight;
    p = clamp01(-r.top / (total || 1));
    draw(); setLines();
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }

  /* Design hook: drive the scene by hand while tuning, e.g. in the console
     __cutScene(0.55) — 0 = the living tree, 1 = the orbital scar.
     __cutScene(null) hands it back to the scroll. */
  window.__cutScene = (v) => {
    if (v === null) { hold = false; update(); return; }
    hold = true; p = clamp01(v); draw(); setLines();
  };

  if (reduce) { p = 1; size(); setLines(); lines.forEach((el) => el.classList.add("on")); return; }
  size();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => { size(); update(); }, { passive: true });
  update();
  requestAnimationFrame(() => { size(); update(); });
  window.addEventListener("load", () => { size(); update(); });
})();
