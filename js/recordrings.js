/* ═══════════════════════════════════════════════════════════════════
   MAD — CH 01 · THE RECORD, IN RINGS  →  UNROLLED INTO STRIPES
   ───────────────────────────────────────────────────────────────────
   Not decoration over the data — the instrument the data came from.

   "The planet keeps its own books." Its books are tree rings, ice cores,
   sediment layers: dendroclimatology is literally how we know the
   temperature record before thermometers. So the warming record is drawn
   as what it is — a set of growth rings, one per year, 1850 at the pith,
   2025 at the bark, each coloured by that year's anomaly.

   Then scroll UNROLLS them: every ring's angle becomes vertical position
   and its radius becomes horizontal position, so the concentric record
   morphs continuously into Ed Hawkins' warming stripes. Same numbers,
   two readings, one move. Nothing is added or distorted — the geometry
   changes, the data does not.

   Contextual markings ride along: the pith (1850 baseline), the point the
   record starts to run hot, the warmest year, and the bark (now).

   Data: HEAT_STRIPES (js/data.js) — see DATA-SOURCES.md.
   prefers-reduced-motion: this scene is hidden by CSS and the static DOM
   stripes are shown instead.
   Designer knobs marked TUNE.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  const cv = document.getElementById("ringCanvas");
  if (!cv) return;
  const scene = document.getElementById("ringScene");
  const ctx = cv.getContext("2d");
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const BONE = "239,236,229";
  const SAMPLES = 84;            // TUNE: angular resolution of each ring (smoothness)
  const PITH = 0.11, BARK = 0.44; // TUNE: inner/outer radius as a fraction of min(W,H)

  let W = 0, H = 0, dpr = 1, q = 0;   // q: 0 = rings, 1 = stripes
  // the laid-flat core reads as a band, not a full-bleed wash — that's what a
  // core sample looks like on the bench, and what the stripes look like in print
  const bandH = () => Math.min(H * 0.46, 300);   // TUNE: laid-flat band height
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const smooth = (e0, e1, x) => { const t = clamp01((x - e0) / (e1 - e0 || 1e-6)); return t * t * (3 - 2 * t); };

  const YEARS = (typeof HEAT_STRIPES !== "undefined" ? HEAT_STRIPES : []);
  const N = YEARS.length;
  const vals = YEARS.map((d) => d[1]);
  const MIN = Math.min(...vals), MAX = Math.max(...vals);

  /* colour ramp — shared with the stripes, incl. the colour-blind-safe
     palette when the reader has toggled it (P2-4). */
  function ramp(t) {
    const brand = [[0, [42, 111, 140]], [0.35, [110, 199, 232]], [0.5, [205, 214, 220]], [0.72, [178, 58, 20]], [1, [255, 107, 53]]];
    const cvd = (typeof STRIPES_CVD !== "undefined") ? STRIPES_CVD : brand;
    const on = (typeof stripesCVD !== "undefined") && stripesCVD;
    const stops = on ? cvd : brand;
    let a = stops[0], b = stops[stops.length - 1];
    for (let i = 0; i < stops.length - 1; i++) if (t >= stops[i][0] && t <= stops[i + 1][0]) { a = stops[i]; b = stops[i + 1]; break; }
    const f = (t - a[0]) / (b[0] - a[0] || 1);
    const c = a[1].map((v, i) => Math.round(v + (b[1][i] - v) * f));
    return `rgb(${c[0]},${c[1]},${c[2]})`;
  }

  const colFor = (i) => ramp(clamp01((YEARS[i][1] - MIN) / (MAX - MIN || 1)));

  /* the stump: every year as a ring, 1850 at the pith → 2025 at the bark */
  function drawStump(alpha) {
    const cx = W / 2, cy = H / 2, m = Math.min(W, H);
    for (let i = N - 1; i >= 0; i--) {          // outward-in so rings overlay cleanly
      const R = m * lerp(PITH, BARK, (i + 1) / N);
      ctx.beginPath();
      for (let s = 0; s <= SAMPLES; s++) {
        const th = (s / SAMPLES) * Math.PI * 2;
        const wob = 1 + 0.05 * Math.sin(th * 3 + i * 0.21) + 0.028 * Math.sin(th * 7 - i * 0.13);
        const x = cx + Math.cos(th) * R * wob, y = cy + Math.sin(th) * R * wob * 0.94;
        s ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.closePath();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = colFor(i);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  /* the core: what a dendrochronologist actually extracts — a thin radial
     cylinder from bark to pith. Laid flat and stretched, the core IS the
     warming stripes. So this is a rigid move, not a coordinate trick:
     the strip rotates, straightens and grows into the full-width record. */
  function drawCore(q) {
    const cx = W / 2, cy = H / 2, m = Math.min(W, H);
    const rPith = m * PITH, rBark = m * BARK;
    // start point: pith end of the core · end state: left edge, mid-height
    const sx = lerp(cx, 0, q), sy = lerp(cy - rPith, H / 2, q);
    const ang = lerp(-Math.PI / 2, 0, q);        // pointing up → pointing right
    const L = lerp(rBark - rPith, W, q);         // core length → full width
    const w = lerp(14, bandH(), q);              // core width → the record band

    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(ang);
    for (let i = 0; i < N; i++) {
      ctx.fillStyle = colFor(i);
      ctx.fillRect((i / N) * L, -w / 2, L / N + 0.6, w);
    }
    // the core's own outline while it still reads as an object
    const edge = 1 - smooth(0.55, 0.9, q);
    if (edge > 0.01) {
      ctx.strokeStyle = `rgba(${BONE},${0.7 * edge})`; ctx.lineWidth = 1;
      ctx.strokeRect(0, -w / 2, L, w);
    }
    ctx.restore();
  }

  /* the corer's path, marked on the stump before it's taken */
  function drawCorePath(alpha) {
    const cx = W / 2, cy = H / 2, m = Math.min(W, H);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.setLineDash([3, 4]);
    ctx.beginPath(); ctx.moveTo(cx, cy - m * PITH); ctx.lineTo(cx, cy - m * BARK);
    ctx.strokeStyle = `rgba(${BONE},0.85)`; ctx.lineWidth = 1.2; ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = "500 10px 'IBM Plex Mono', monospace";
    ctx.textAlign = "left"; ctx.textBaseline = "middle";
    ctx.fillStyle = `rgba(${BONE},0.75)`;
    ctx.fillText("CORE SAMPLE · BARK → PITH", cx + 8, cy - m * (PITH + BARK) / 2);
    ctx.restore();
  }

  /* ── contextual marking: a leader pinned to a year on the laid-flat core ── */
  function mark(year, label, side, alpha) {
    const i = YEARS.findIndex((d) => d[0] === year);
    if (i < 0 || alpha <= 0.01) return;
    const x = ((i + 0.5) / N) * W;
    const half = bandH() / 2;
    const yEdge = side > 0 ? H / 2 - half : H / 2 + half;
    const ly = side > 0 ? yEdge - 26 : yEdge + 26;
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.beginPath(); ctx.moveTo(x, yEdge); ctx.lineTo(x, ly);
    ctx.strokeStyle = `rgba(${BONE},0.6)`; ctx.lineWidth = 1; ctx.setLineDash([2, 3]); ctx.stroke(); ctx.setLineDash([]);
    ctx.beginPath(); ctx.arc(x, yEdge, 2, 0, 7); ctx.fillStyle = `rgba(${BONE},0.95)`; ctx.fill();
    ctx.font = "500 11px 'IBM Plex Mono', monospace";
    // keep labels inside the frame at the extremes of the record
    ctx.textAlign = x < 90 ? "left" : x > W - 90 ? "right" : "center";
    ctx.textBaseline = side > 0 ? "bottom" : "top";
    ctx.fillStyle = `rgba(${BONE},0.9)`;
    ctx.fillText(label, clamp01((x) / W) * W, ly + (side > 0 ? -3 : 3));
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    if (!N) return;

    const aStump = 1 - smooth(0.30, 0.72, q);     // the tree recedes as the core is read
    const aPath = (1 - smooth(0.10, 0.34, q)) * smooth(0.02, 0.12, q);
    const aMarks = smooth(0.80, 0.96, q);         // labels land once it's the record

    if (aStump > 0.01) {
      drawStump(aStump);
      // the pith: where the record begins
      ctx.globalAlpha = aStump;
      ctx.beginPath(); ctx.arc(W / 2, H / 2, Math.min(W, H) * PITH * 0.55, 0, 7);
      ctx.fillStyle = "#10160d"; ctx.fill(); ctx.globalAlpha = 1;
    }
    if (aPath > 0.01) drawCorePath(aPath);

    drawCore(q);

    // contextual markings — the years that carry the argument
    mark(1850, "1850 · baseline", 1, aMarks);
    mark(1970, "1970 · it starts to run hot", -1, aMarks);
    mark(2024, "2024 · +1.60 °C, warmest on record", 1, aMarks);

    // the reading key, swapping as the object does
    ctx.font = "500 10px 'IBM Plex Mono', monospace";
    ctx.textAlign = "left"; ctx.textBaseline = "top";
    ctx.fillStyle = `rgba(${BONE},0.55)`;
    ctx.fillText(q < 0.45 ? "EACH RING = ONE YEAR · PITH 1850 → BARK 2025"
                          : "THE CORE, LAID FLAT · EACH STRIPE = ONE YEAR · 1850 → 2025", 10, 10);
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
    if (hold) return;
    const r = scene.getBoundingClientRect();
    const total = scene.offsetHeight - window.innerHeight;
    // hold the rings a beat before unrolling, and hold the stripes at the end
    q = smooth(0.18, 0.82, clamp01(-r.top / (total || 1)));   // TUNE: unroll window
    draw();
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }

  /* design hook: __record(0) rings · __record(1) stripes · __record(null) → scroll */
  window.__record = (v) => { if (v === null) { hold = false; update(); return; } hold = true; q = clamp01(v); draw(); };
  window.__recordRedraw = draw;   // the CVD toggle calls this

  size();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => { size(); update(); }, { passive: true });
  update();
  requestAnimationFrame(() => { size(); update(); });
  window.addEventListener("load", () => { size(); update(); });
})();
