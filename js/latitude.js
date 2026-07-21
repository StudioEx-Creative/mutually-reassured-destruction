/* ═══════════════════════════════════════════════════════════════════
   MAD — CH 02a · THE SAME WARMING, BY LATITUDE
   ───────────────────────────────────────────────────────────────────
   "Arctic amplification" is a phrase that explains nothing. The thing it
   names is a RACE, so the scene runs it: scroll carries 1980 → 2020 and
   every latitude band grows its own bar. The top band pulls away from the
   rest and never comes back — its lead over the mean widens every single
   decade, 0.66 °C to 1.71 °C. You don't read the amplification, you watch
   it happen.

   The Earth is drawn edge-on and split at the REAL bounds of each band
   (ANOMALY_ZONES carries s/n in degrees), so band thickness comes out of
   the geometry: y = R·sin(lat). The Arctic band is the thinnest sliver on
   screen and warms the most — which is the whole point, and it costs
   nothing to say it honestly because the sphere says it for us.

   HONESTY:
   · Bar length is LINEAR in °C, all bars share one baseline and one scale,
     and the scale is drawn.
   · The dashed line is the area-weighted mean of the bands shown, weighted
     by sin(n)−sin(s) — the actual area of a zone on a sphere. It is
     COMPUTED FROM THE BANDS ON SCREEN, not a separate figure, and the
     caption says so rather than implying a sourced global mean.
   · Decades are the sourced steps (1980…2020). Scroll tweens between them
     for motion, but the readout only ever names a real decade.
   · These are approximate decadal zonal means — the SHAPE of the GISS
     zonal record, not a reproduction of it. The scene says "APPROXIMATE"
     on screen, as data.js does in its comment.

   Data: ANOMALY_ZONES (data.js). prefers-reduced-motion: static at 2020.
   Designer knobs marked TUNE.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  const cv = document.getElementById("latCanvas");
  if (!cv) return;
  const scene = document.getElementById("latScene");
  const ctx = cv.getContext("2d");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const BONE = "242,239,230";
  const EMBER = "255,107,53";
  const ICE = "110,199,232";

  const ZONES = (typeof ANOMALY_ZONES !== "undefined") ? ANOMALY_ZONES : [];
  const DECADES = [1980, 1990, 2000, 2010, 2020];
  const MAXA = 3.2;                              // TUNE: full-scale anomaly, °C

  let W = 0, H = 0, dpr = 1, q = 0;
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const rad = (d) => (d * Math.PI) / 180;

  /* area weight of a zone on a sphere: ∝ sin(n) − sin(s) */
  const weightOf = (z) => Math.sin(rad(z.n)) - Math.sin(rad(z.s));
  const TOTALW = ZONES.reduce((sum, z) => sum + weightOf(z), 0) || 1;

  /* the anomaly of a zone at a (possibly fractional) point in the decades */
  function anomalyAt(z, pos) {
    const i0 = Math.floor(pos), i1 = Math.min(DECADES.length - 1, i0 + 1);
    return lerp(z.d[DECADES[i0]], z.d[DECADES[i1]], pos - i0);
  }
  function meanAt(pos) {
    return ZONES.reduce((sum, z) => sum + anomalyAt(z, pos) * weightOf(z), 0) / TOTALW;
  }

  /* ice → bone → ember, the page's existing anomaly ramp */
  function ramp(t) {
    const stops = [[0, [110, 199, 232]], [0.4, [205, 214, 220]], [0.7, [255, 138, 90]], [1, [255, 107, 53]]];
    let a = stops[0], b = stops[stops.length - 1];
    for (let i = 0; i < stops.length - 1; i++) if (t >= stops[i][0] && t <= stops[i + 1][0]) { a = stops[i]; b = stops[i + 1]; break; }
    const f = (t - a[0]) / (b[0] - a[0] || 1);
    const c = a[1].map((v, i) => Math.round(v + (b[1][i] - v) * f));
    return `rgb(${c[0]},${c[1]},${c[2]})`;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    if (!ZONES.length) return;

    const pos = clamp01(q) * (DECADES.length - 1);
    const decade = DECADES[Math.round(pos)];
    const mean = meanAt(pos);

    /* Layout: the globe on the left, the bars running right from its edge.
       The left margin is sized for the widest latitude label ("64°N–90°N"),
       and the gridlines span only the bands themselves — they were running
       the full canvas height and floating free of the thing they measure. */
    const R = Math.min(H * 0.42, W * 0.19);      // TUNE: globe radius
    const LGUT = 96;                             // TUNE: room for the latitude labels
    const cx = R + LGUT, cy = H * 0.5;
    const x0 = cx + R + 18;                      // bars start clear of the limb
    const barMax = Math.max(80, W - x0 - 76);    // TUNE: leaves room for the values
    const gTop = cy - R - 20, gBot = cy + R + 20;

    // ── the Earth, edge-on, split at the real latitude bounds ──
    ctx.save();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.clip();
    ZONES.forEach((z) => {
      const a = anomalyAt(z, pos);
      // y = R·sin(lat): band thickness IS the geometry, not a design choice
      const yTop = cy - R * Math.sin(rad(z.n));
      const yBot = cy - R * Math.sin(rad(z.s));
      ctx.fillStyle = ramp(clamp01(a / MAXA));
      ctx.globalAlpha = 0.85;
      ctx.fillRect(cx - R, yTop, R * 2, yBot - yTop);
    });
    ctx.globalAlpha = 1;
    ctx.restore();
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7);
    ctx.strokeStyle = `rgba(${BONE},0.30)`; ctx.lineWidth = 1; ctx.stroke();

    // ── the shared scale, drawn so the bars can be trusted ──
    for (let t = 0; t <= 3; t++) {
      const x = x0 + (t / MAXA) * barMax;
      ctx.beginPath(); ctx.moveTo(x, gTop); ctx.lineTo(x, gBot);
      ctx.strokeStyle = `rgba(${BONE},${t === 0 ? 0.28 : 0.08})`; ctx.lineWidth = 1; ctx.stroke();
      ctx.font = "500 9px 'IBM Plex Mono', monospace";
      ctx.textAlign = "center"; ctx.textBaseline = "top";
      ctx.fillStyle = `rgba(${BONE},0.35)`;
      ctx.fillText(`+${t}`, x, gBot + 6);
    }

    // ── one bar per band, from the globe's own band edge ──
    ZONES.forEach((z) => {
      const a = anomalyAt(z, pos);
      const yTop = cy - R * Math.sin(rad(z.n));
      const yBot = cy - R * Math.sin(rad(z.s));
      const yMid = (yTop + yBot) / 2;
      const h = Math.max(3, Math.min(26, (yBot - yTop) * 0.66));   // TUNE: bar weight
      const len = (a / MAXA) * barMax;

      // the track, so a short bar still reads as a share of the scale
      ctx.fillStyle = `rgba(${BONE},0.05)`;
      ctx.fillRect(x0, yMid - h / 2, barMax, h);
      ctx.fillStyle = ramp(clamp01(a / MAXA));
      ctx.fillRect(x0, yMid - h / 2, len, h);

      ctx.font = "500 10px 'IBM Plex Mono', monospace";
      ctx.textAlign = "left"; ctx.textBaseline = "middle";
      ctx.fillStyle = `rgba(${BONE},0.9)`;
      ctx.fillText(`+${a.toFixed(1)}`, x0 + len + 8, yMid);

      // the band's own latitude, on the globe side
      ctx.textAlign = "right";
      ctx.fillStyle = `rgba(${BONE},0.45)`;
      ctx.fillText(labelFor(z), cx - R - 10, yMid);
    });

    // ── the area-weighted mean: what "the same warming" would have looked like ──
    const mx = x0 + (mean / MAXA) * barMax;
    ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(mx, gTop); ctx.lineTo(mx, gBot);
    ctx.strokeStyle = `rgba(${BONE},0.6)`; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = "500 9px 'IBM Plex Mono', monospace";
    ctx.textAlign = "center"; ctx.textBaseline = "bottom";
    ctx.fillStyle = `rgba(${BONE},0.65)`;
    ctx.fillText(`MEAN +${mean.toFixed(1)}`, mx, gTop - 5);

    // ── readout ──
    const arctic = anomalyAt(ZONES[0], pos);
    ctx.textAlign = "left"; ctx.textBaseline = "top";
    ctx.font = "800 " + Math.round(Math.min(64, W * 0.075)) + "px Archivo, sans-serif";
    ctx.fillStyle = `rgba(${BONE},0.97)`;
    ctx.fillText(String(decade) + "s", 12, 10);

    /* State the GAP IN °C, not the ratio.
       The ratio falls across the scene (3.8× in the 1980s to 2.3× in the
       2020s) purely because the early global mean is tiny — a small
       denominator, not an easing of Arctic warming. Scrolling forward would
       show a shrinking multiplier and read as "it's getting better", the
       opposite of the truth. The absolute gap grows every decade
       (0.66 → 1.71 °C) and is exactly the distance the reader can see
       between the dashed mean and the top bar. So show that. */
    const gap = arctic - mean;
    if (gap > 0.2) {
      ctx.font = "500 11px 'IBM Plex Mono', monospace";
      ctx.fillStyle = `rgba(${EMBER},0.95)`;
      ctx.fillText(`THE ARCTIC IS +${gap.toFixed(1)} °C AHEAD OF THE MEAN, AND PULLING AWAY`,
        12, 14 + Math.min(70, W * 0.082));
    }

    ctx.font = "500 9px 'IBM Plex Mono', monospace";
    ctx.textBaseline = "bottom";
    ctx.fillStyle = `rgba(${BONE},0.38)`;
    ctx.fillText("DASHED — AREA-WEIGHTED MEAN OF THE BANDS SHOWN · °C VS 1951–1980 · APPROXIMATE DECADAL ZONAL MEANS", 12, H - 8);
    ctx.textAlign = "right";
    ctx.fillStyle = `rgba(${ICE},0.5)`;
    ctx.fillText("SCROLL TO RUN 1980 → 2020", W - 12, H - 8);
  }

  function labelFor(z) {
    const f = (v) => (v === 0 ? "0°" : Math.abs(v) + "°" + (v > 0 ? "N" : "S"));
    return `${f(z.s)}–${f(z.n)}`;
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
    q = clamp01(-r.top / (total || 1));
    draw();
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }

  window.__lat = (v) => { if (v === null) { hold = false; update(); return; } hold = true; q = clamp01(v); draw(); };

  if (reduce) { q = 1; size(); return; }
  size();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => { size(); update(); }, { passive: true });
  update();
  requestAnimationFrame(() => { size(); update(); });
  window.addEventListener("load", () => { size(); update(); });
})();
