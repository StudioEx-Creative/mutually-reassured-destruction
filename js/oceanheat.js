/* ═══════════════════════════════════════════════════════════════════
   MAD — CH 01 · THE OCEAN IS TAKING THE HEAT
   ───────────────────────────────────────────────────────────────────
   The most under-told number on the page. The ocean has absorbed about
   90% of the extra heat we have trapped (IPCC AR6), so the warming we
   argue about — the air, the record summers — is the tenth that's left.

   The first version dropped a hundred squares into blue water. It read as
   confetti, not as heat, and it carried no time: the ocean's defining fact
   is that the heat NEVER STOPS GOING IN and keeps reaching DEEPER. So this
   version is the ocean drawn as its own instrument — the temperature-depth
   profile the Argo floats measure — scrubbed across 1960 → 2024.

   What scroll does: runs the decades. The warm layer thickens and pushes
   downward, and the ocean-heat-content readout climbs the real NOAA /
   Cheng et al. curve from −100 to +360 zettajoules. It only ever rises,
   and it accelerates. You watch the heat drill into the sea.

   What the reader does: a depth probe follows the cursor (or touch). Drag
   it down the column to read the depth in metres and whether the warming
   of the selected year has reached that far. Scroll is time; the probe is
   depth — two axes to explore the same fact.

   HONESTY
   · The heat-content numbers ARE the sourced series (data.js · INDICATORS
     'ohc', NOAA NCEI / Cheng et al., 0–2000 m, zettajoules vs 1981–2010).
     The big number and the sparkline read straight off it.
   · The VERTICAL DISTRIBUTION of that heat — how the colour and the warm
     front deepen — is schematic: surface-intensified and deepening, which
     is the true shape of ocean warming, but not a reproduction of a
     depth-resolved dataset. The scene says "SCHEMATIC PROFILE" on screen.
   · The ~90% share is stated as context, not split further: land, ice and
     air share the rest and the atmosphere's cut is the smallest, but we
     name only what the source supports.

   prefers-reduced-motion: draws the settled 2024 state, no scrub.
   Designer knobs marked TUNE.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  const cv = document.getElementById("heatCanvas");
  if (!cv) return;
  const scene = document.getElementById("heatScene");
  const ctx = cv.getContext("2d");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const BONE = "242,239,230";
  const EMBER = "255,107,53";
  const ICE = "110,199,232";

  // the sourced record: [year, ocean heat content in ZJ vs 1981–2010]
  const SERIES = (typeof INDICATORS !== "undefined"
    ? (INDICATORS.find((d) => d.id === "ohc") || {}).series
    : null) || [[1960, -100], [1980, -60], [2000, 80], [2010, 180], [2020, 290], [2024, 360]];
  const Y0 = SERIES[0][0], Y1 = SERIES[SERIES.length - 1][0];
  const OHC_MIN = SERIES[0][1], OHC_MAX = SERIES[SERIES.length - 1][1];

  const SURF = 0.16;                 // TUNE: sea surface, fraction of height
  const BEDF = 0.92;                 // TUNE: 2000 m, fraction of height
  const DEEP_M = 2000;               // the column is 2000 m of real water

  let W = 0, H = 0, dpr = 1, q = 0;
  let probeY = null;                 // depth probe, in canvas px (null = hidden)
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const smooth = (e0, e1, x) => { const t = clamp01((x - e0) / (e1 - e0 || 1e-6)); return t * t * (3 - 2 * t); };

  function ohcAt(year) {
    if (year <= SERIES[0][0]) return SERIES[0][1];
    if (year >= SERIES[SERIES.length - 1][0]) return SERIES[SERIES.length - 1][1];
    for (let i = 0; i < SERIES.length - 1; i++)
      if (year <= SERIES[i + 1][0]) {
        const f = (year - SERIES[i][0]) / (SERIES[i + 1][0] - SERIES[i][0]);
        return lerp(SERIES[i][1], SERIES[i + 1][1], f);
      }
    return SERIES[SERIES.length - 1][1];
  }

  const ySurf = () => H * SURF, yBed = () => H * BEDF;
  const yToMetres = (y) => clamp((y - ySurf()) / (yBed() - ySurf()), 0, 1) * DEEP_M;
  const metresToY = (m) => ySurf() + (m / DEEP_M) * (yBed() - ySurf());

  // cold deep water → warm surface, blended by the frame's warmth field
  function water(df, warm) {
    // df: 0 at surface → 1 at 2000 m.  base column: sunlit blue to dark deep
    const cold = [
      Math.round(lerp(38, 7, df)),
      Math.round(lerp(104, 26, df)),
      Math.round(lerp(140, 42, df)),
    ];
    const e = [255, 107, 53];
    const k = clamp01(warm);
    return `rgb(${Math.round(lerp(cold[0], e[0], k))},${Math.round(lerp(cold[1], e[1], k))},${Math.round(lerp(cold[2], e[2], k))})`;
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const year = Math.round(lerp(Y0, Y1, clamp01(q)));
    const ohc = ohcAt(lerp(Y0, Y1, clamp01(q)));
    const w = clamp01((ohc - OHC_MIN) / (OHC_MAX - OHC_MIN || 1));   // 0 in 1960 → 1 in 2024
    const sy = ySurf(), by = yBed();

    // how deep the strong warming has reached this year. Surface-intensified:
    // most ocean warming sits in the upper few hundred metres, so the front
    // stays shallow and the deep stays blue — honest, and it keeps the
    // readouts legible against water that isn't all ember.
    const frontM = lerp(120, 820, w);               // TUNE: warm-front depth, metres
    const frontFrac = frontM / DEEP_M;

    // ── sky strip: the tenth that stays up ──
    ctx.fillStyle = "#070a06"; ctx.fillRect(0, 0, W, sy);

    // ── the water column, warmed from the top down ──
    const BANDS = 80;
    for (let i = 0; i < BANDS; i++) {
      const df0 = i / BANDS, df1 = (i + 1) / BANDS;
      const df = (df0 + df1) / 2;
      // warmth at this depth: intense at the surface, fading to zero at the
      // front, nothing below — the real vertical shape of ocean warming
      const warm = w * Math.pow(clamp01(1 - df / (frontFrac || 1e-6)), 1.2);
      ctx.fillStyle = water(df, warm);
      const y0 = lerp(sy, by, df0), y1 = lerp(sy, by, df1);
      ctx.fillRect(0, y0, W, y1 - y0 + 1);
    }
    // the deep below 2000 m, unmeasured, held cold
    ctx.fillStyle = water(1, 0); ctx.fillRect(0, by, W, H - by);

    // sea surface
    ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(W, sy);
    ctx.strokeStyle = `rgba(${BONE},0.5)`; ctx.lineWidth = 1.2; ctx.stroke();

    // ── the warm front: how deep the ocean has warmed, descending with time ──
    const fy = metresToY(frontM);
    ctx.setLineDash([7, 5]);
    // start clear of the top-left readout — in early years the front is shallow
    ctx.beginPath(); ctx.moveTo(W * 0.42, fy); ctx.lineTo(W - 96, fy);
    ctx.strokeStyle = `rgba(${EMBER},0.75)`; ctx.lineWidth = 1.4; ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = "500 10px 'IBM Plex Mono', monospace";
    ctx.textAlign = "right"; ctx.textBaseline = "bottom";
    ctx.fillStyle = `rgba(${EMBER},0.95)`;
    ctx.fillText(`WARMING REACHES ≈ ${Math.round(frontM / 10) * 10} m`, W - 12, fy - 5);

    // depth reference markers
    ctx.font = "500 9px 'IBM Plex Mono', monospace";
    ctx.textAlign = "right"; ctx.textBaseline = "middle";
    [[700, "700 m"], [2000, "2000 m"]].forEach(([m, lab]) => {
      const y = metresToY(m);
      ctx.setLineDash([2, 5]);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W - 96, y);
      ctx.strokeStyle = `rgba(${BONE},0.13)`; ctx.lineWidth = 1; ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = `rgba(${BONE},0.4)`;
      ctx.fillText(lab, W - 12, y);
    });

    // ── the depth probe: what the reader is pointing at ──
    if (probeY != null) {
      const py = clamp(probeY, sy + 2, by);
      const m = Math.round(yToMetres(py) / 10) * 10;
      const reached = yToMetres(py) <= frontM;
      const c = reached ? EMBER : ICE;
      ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(W, py);
      ctx.strokeStyle = `rgba(${c},0.9)`; ctx.lineWidth = 1; ctx.stroke();
      ctx.beginPath(); ctx.arc(W * 0.5, py, 3.5, 0, 7); ctx.fillStyle = `rgba(${c},1)`; ctx.fill();
      ctx.font = "500 11px 'IBM Plex Mono', monospace";
      ctx.textAlign = "center"; ctx.textBaseline = py < sy + 60 ? "top" : "bottom";
      ctx.fillStyle = `rgba(${c},1)`;
      const off = py < sy + 60 ? 8 : -9;
      ctx.fillText(`${m} m · ${reached ? `the ocean has warmed this deep by ${year}` : "still cold — for now"}`, W * 0.5, py + off);
    }

    // ── the readout: the year, and the sourced heat-content number climbing ──
    const big = Math.round(Math.min(60, W * 0.072));
    // dark scrim first — the number is ember, and so is the water it sits on
    scrim(0, sy, W * 0.54, big * 2.4 + 44, "left");
    ctx.textAlign = "left"; ctx.textBaseline = "top";
    ctx.font = "800 " + Math.round(Math.min(58, W * 0.07)) + "px Archivo, sans-serif";
    ctx.fillStyle = `rgba(${BONE},0.97)`;
    ctx.fillText(String(year), 14, sy + 12);
    ctx.font = "800 " + big + "px Archivo, sans-serif";
    ctx.fillStyle = `rgba(${EMBER},0.98)`;
    const zj = (ohc >= 0 ? "+" : "−") + Math.abs(Math.round(ohc));
    ctx.fillText(zj + " ZJ", 14, sy + 12 + big * 0.98);
    ctx.font = "500 10px 'IBM Plex Mono', monospace";
    ctx.fillStyle = `rgba(${BONE},0.6)`;
    ctx.fillText("0–2000 m OCEAN HEAT CONTENT vs 1981–2010", 16, sy + 16 + big * 2.0);
    ctx.fillText("NOAA / CHENG ET AL. · SCHEMATIC PROFILE", 16, sy + 16 + big * 2.0 + 14);

    // the framing that made the point in the first place
    ctx.textAlign = "left"; ctx.textBaseline = "bottom";
    ctx.font = "500 11px 'IBM Plex Mono', monospace";
    ctx.fillStyle = `rgba(${BONE},0.72)`;
    ctx.fillText("≈ 90% OF ALL THE HEAT WE HAVE TRAPPED IS DOWN HERE", 14, H - 40);
    ctx.fillStyle = `rgba(${BONE},0.42)`;
    ctx.fillText("THE AIR KEPT ABOUT A TENTH — THAT TENTH IS THE WARMING WE ARGUE ABOUT", 14, H - 24);

    // ── the sparkline: proof the curve only rises, and accelerates ──
    drawSpark(ohc);

    // hint
    ctx.textAlign = "right"; ctx.textBaseline = "bottom";
    ctx.font = "500 9px 'IBM Plex Mono', monospace";
    ctx.fillStyle = `rgba(${ICE},0.5)`;
    ctx.fillText(reduce ? "" : "SCROLL: 1960 → 2024 · HOVER: PROBE THE DEPTH", W - 12, H - 12);
  }

  // a soft dark wash so ember text/marks stay legible over ember water
  function scrim(x, y, w, h, side) {
    const g = ctx.createLinearGradient(x, 0, x + w, 0);
    const dark = "rgba(7,10,6,";
    if (side === "left") { g.addColorStop(0, dark + "0.62)"); g.addColorStop(0.7, dark + "0.4)"); g.addColorStop(1, dark + "0)"); }
    else { g.addColorStop(0, dark + "0)"); g.addColorStop(0.3, dark + "0.4)"); g.addColorStop(1, dark + "0.62)"); }
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
  }

  function drawSpark(ohcNow) {
    const sw = Math.min(200, W * 0.28), sh = 54;
    // in the deep water, clear of the readout, the warm front and the labels
    const sx = W - sw - 16, syk = H * 0.54;
    scrim(sx - 20, syk - 22, sw + 36, sh + 44, "right");
    // axes baseline (the 1981–2010 zero)
    const vx = (yr) => sx + ((yr - Y0) / (Y1 - Y0)) * sw;
    const vy = (v) => syk + sh - ((v - OHC_MIN) / (OHC_MAX - OHC_MIN || 1)) * sh;
    const zeroY = vy(0);
    ctx.setLineDash([2, 4]);
    ctx.beginPath(); ctx.moveTo(sx, zeroY); ctx.lineTo(sx + sw, zeroY);
    ctx.strokeStyle = `rgba(${BONE},0.2)`; ctx.lineWidth = 1; ctx.stroke();
    ctx.setLineDash([]);
    // the record
    ctx.beginPath();
    SERIES.forEach((p, i) => { const x = vx(p[0]), y = vy(p[1]); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.strokeStyle = `rgba(${EMBER},0.85)`; ctx.lineWidth = 2; ctx.lineJoin = "round"; ctx.stroke();
    // the year we're on
    const yr = lerp(Y0, Y1, clamp01(q));
    ctx.beginPath(); ctx.arc(vx(yr), vy(ohcNow), 3, 0, 7);
    ctx.fillStyle = `rgba(${BONE},1)`; ctx.fill();
    ctx.font = "500 8px 'IBM Plex Mono', monospace";
    ctx.textAlign = "left"; ctx.textBaseline = "top";
    ctx.fillStyle = `rgba(${BONE},0.5)`;
    ctx.fillText("HEAT CONTENT, 1960–2024", sx, syk - 12);
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

  // the depth probe follows the cursor / touch over the canvas
  function pointer(e) {
    const r = cv.getBoundingClientRect();
    const cy = (e.touches ? e.touches[0].clientY : e.clientY) - r.top;
    probeY = cy; draw();
    if (e.touches) e.preventDefault();
  }
  function clearProbe() { probeY = null; draw(); }

  window.__heat = (v) => { if (v === null) { hold = false; update(); return; } hold = true; q = clamp01(v); draw(); };

  cv.addEventListener("mousemove", pointer, { passive: true });
  cv.addEventListener("mouseleave", clearProbe, { passive: true });
  cv.addEventListener("touchmove", pointer, { passive: false });
  cv.addEventListener("touchend", clearProbe, { passive: true });

  if (reduce) { q = 1; size(); return; }
  size();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => { size(); update(); }, { passive: true });
  update();
  requestAnimationFrame(() => { size(); update(); });
  window.addEventListener("load", () => { size(); update(); });
})();
