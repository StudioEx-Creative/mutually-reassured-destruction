/* ═══════════════════════════════════════════════════════════════════
   MAD — CH 01 · THE RECORD, IN RINGS  →  UNROLLED INTO STRIPES
   ───────────────────────────────────────────────────────────────────
   Not animation over the data — the instrument the data came from.

   "The planet keeps its own books." Its books ARE tree rings:
   dendroclimatology is literally how the temperature record is known
   before thermometers. So the 1850–2025 series is drawn as what it is —
   a stump, one growth ring per year, 1850 at the pith, 2025 at the bark,
   each ring coloured by that year's anomaly. The argument is legible
   before a word is read: the cool blues sit at the core, and the ember
   band is the BARK. The record runs hot at the edge.

   Then scroll UNROLLS the whole tree. Every ring's angle becomes vertical
   position and its radius becomes horizontal position, so the concentric
   record opens continuously into Ed Hawkins' warming stripes. The entire
   record transforms — every ring becomes a stripe, nothing discarded.
   Same numbers, two readings: the geometry changes, the data does not.

   The mid-morph is a lens — the rings caught between wound and unwound.
   That is the moment, not an artefact: keep it.

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
  const SAMPLES = 84;             // TUNE: angular resolution (ring smoothness)
  const PITH = 0.11, BARK = 0.44; // TUNE: inner/outer radius as a fraction of min(W,H)

  let W = 0, H = 0, dpr = 1, q = 0;   // q: 0 = rings, 1 = stripes
  // the unrolled record reads as a band — stripes in print, not a full-bleed wash
  const bandH = () => Math.min(H * 0.46, 300);   // TUNE: unrolled band height

  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const smooth = (e0, e1, x) => { const t = clamp01((x - e0) / (e1 - e0 || 1e-6)); return t * t * (3 - 2 * t); };

  const YEARS = (typeof HEAT_STRIPES !== "undefined" ? HEAT_STRIPES : []);
  const N = YEARS.length;
  const vals = YEARS.map((d) => d[1]);
  const MIN = Math.min(...vals), MAX = Math.max(...vals);

  /* colour ramp — shared with the stripes, including the colour-blind-safe
     palette when the reader has toggled it (P2-4). */
  function ramp(t) {
    const brand = [[0, [42, 111, 140]], [0.35, [110, 199, 232]], [0.5, [205, 214, 220]], [0.72, [178, 58, 20]], [1, [255, 107, 53]]];
    const on = (typeof stripesCVD !== "undefined") && stripesCVD;
    const stops = on && typeof STRIPES_CVD !== "undefined" ? STRIPES_CVD : brand;
    let a = stops[0], b = stops[stops.length - 1];
    for (let i = 0; i < stops.length - 1; i++) if (t >= stops[i][0] && t <= stops[i + 1][0]) { a = stops[i]; b = stops[i + 1]; break; }
    const f = (t - a[0]) / (b[0] - a[0] || 1);
    const c = a[1].map((v, i) => Math.round(v + (b[1][i] - v) * f));
    return `rgb(${c[0]},${c[1]},${c[2]})`;
  }
  const colFor = (i) => ramp(clamp01((YEARS[i][1] - MIN) / (MAX - MIN || 1)));

  /* THE UNROLL.
     A year sits at radius rt (0 = pith/1850, 1 = bark/2025) and angle θ.
       wound   → (cx + cosθ·R, cy + sinθ·R)
       unwound → radius becomes horizontal position, angle becomes vertical
     Lerping between the two opens the tree into the chart. The lens shape
     mid-way is the record caught between the two readings. */
  function pt(rt, theta, wob) {
    const cx = W / 2, cy = H / 2;
    const R = Math.min(W, H) * lerp(PITH, BARK, rt);
    const px = cx + Math.cos(theta) * R * wob;
    const py = cy + Math.sin(theta) * R * wob * 0.94;
    const bh = bandH();
    const sx = rt * W;                                   // pith → left, bark → right
    const sy = (theta / (Math.PI * 2)) * bh + (H - bh) / 2;  // once round → top to bottom
    return [lerp(px, sx, q), lerp(py, sy, q)];
  }

  /* one year: the annulus between rt0 and rt1, morphing into its stripe */
  function band(i) {
    const t0 = i / N, t1 = (i + 1) / N;
    const w = 1 - q;   // rings are a record, not circles; irregularity unwinds too
    const wobAt = (th) => 1 + (0.05 * Math.sin(th * 3 + i * 0.21) + 0.028 * Math.sin(th * 7 - i * 0.13)) * w;
    ctx.beginPath();
    for (let s = 0; s <= SAMPLES; s++) {
      const th = (s / SAMPLES) * Math.PI * 2;
      const [x, y] = pt(t1, th, wobAt(th));
      s ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    for (let s = SAMPLES; s >= 0; s--) {
      const th = (s / SAMPLES) * Math.PI * 2;
      const [x, y] = pt(t0, th, wobAt(th));
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = colFor(i);
    ctx.fill();
  }

  /* ── contextual markings: they land once the record is legible, so they
       annotate rather than float over the morph ── */
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
    ctx.textAlign = x < 90 ? "left" : x > W - 90 ? "right" : "center";
    ctx.textBaseline = side > 0 ? "bottom" : "top";
    ctx.fillStyle = `rgba(${BONE},0.9)`;
    ctx.fillText(label, x, ly + (side > 0 ? -3 : 3));
    ctx.restore();
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    if (!N) return;

    for (let i = 0; i < N; i++) band(i);   // the whole record, wound → unwound


    // contextual markings — the years that carry the argument
    const aMarks = smooth(0.82, 0.97, q);
    mark(1850, "1850 · baseline", 1, aMarks);
    mark(1970, "1970 · it starts to run hot", -1, aMarks);
    mark(2024, "2024 · +1.60 °C, warmest on record", 1, aMarks);

    // the reading key, swapping as the geometry does
    ctx.font = "500 10px 'IBM Plex Mono', monospace";
    ctx.textAlign = "left"; ctx.textBaseline = "top";
    ctx.fillStyle = `rgba(${BONE},0.55)`;
    ctx.fillText(q < 0.45 ? "EACH RING = ONE YEAR · PITH 1850 → BARK 2025"
                          : "UNROLLED · EACH STRIPE = ONE YEAR · 1850 → 2025", 10, 10);
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
    // hold the tree a beat, unroll, then hold the stripes
    q = smooth(0.18, 0.82, clamp01(-r.top / (total || 1)));   // TUNE: unroll window
    draw();
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }

  /* design hook: __record(0) tree · __record(1) stripes · __record(null) → scroll */
  window.__record = (v) => { if (v === null) { hold = false; update(); return; } hold = true; q = clamp01(v); draw(); };
  window.__recordRedraw = draw;   // the colour-blind toggle calls this

  size();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => { size(); update(); }, { passive: true });
  update();
  requestAnimationFrame(() => { size(); update(); });
  window.addEventListener("load", () => { size(); update(); });
})();
