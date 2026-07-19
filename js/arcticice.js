/* ═══════════════════════════════════════════════════════════════════
   MAD — CH 01 · WHAT THE ARCTIC LOST
   ───────────────────────────────────────────────────────────────────
   The September minimum: the least ice the Arctic holds each year, at the
   end of the melt season. Promoted out of its card because it is the most
   legible loss on the page — a shape that used to be bigger.

   Every ring here is a SOURCED year from the NSIDC series already in
   data.js. The 1980 outline stays on screen throughout as the reference:
   the dark gap between it and the present ice is what has gone.

   TWO HONESTY RULES, both load-bearing:

   1 · AREA-TRUE. Radius is sqrt(area/π), so a ring's AREA is proportional
       to the extent in million km². Scaling by radius instead would
       exaggerate the loss by squaring it — the commonest way this chart is
       cheated, and the one a critic would screenshot.

   2 · IT LURCHES, AND WE SHOW IT. The record minimum was 2012 (3.39), and
       2024 (4.28) is larger. The ice does not decline smoothly and the
       scene must not pretend otherwise: the reader can scrub back and see
       2012 was worse than today. The trend is the point (~-12%/decade
       against 1981–2010), not any single year.

   The shape is one fixed schematic outline, scaled — so years nest and the
   comparison is fair. It is NOT a map, and says so on screen.

   prefers-reduced-motion: draws the final state with all rings, no tween.
   Designer knobs marked TUNE.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  const cv = document.getElementById("iceCanvas");
  if (!cv) return;
  const scene = document.getElementById("iceScene");
  const ctx = cv.getContext("2d");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const BONE = "242,239,230";
  const ICE = "110,199,232";
  const EMBER = "255,107,53";

  // sourced September minima (million km²) — NSIDC, via the arctic indicator
  const SERIES = (typeof INDICATORS !== "undefined"
    ? (INDICATORS.find((d) => d.id === "arctic") || {}).series || []
    : []);
  const N = SERIES.length;
  const BASE = N ? SERIES[0][1] : 7.7;          // 1980 reference extent

  let W = 0, H = 0, dpr = 1, q = 0;
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const lerp = (a, b, t) => a + (b - a) * t;

  /* the schematic outline: one fixed shape, so every year nests fairly */
  const LOBES = 7;
  function shapeR(theta) {                       // unit radius at an angle
    return 1 + 0.13 * Math.sin(theta * 3 + 0.7) + 0.07 * Math.sin(theta * LOBES - 1.2)
             + 0.045 * Math.sin(theta * 11 + 2.1);
  }
  // AREA-TRUE: radius ∝ sqrt(extent). See honesty rule 1 above.
  function radiusFor(extent) {
    const unit = Math.min(W, H) * 0.37;          // TUNE: 1980 fills this
    return unit * Math.sqrt(extent / BASE);
  }
  function ring(extent, style, fill) {
    const cx = W / 2, cy = H * 0.54, R = radiusFor(extent);   // TUNE: clear of the readout
    ctx.beginPath();
    for (let s = 0; s <= 120; s++) {
      const th = (s / 120) * Math.PI * 2;
      const r = R * shapeR(th);
      const x = cx + Math.cos(th) * r, y = cy + Math.sin(th) * r * 0.92;
      s ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (style) { ctx.strokeStyle = style.c; ctx.lineWidth = style.w; if (style.dash) ctx.setLineDash(style.dash); ctx.stroke(); ctx.setLineDash([]); }
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    if (!N) return;

    // where we are in the series (smooth tween, discrete sourced labels)
    const pos = clamp01(q) * (N - 1);
    const i0 = Math.floor(pos), i1 = Math.min(N - 1, i0 + 1), f = pos - i0;
    const extent = lerp(SERIES[i0][1], SERIES[i1][1], f);
    const year = SERIES[f > 0.5 ? i1 : i0][0];
    const shown = SERIES[f > 0.5 ? i1 : i0][1];

    // the 1980 reference — where the ice used to reach
    ring(BASE, { c: `rgba(${BONE},0.55)`, w: 1.4, dash: [5, 5] }, "rgba(110,199,232,0.05)");

    // every sourced year already passed, left as a faint trace
    for (let i = 1; i <= i0; i++) ring(SERIES[i][1], { c: `rgba(${ICE},0.20)`, w: 1 }, null);

    // this year's ice
    ring(extent, { c: `rgba(${ICE},0.95)`, w: 2 }, "rgba(110,199,232,0.30)");

    // readout
    const lost = ((BASE - shown) / BASE) * 100;
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    ctx.font = "800 " + Math.round(Math.min(80, W * 0.13)) + "px Archivo, sans-serif";
    ctx.fillStyle = `rgba(${BONE},0.97)`;
    ctx.fillText(String(year), W / 2, H * 0.055);
    ctx.font = "500 11px 'IBM Plex Mono', monospace";
    ctx.fillStyle = `rgba(${ICE},0.9)`;
    ctx.fillText(`${shown.toFixed(2)} MILLION KM² AT THE SEPTEMBER MINIMUM`, W / 2, H * 0.055 + Math.min(86, W * 0.14));
    if (lost > 0.5) {
      ctx.fillStyle = `rgba(${EMBER},0.95)`;
      ctx.fillText(`${lost.toFixed(0)}% BELOW 1980`, W / 2, H * 0.055 + Math.min(86, W * 0.14) + 18);
    }

    // the dashed line is doing work — say what it is
    ctx.font = "500 9px 'IBM Plex Mono', monospace";
    ctx.textAlign = "left"; ctx.fillStyle = `rgba(${BONE},0.42)`;
    ctx.fillText("DASHED — WHERE THE ICE REACHED IN 1980", 12, H - 40);
    ctx.fillText("AREA-TRUE · SHAPE IS SCHEMATIC, NOT A MAP", 12, H - 26);

    /* 2012 was worse than today. Name it where it happens, so the scene can
       never be read as a smooth slide — the ice lurches. */
    if (year === 2012) {
      ctx.textAlign = "center";
      ctx.font = "500 10px 'IBM Plex Mono', monospace";
      ctx.fillStyle = `rgba(${EMBER},0.9)`;
      ctx.fillText("THE RECORD LOW — LOWER THAN TODAY. THE ICE LURCHES.", W / 2, H - 58);
    }
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

  window.__ice = (v) => { if (v === null) { hold = false; update(); return; } hold = true; q = clamp01(v); draw(); };

  if (reduce) { q = 1; size(); return; }
  size();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => { size(); update(); }, { passive: true });
  update();
  requestAnimationFrame(() => { size(); update(); });
  window.addEventListener("load", () => { size(); update(); });
})();
