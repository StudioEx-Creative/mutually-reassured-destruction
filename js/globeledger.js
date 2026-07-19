/* ═══════════════════════════════════════════════════════════════════
   MAD — CH 03a · WHO PUT THE CARBON THERE, ON THE GLOBE
   ───────────────────────────────────────────────────────────────────
   Bars rank; a globe locates. Responsibility for the carbon is a fact of
   GEOGRAPHY — which places burned it — and that is what a globe shows and
   a bar chart cannot.

   But the real argument is the switch. The same world, read three ways:
     cumulative since 1850 → the old industrial powers stand tallest
     annual today          → China towers, the US falls back
     per person            → the ranking rearranges again
   Toggling the tabs rebuilds the world. That disagreement IS the ledger's
   argument, and no single view of it is the whole truth.

   HONESTY:
   · Column height is LINEAR in the value (never area or volume — a cube
     scaled by value overstates it by a factor of the cube).
   · Columns rise vertically ON SCREEN rather than radially out of the sphere.
     Radial looks better and lies: the projection foreshortens whatever faces
     the reader, which drew the United States (24.3%) shorter than Russia
     (6.9%). Comparison is the point, so height gets an honest shared axis.
   · Orthographic hides the far side, so scroll rotates the globe and the
     back face is dimmed rather than dropped, so nothing is silently absent.
   · The sphere carries a graticule, not coastlines — this is a schematic of
     where emissions came from, not a map, and it says so.

   Data: LEDGER_STATES + COUNTRY_COORDS (data.js). Shares the ledger tabs.
   prefers-reduced-motion: static, front-on, no rotation.
   Designer knobs marked TUNE.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  const cv = document.getElementById("gvCanvas");
  if (!cv) return;
  const scene = document.getElementById("gvScene");
  const ctx = cv.getContext("2d");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const BONE = "242,239,230";
  const EMBER = "255,107,53";

  const STATES = (typeof LEDGER_STATES !== "undefined") ? LEDGER_STATES : [];
  const COORD = Object.assign({}, (typeof COUNTRY_COORDS !== "undefined") ? COUNTRY_COORDS : {},
    { "EU (excl. above)": [50.0, 10.0] });      // central Europe, for the bloc

  const MODES = {
    cumPct: { key: "cumPct", unit: "%", label: "SHARE OF ALL CO₂ SINCE 1850" },
    annPct: { key: "annPct", unit: "%", label: "SHARE OF 2024 EMISSIONS" },
    perCap: { key: "perCap", unit: " t", label: "TONNES PER PERSON, PER YEAR" },
  };
  const modeNow = () => MODES[(typeof statesView !== "undefined" && MODES[statesView]) ? statesView : "cumPct"];

  let W = 0, H = 0, dpr = 1, spin = 0;
  const clamp01 = (v) => Math.min(1, Math.max(0, v));
  const rad = (d) => (d * Math.PI) / 180;

  /* Every major emitter sits in the northern hemisphere, so we look DOWN on
     it. At a shallow tilt they crowded the top limb and their columns pointed
     away from the reader; from above they spread across the visible face. */
  const PHI = rad(30);                          // TUNE: viewing tilt

  function project(lat, lng, rMul, R) {
    const la = rad(lat), lo = rad(lng) - spin;
    const cl = Math.cos(la), sl = Math.sin(la);
    const z = Math.sin(PHI) * sl + Math.cos(PHI) * cl * Math.cos(lo);
    const x = R * rMul * (cl * Math.sin(lo));
    const y = R * rMul * (Math.cos(PHI) * sl - Math.sin(PHI) * cl * Math.cos(lo));
    return { x: W / 2 + x, y: H * CY - y, z };
  }

  const CY = 0.58;                              // TUNE: globe sits low, columns get the headroom

  function draw() {
    ctx.clearRect(0, 0, W, H);
    /* The columns are the argument, not the sphere. Keep the globe modest so
       the heights carry the comparison instead of decorating a big green ball. */
    const R = Math.min(W, H) * 0.26;            // TUNE: globe size
    const cx = W / 2, cy = H * CY;
    const M = modeNow();

    // the sphere
    const g = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
    g.addColorStop(0, "rgba(45,85,55,0.55)");   // forest-lit: the living world
    g.addColorStop(1, "rgba(10,20,14,0.95)");
    ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = `rgba(${BONE},0.22)`; ctx.lineWidth = 1; ctx.stroke();

    // graticule — context, not coastlines
    ctx.strokeStyle = `rgba(${BONE},0.10)`; ctx.lineWidth = 0.8;
    for (let lat = -60; lat <= 60; lat += 30) {
      ctx.beginPath(); let started = false;
      for (let lng = -180; lng <= 180; lng += 4) {
        const p = project(lat, lng, 1, R);
        if (p.z <= 0) { started = false; continue; }
        started ? ctx.lineTo(p.x, p.y) : (ctx.moveTo(p.x, p.y), started = true);
      }
      ctx.stroke();
    }
    for (let lng = -180; lng < 180; lng += 30) {
      ctx.beginPath(); let started = false;
      for (let lat = -85; lat <= 85; lat += 3) {
        const p = project(lat, lng, 1, R);
        if (p.z <= 0) { started = false; continue; }
        started ? ctx.lineTo(p.x, p.y) : (ctx.moveTo(p.x, p.y), started = true);
      }
      ctx.stroke();
    }

    // columns — height LINEAR in the value
    const vals = STATES.map((s) => s[M.key]).filter((v) => v != null);
    const max = Math.max(...vals, 0.0001);
    /* Columns rise VERTICALLY IN SCREEN SPACE, not radially out of the sphere.
       Radial columns are foreshortened by the projection: a country facing the
       reader points away from them and collapses to a stub, so the United
       States at 24.3% drew SHORTER than Russia at 6.9%. Height is the whole
       comparison, so it gets its own axis — every column is measured against
       the same vertical, and the globe's job is only to say where. */
    const TALL = R * 1.15;                      // TUNE: tallest column, in pixels
    const cols = STATES.map((s) => {
      const c = COORD[s.name];
      if (!c) return null;
      const v = s[M.key];
      if (v == null) return null;
      const base = project(c[0], c[1], 1, R);
      const tip = { x: base.x, y: base.y - (v / max) * TALL, z: base.z };
      return { s, v, base, tip };
    }).filter(Boolean).sort((a, b) => a.base.z - b.base.z);   // far side first

    const labels = [];
    cols.forEach(({ s, v, base, tip }) => {
      const front = base.z > 0;
      // the far side is DIMMED, not dropped — nothing silently absent
      const a = front ? 1 : 0.18;
      /* Each column gets its own full-height track. Bases sit at different
         heights on the sphere, so tips align deceptively — Russia at 6.9%
         reached the same screen height as the US at 24.3%. Against a track
         the eye reads the PROPORTION, exactly as the bars below do. */
      if (front) {
        ctx.beginPath(); ctx.moveTo(base.x, base.y); ctx.lineTo(base.x, base.y - TALL);
        ctx.strokeStyle = `rgba(${BONE},0.09)`; ctx.lineWidth = 4; ctx.lineCap = "butt";
        ctx.stroke();
      }
      ctx.beginPath(); ctx.moveTo(base.x, base.y); ctx.lineTo(tip.x, tip.y);
      ctx.strokeStyle = `rgba(${EMBER},${0.9 * a})`;
      ctx.lineWidth = front ? 4 : 2.5; ctx.lineCap = "round";
      ctx.stroke();
      ctx.beginPath(); ctx.arc(tip.x, tip.y, front ? 3 : 2, 0, 7);
      ctx.fillStyle = `rgba(${EMBER},${a})`; ctx.fill();
      if (front && v / max > 0.22)              // label only what's readable
        labels.push({ text: `${s.name} ${v}${M.unit}`, tip, side: tip.x > cx ? 1 : -1 });
    });

    /* Labels are collected, then placed — because drawing them as we go
       clipped the leftmost name off the canvas and stacked Germany on top of
       the EU. Two passes: push apart vertically per side, then clamp inside
       the frame. A leader line keeps each name tied to its column. */
    ctx.font = "500 10px 'IBM Plex Mono', monospace";
    ctx.textBaseline = "middle";
    const LINE = 14;                            // TUNE: minimum gap between names
    [-1, 1].forEach((side) => {
      const set = labels.filter((l) => l.side === side).sort((a, b) => a.tip.y - b.tip.y);
      let lastY = -Infinity;
      set.forEach((l) => {
        l.y = Math.max(l.tip.y, lastY + LINE);
        lastY = l.y;
        // x is always the text's RIGHT edge, clamped to keep the name on canvas
        const w = ctx.measureText(l.text).width;
        l.x = side > 0
          ? Math.min(W - 10, l.tip.x + 8 + w)
          : Math.max(10 + w, l.tip.x - 8);
      });
    });
    labels.forEach((l) => {
      const w = ctx.measureText(l.text).width;
      const near = l.side > 0 ? l.x - w : l.x;   // the edge facing the column
      if (Math.abs(l.y - l.tip.y) > 2) {         // it moved — show where it belongs
        ctx.beginPath();
        ctx.moveTo(l.tip.x + l.side * 4, l.tip.y);
        ctx.lineTo(near - l.side * 4, l.y);
        ctx.strokeStyle = `rgba(${BONE},0.22)`; ctx.lineWidth = 0.8; ctx.stroke();
      }
      ctx.textAlign = "right";
      ctx.fillStyle = `rgba(${BONE},0.92)`;
      ctx.fillText(l.text, l.x, l.y);
    });

    // the reading key
    ctx.font = "500 10px 'IBM Plex Mono', monospace";
    ctx.textAlign = "left"; ctx.textBaseline = "top";
    ctx.fillStyle = `rgba(${BONE},0.6)`;
    ctx.fillText(M.label, 12, 12);
    ctx.fillStyle = `rgba(${BONE},0.38)`;
    ctx.fillText("HEIGHTS ARE VERTICAL AND LINEAR, SO THEY COMPARE DIRECTLY · SCHEMATIC, NOT A MAP", 12, H - 24);
    ctx.textAlign = "right";
    ctx.fillText("SCROLL TO SPIN · SWITCH THE LEDGER ABOVE", W - 12, H - 24);
  }

  function size() {
    const r = cv.getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    W = Math.max(1, r.width); H = Math.max(1, r.height);
    cv.width = W * dpr; cv.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  let ticking = false;
  function update() {
    ticking = false;
    const r = scene.getBoundingClientRect();
    const total = scene.offsetHeight - window.innerHeight;
    const q = clamp01(-r.top / (total || 1));
    spin = reduce ? rad(-20) : (q - 0.5) * Math.PI * 2.1;   // TUNE: spin range
    draw();
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }

  window.__globeLedger = draw;   // the ledger tabs call this on switch

  size();
  if (!reduce) window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", () => { size(); update(); }, { passive: true });
  update();
  requestAnimationFrame(() => { size(); update(); });
  window.addEventListener("load", () => { size(); update(); });
})();
