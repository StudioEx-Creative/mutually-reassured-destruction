/* ═══════════════════════════════════════════════════════════════════
   MAD — CH 01 · THE ICE CORE  ·  the archive that is also melting
   ───────────────────────────────────────────────────────────────────
   The second of the planet's books. Tree rings hold the temperature;
   ice holds the AIR — actual bubbles of the actual atmosphere, sealed
   the year they fell as snow. An ice core is not a metaphor for the
   record. It IS the record: the only reason anyone can say what the air
   held before we were measuring it.

   So the core is drawn as an object being raised from the ice, depth =
   time, with the CO₂ it carries traced down its length:
     · the long calm       ≈280 ppm — the air, before us (NOAA GML)
     · the instrumental    1958 → 2025, the real Mauna Loa series
     · the top             430.5 ppm, May 2025 — the first month above 430

   And then the turn, which is the whole point of putting it here:
   THIS ARCHIVE IS MELTING. Greenland ~270 and Antarctica ~140 Gt a year
   (GRACE-FO) — counted live beneath the core. The record of the air is
   being destroyed by what we did to the air.

   HONESTY: the deep 800,000-year (EPICA Dome C) series is deliberately
   NOT drawn — it isn't verified in this build. The core shows a marked
   SCALE BREAK: the instrumental record at true resolution above, an
   explicitly compressed "before us" band below held at the sourced 280.
   No unverified long-baseline claim goes on screen. See DATA-SOURCES.md.

   prefers-reduced-motion: renders the finished core, static, no scrub.
   Designer knobs marked TUNE.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  const cv = document.getElementById("coreCanvas");
  if (!cv) return;
  const scene = document.getElementById("coreScene");
  const ctx = cv.getContext("2d");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const BONE = "239,236,229";
  const ICE = "110,199,232";
  const EMBER = "255,107,53";

  let W = 0, H = 0, dpr = 1, q = 0;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const smooth = (e0, e1, x) => { const t = clamp01((x - e0) / (e1 - e0 || 1e-6)); return t * t * (3 - 2 * t); };
  function rnd(i) { let h = Math.imul(i ^ 0x9e3779b9, 2654435761); return ((h ^ (h >>> 15)) >>> 0) / 4294967295; }

  /* the real instrumental record, straight off the CO₂ indicator */
  const CO2 = (typeof INDICATORS !== "undefined"
    ? (INDICATORS.find((d) => d.id === "co2") || {}).series || []
    : []);
  const PRE = (typeof CO2_PREINDUSTRIAL !== "undefined") ? CO2_PREINDUSTRIAL : 280;
  const PPM_MIN = 260, PPM_MAX = 440;          // TUNE: horizontal ppm scale

  /* geometry: the core is a tall cylinder. Top = now, down = back in time.
     BREAK splits true-resolution instrumental (above) from the compressed,
     explicitly-labelled "before us" band (below). */
  const CORE_W = () => Math.min(150, W * 0.20);   // TUNE: core width
  const BREAK = 0.62;                              // TUNE: where the scale breaks

  function coreRect() {
    const w = CORE_W();
    const x = W * 0.30 - w / 2;                    // TUNE: core sits left of the trace
    const top = H * 0.10, bot = H * 0.92;
    return { x, w, top, bot, h: bot - top };
  }

  /* ppm → x, for the trace drawn alongside the core */
  function ppmX(ppm) {
    const t = clamp01((ppm - PPM_MIN) / (PPM_MAX - PPM_MIN));
    const c = coreRect();
    return lerp(c.x + c.w + 24, W - 26, t);        // TUNE: trace field
  }

  /* depth → y. yr is a year for the instrumental part; the deep band is
     addressed by t (0 at the break, 1 at the bottom). */
  function yearY(yr) {
    const c = coreRect();
    const y0 = CO2.length ? CO2[0][0] : 1958, y1 = CO2.length ? CO2[CO2.length - 1][0] : 2025;
    const t = clamp01((yr - y0) / (y1 - y0 || 1));   // 0 = oldest, 1 = now
    return lerp(c.top + c.h * BREAK, c.top, t);      // now at the TOP
  }

  function drawCore(reveal) {
    const c = coreRect();
    // the core is raised out of the ice: revealed from the top down
    const cut = c.top + c.h * reveal;               // the drill head's current depth

    ctx.save();
    ctx.beginPath();
    ctx.rect(c.x - 2, c.top, c.w + 4, c.h * reveal);
    ctx.clip();

    // the ice itself
    const g = ctx.createLinearGradient(c.x, 0, c.x + c.w, 0);   // TUNE: ice tone
    g.addColorStop(0, "rgba(110,199,232,0.18)");
    g.addColorStop(0.38, "rgba(206,238,250,0.52)");
    g.addColorStop(0.72, "rgba(140,210,236,0.30)");
    g.addColorStop(1, "rgba(110,199,232,0.14)");
    ctx.fillStyle = g;
    ctx.fillRect(c.x, c.top, c.w, c.h);

    // annual layers — thin bands, tighter with depth as the ice compresses
    for (let i = 0; i < 150; i++) {
      const t = i / 150;
      const y = c.top + c.h * (t * t * 0.55 + t * 0.45);   // compression with depth
      ctx.beginPath(); ctx.moveTo(c.x, y); ctx.lineTo(c.x + c.w, y);
      ctx.strokeStyle = `rgba(${BONE},${0.05 + rnd(i) * 0.07})`;
      ctx.lineWidth = 0.6; ctx.stroke();
    }
    // trapped air: the actual atmosphere, sealed
    for (let i = 0; i < 90; i++) {
      const bx = c.x + 6 + rnd(i * 3) * (c.w - 12);
      const by = c.top + rnd(i * 3 + 1) * c.h;
      const r = 0.6 + rnd(i * 3 + 2) * 1.9;
      ctx.beginPath(); ctx.arc(bx, by, r, 0, 7);
      ctx.fillStyle = `rgba(${BONE},${0.10 + rnd(i * 7) * 0.30})`; ctx.fill();
    }
    ctx.restore();

    // the cylinder's edge, as far as it has been raised
    if (reveal > 0.005) {
      ctx.strokeStyle = `rgba(${BONE},0.45)`; ctx.lineWidth = 1;
      ctx.strokeRect(c.x, c.top, c.w, c.h * reveal);
    }

    // the drill's cut, riding down as the core is raised
    if (reveal > 0.01 && reveal < 0.99) {
      ctx.beginPath(); ctx.moveTo(c.x - 10, cut); ctx.lineTo(c.x + c.w + 10, cut);
      ctx.strokeStyle = `rgba(${BONE},0.8)`; ctx.lineWidth = 1.4; ctx.stroke();
    }
  }

  /* the CO₂ the core carries, traced down its length */
  function drawTrace(reveal) {
    const c = coreRect();
    const breakY = c.top + c.h * BREAK;

    // ── the compressed "before us" band: the sourced 280 baseline ──
    const preX = ppmX(PRE);
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(preX, c.bot); ctx.lineTo(preX, breakY);
    ctx.strokeStyle = `rgba(${ICE},0.85)`; ctx.lineWidth = 2; ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();

    // the scale break — declared, not hidden
    ctx.save();
    ctx.setLineDash([2, 4]);
    ctx.beginPath(); ctx.moveTo(c.x - 14, breakY); ctx.lineTo(W - 20, breakY);
    ctx.strokeStyle = `rgba(${BONE},0.28)`; ctx.lineWidth = 1; ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = "500 9px 'IBM Plex Mono', monospace";
    ctx.textAlign = "right"; ctx.textBaseline = "bottom";
    ctx.fillStyle = `rgba(${BONE},0.45)`;
    ctx.fillText("SCALE BREAK · BELOW IS COMPRESSED, NOT TO DEPTH", W - 20, breakY - 4);
    ctx.restore();

    // ── the instrumental record, at true resolution ──
    if (!CO2.length) return;
    const shown = clamp01((reveal - 0.15) / 0.7);
    ctx.beginPath();
    let started = false;
    for (let i = 0; i < CO2.length; i++) {
      const [yr, ppm] = CO2[i];
      const t = i / (CO2.length - 1);
      if (t > shown) break;
      const x = ppmX(ppm), y = yearY(yr);
      started ? ctx.lineTo(x, y) : (ctx.moveTo(ppmX(PRE), breakY), ctx.lineTo(x, y), started = true);
    }
    ctx.strokeStyle = `rgba(${EMBER},0.95)`; ctx.lineWidth = 2.4; ctx.stroke();

    // where it is now
    if (shown > 0.98) {
      const [yr, ppm] = CO2[CO2.length - 1];
      const x = ppmX(ppm), y = yearY(yr);
      ctx.beginPath(); ctx.arc(x, y, 3.5, 0, 7); ctx.fillStyle = `rgba(${EMBER},1)`; ctx.fill();
    }
  }

  function label(x, y, lines, align) {
    ctx.font = "500 10px 'IBM Plex Mono', monospace";
    ctx.textAlign = align || "left"; ctx.textBaseline = "top";
    lines.forEach((ln, i) => {
      ctx.fillStyle = i === 0 ? `rgba(${BONE},0.92)` : `rgba(${BONE},0.55)`;
      ctx.fillText(ln, x, y + i * 13);
    });
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);
    const c = coreRect();
    const reveal = reduce ? 1 : smooth(0.05, 0.72, q);

    drawCore(reveal);
    drawTrace(reveal);

    const aLab = reduce ? 1 : smooth(0.55, 0.85, q);
    if (aLab > 0.01) {
      ctx.globalAlpha = aLab;
      // the top of the core: now. Sits left of the point so it can't clip out.
      const nowY = yearY(CO2.length ? CO2[CO2.length - 1][0] : 2025);
      label(ppmX(430.5) - 10, nowY + 6, ["430.5 ppm · May 2025", "first month above 430"], "right");
      // the long calm
      label(ppmX(PRE) + 8, c.top + c.h * (BREAK + 0.16), ["≈280 ppm", "the air, before us"], "left");
      ctx.globalAlpha = 1;
    }

    // the key
    ctx.font = "500 10px 'IBM Plex Mono', monospace";
    ctx.textAlign = "left"; ctx.textBaseline = "top";
    ctx.fillStyle = `rgba(${BONE},0.55)`;
    ctx.fillText("AN ICE CORE · DEPTH = TIME · THE BUBBLES ARE THE ACTUAL AIR", 10, 10);
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

  window.__core = (v) => { if (v === null) { hold = false; update(); return; } hold = true; q = clamp01(v); draw(); };

  if (reduce) { size(); return; }
  size();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => { size(); update(); }, { passive: true });
  update();
  requestAnimationFrame(() => { size(); update(); });
  window.addEventListener("load", () => { size(); update(); });
})();
