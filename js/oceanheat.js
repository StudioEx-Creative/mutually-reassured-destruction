/* ═══════════════════════════════════════════════════════════════════
   MAD — CH 01 · WHERE THE HEAT WENT
   ───────────────────────────────────────────────────────────────────
   The most under-told number on the page, promoted out of a small card.

   The ocean has absorbed ~90% of the extra heat we have trapped
   (NOAA NCEI / Cheng et al., already cited on the ocean-heat indicator).
   So the warming everyone argues about — the air temperature, the record
   summers — is the LEFTOVER. Roughly one unit in ten, shared between the
   land, the ice and the atmosphere.

   The scene makes that literal: 100 units of trapped heat appear in the
   air, then scroll drops them. Ninety sink into the ocean and keep
   sinking, spreading down the water column past 700 m and 2000 m. Ten
   stay up top. The reveal is the proportion — you watch the sky empty.

   Honesty: the ~90% ocean share is the sourced figure. The remaining
   tenth is NOT split further on screen (land, ice and air each take a
   share, and the atmosphere's is the smallest of all) — we say only what
   the source supports.

   prefers-reduced-motion: draws the settled end state, no drop.
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
  const UNITS = 100;                 // one unit = one hundredth of the heat
  const OCEAN_SHARE = 0.90;          // TUNE (sourced): ~90% into the ocean
  const SURFACE = 0.26;              // TUNE: sea surface, as a fraction of height

  let W = 0, H = 0, dpr = 1, q = 0;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const smooth = (e0, e1, x) => { const t = clamp01((x - e0) / (e1 - e0 || 1e-6)); return t * t * (3 - 2 * t); };
  function rnd(i) { let h = Math.imul(i ^ 0x9e3779b9, 2654435761); return ((h ^ (h >>> 15)) >>> 0) / 4294967295; }

  // each unit: where it starts in the air, and where it ends up
  const units = Array.from({ length: UNITS }, (_, i) => {
    const toOcean = i < UNITS * OCEAN_SHARE;
    return {
      toOcean,
      // start: a loose band in the sky
      sx: 0.06 + rnd(i * 3) * 0.88,
      sy: 0.05 + rnd(i * 3 + 1) * 0.16,
      // end: deep in the column, or still up top
      ex: 0.05 + rnd(i * 5) * 0.90,
      ey: toOcean ? SURFACE + 0.08 + Math.pow(rnd(i * 7), 0.75) * 0.60
                  : 0.06 + rnd(i * 11) * 0.13,
      delay: rnd(i * 13) * 0.35,        // staggered fall
    };
  });

  function drawOcean(heat) {
    const sy = H * SURFACE;
    // the water column, deepening
    const g = ctx.createLinearGradient(0, sy, 0, H);
    g.addColorStop(0, "rgb(46,124,156)");        // TUNE: sunlit surface water
    g.addColorStop(0.45, "rgb(21,72,100)");
    g.addColorStop(1, "rgb(7,26,42)");           // the deep
    ctx.fillStyle = g; ctx.fillRect(0, sy, W, H - sy);
    /* The heat it has taken. 'overlay' on deep blue turns the water muddy
       brown — so tint gently with plain alpha instead: the ocean must still
       read as ocean, or the whole point of the scene is lost. */
    if (heat > 0.01) {
      ctx.fillStyle = `rgba(${EMBER},${heat * 0.14})`;   // TUNE: ocean warming tint
      ctx.fillRect(0, sy, W, H - sy);
    }
    // the surface
    ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(W, sy);
    ctx.strokeStyle = `rgba(${BONE},0.5)`; ctx.lineWidth = 1.2; ctx.stroke();

    // depth markers — the column is 2000 m of real water
    ctx.font = "500 9px 'IBM Plex Mono', monospace";
    ctx.textAlign = "right"; ctx.textBaseline = "middle";
    [["SEA SURFACE", SURFACE], ["700 m", SURFACE + 0.26], ["2000 m", SURFACE + 0.62]].forEach(([lab, fy]) => {
      const y = H * fy;
      ctx.setLineDash([2, 5]);
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W - 78, y);
      ctx.strokeStyle = `rgba(${BONE},0.14)`; ctx.lineWidth = 1; ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = `rgba(${BONE},0.42)`;
      ctx.fillText(lab, W - 10, y);
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    // sky
    ctx.fillStyle = "#070a06"; ctx.fillRect(0, 0, W, H * SURFACE);

    const fall = smooth(0.16, 0.80, q);
    drawOcean(fall);

    // the units
    const s = Math.max(5, Math.min(11, W / 90));    // TUNE: unit size
    units.forEach((u, i) => {
      const t = clamp01((fall - u.delay * 0.5) / (1 - u.delay * 0.5));
      const e = t * t * (3 - 2 * t);
      const x = lerp(u.sx, u.ex, e) * W;
      const y = lerp(u.sy, u.ey, e) * H;
      const settled = u.toOcean ? e > 0.9 : true;
      ctx.fillStyle = `rgba(${EMBER},${u.toOcean ? (settled ? 0.92 : 1) : 1})`;
      ctx.fillRect(x - s / 2, y - s / 2, s, s);
    });

    // labels
    const aStart = 1 - smooth(0.08, 0.24, q);
    const aEnd = smooth(0.72, 0.92, q);
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    if (aStart > 0.01) {
      ctx.globalAlpha = aStart;
      ctx.font = "500 11px 'IBM Plex Mono', monospace";
      ctx.fillStyle = `rgba(${BONE},0.8)`;
      ctx.fillText("EVERY UNIT OF HEAT WE HAVE TRAPPED", W / 2, H * 0.015);
      ctx.globalAlpha = 1;
    }
    if (aEnd > 0.01) {
      ctx.globalAlpha = aEnd;
      // what stayed up top
      ctx.font = "500 10px 'IBM Plex Mono', monospace";
      ctx.textAlign = "left";
      ctx.fillStyle = `rgba(${BONE},0.62)`;
      ctx.fillText("THE LAND, THE ICE, THE AIR — SHARING WHAT'S LEFT", 14, H * 0.20);
      // what went down
      ctx.textAlign = "center";
      ctx.font = "800 " + Math.round(Math.min(74, W * 0.11)) + "px Archivo, sans-serif";
      ctx.fillStyle = `rgba(${BONE},0.96)`;
      ctx.fillText("90%", W / 2, H * (SURFACE + 0.30));
      ctx.font = "500 11px 'IBM Plex Mono', monospace";
      ctx.fillStyle = `rgba(${BONE},0.72)`;
      ctx.fillText("OF THE HEAT WENT INTO THE OCEAN", W / 2, H * (SURFACE + 0.30) + Math.min(80, W * 0.12));
      ctx.globalAlpha = 1;
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

  window.__heat = (v) => { if (v === null) { hold = false; update(); return; } hold = true; q = clamp01(v); draw(); };

  if (reduce) { q = 1; size(); return; }
  size();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => { size(); update(); }, { passive: true });
  update();
  requestAnimationFrame(() => { size(); update(); });
  window.addEventListener("load", () => { size(); update(); });
})();
