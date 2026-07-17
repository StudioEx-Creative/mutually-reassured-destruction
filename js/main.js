/* ═══════════════════════════════════════════════════════════════════
   MUTUALLY REASSURED DESTRUCTION — MAIN
   Blueprint × StudioEX, 2026. Vanilla JS, no framework.
   ═══════════════════════════════════════════════════════════════════ */
"use strict";
const byId = (id) => document.getElementById(id);
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ═══ STATE ═══ */
let ranking = [];            // ordered priority indices = the user's ranking
let selectedCountry = null;  // [name, iso, rating, perCap, contactUrl]
let indSort = "departure";
let restoringState = false;  // guards saveState() while loadState() runs
let hydrated = false;        // saveState() is inert until init + loadState finish
let letterEdited = false;    // true once the user hand-edits the letter body
const STATE_KEY = "mad-state-v1"; // localStorage key (P1-8), never sent anywhere

/* ═══ FORMAT ═══ */
const famColor = (f) => (f === "ice" ? getCss("--ice") : getCss("--ember"));
function getCss(v) { return getComputedStyle(document.documentElement).getPropertyValue(v).trim(); }

/* ═══ BACKGROUND CANVAS (slow ember/ice motes) ═══ */
function initBg() {
  const c = byId("bg");
  if (!c || reduceMotion) return;
  const ctx = c.getContext("2d");
  let ps = [], w, h;
  function size() {
    w = c.width = innerWidth; h = c.height = innerHeight;
    ps = Array.from({ length: Math.min(46, Math.floor(innerWidth / 28)) }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: Math.random() * 1.4 + 0.3, s: Math.random() * 0.18 + 0.04,
      ice: Math.random() > 0.55, a: Math.random() * 0.4 + 0.1,
    }));
  }
  size(); addEventListener("resize", size, { passive: true });
  (function loop() {
    ctx.clearRect(0, 0, w, h);
    for (const p of ps) {
      p.y -= p.s; if (p.y < -4) { p.y = h + 4; p.x = Math.random() * w; }
      ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7);
      ctx.fillStyle = p.ice ? `rgba(110,199,232,${p.a * 0.5})` : `rgba(255,107,53,${p.a * 0.5})`;
      ctx.fill();
    }
    requestAnimationFrame(loop);
  })();
}

/* ═══ LIVE TICKERS — since page open (P0-6) ═══
   CO₂ (GCP 2025 rate), tropical forest lost (GFW 2024 rate), and a literal
   countdown of the remaining 1.5 °C budget (50% chance, GCP 2025). */
const pageOpened = performance.now();
const budgetExhaust = new Date(BUDGET_EXHAUST_DATE).getTime();
function budgetCountdown() {
  let ms = budgetExhaust - Date.now();
  if (ms <= 0) return "budget exhausted";
  const day = 86400000;
  let totalDays = Math.floor(ms / day);
  const years = Math.floor(totalDays / 365); totalDays -= years * 365;
  const months = Math.floor(totalDays / 30); const days = totalDays - months * 30;
  const rem = ms % day;
  const hh = String(Math.floor(rem / 3600000)).padStart(2, "0");
  const mm = String(Math.floor((rem % 3600000) / 60000)).padStart(2, "0");
  const ss = String(Math.floor((rem % 60000) / 1000)).padStart(2, "0");
  return `${years}y ${months}m ${days}d ${hh}:${mm}:${ss}`;
}
function tickers() {
  const secs = (performance.now() - pageOpened) / 1000;
  const co2 = byId("ticker");
  if (co2) co2.textContent = Math.floor(CO2_PER_SECOND * secs).toLocaleString();
  const fo = byId("tickerForest");
  if (fo) fo.textContent = (FOREST_PER_SECOND * secs).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const bn = byId("tickerBudget")?.querySelector(".ticker-budget-num");
  if (bn) bn.textContent = budgetCountdown();
  const ig = byId("iceGreenland"); if (ig) ig.textContent = Math.floor(GREENLAND_PER_SEC * secs).toLocaleString();
  const ia = byId("iceAntarctica"); if (ia) ia.textContent = Math.floor(ANTARCTICA_PER_SEC * secs).toLocaleString();
  requestAnimationFrame(tickers);
}

/* ═══ SCROLL REVEAL ═══ */
function initReveal() {
  const els = document.querySelectorAll(".rv");
  if (reduceMotion) { els.forEach((e) => e.classList.add("on")); return; }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("on"); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
  els.forEach((e) => io.observe(e));
}

/* ═══ SPARKLINE ═══ */
function sparkline(series, color) {
  const xs = series.map((d) => d[0]), ys = series.map((d) => d[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const W = 100, H = 36, pad = 3;
  const px = (x) => pad + ((x - minX) / (maxX - minX || 1)) * (W - pad * 2);
  const py = (y) => H - pad - ((y - minY) / (maxY - minY || 1)) * (H - pad * 2);
  const pts = series.map((d) => `${px(d[0]).toFixed(1)},${py(d[1]).toFixed(1)}`);
  const area = `M${pts[0]} L${pts.join(" L")} L${px(maxX).toFixed(1)},${H} L${px(minX).toFixed(1)},${H} Z`;
  const last = series[series.length - 1];
  return `<svg class="spark" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true">
    <path d="${area}" fill="${color}" opacity="0.08"/>
    <polyline points="${pts.join(" ")}" fill="none" stroke="${color}" stroke-width="1.3" vector-effect="non-scaling-stroke"/>
    <circle cx="${px(last[0]).toFixed(1)}" cy="${py(last[1]).toFixed(1)}" r="1.6" fill="${color}"/>
  </svg>`;
}

/* ═══ CHAPTER 01 · INDICATOR CARDS ═══ */
function sortIndicators() {
  const arr = INDICATORS.map((d, i) => ({ d, i }));
  if (indSort === "alpha") arr.sort((a, b) => a.d.name.localeCompare(b.d.name));
  else arr.sort((a, b) => b.d[indSort] - a.d[indSort]);
  return arr.map((x) => x.i);
}
function buildCards() {
  const grid = byId("cardGrid");
  if (!grid) return;
  const order = sortIndicators();
  grid.innerHTML = order.map((i) => {
    const d = INDICATORS[i];
    const col = d.family === "ice" ? "var(--ice)" : "var(--ember)";
    return `<button class="indcard ${d.family === "ice" ? "ice" : "heat"}" data-i="${i}" data-source-id="${d.src}" aria-label="${d.name}, ${d.value} ${d.unit}. Tap for source and method.">
      <div class="indcard-top">
        <span class="indcard-name">${d.name}</span>
        <span class="indcard-fam fam-${d.family === "ice" ? "ice" : "heat"}"></span>
      </div>
      <div class="indcard-val">${d.value}<span>${d.unit}</span></div>
      <div class="indcard-val2">${d.value2}</div>
      ${sparkline(d.series, col)}
      <div class="indcard-cap">${d.caption}</div>
      <div class="indcard-more">Source &amp; method · accessed ${SOURCES[d.src].d} →</div>
    </button>`;
  }).join("");
  grid.querySelectorAll(".indcard").forEach((b) =>
    b.addEventListener("click", () => openDetail(+b.dataset.i)));
}
function initSort() {
  document.querySelectorAll(".sortbtn").forEach((b) => b.addEventListener("click", () => {
    document.querySelectorAll(".sortbtn").forEach((x) => x.classList.remove("on"));
    b.classList.add("on"); indSort = b.dataset.sort; buildCards();
  }));
}

/* detail panel */
function openDetail(i) {
  const d = INDICATORS[i], s = SOURCES[d.src];
  const ov = byId("detailOv"), box = byId("detailBox");
  box.className = "detail-box " + (d.family === "ice" ? "ice" : "heat");
  byId("detailFam").textContent = (d.family === "ice" ? "Cryosphere & ocean" : "Carbon & heat");
  byId("detailFam").style.color = d.family === "ice" ? "var(--ice)" : "var(--ember)";
  byId("detailTitle").textContent = d.name;
  byId("detailVal").textContent = d.value + " " + d.unit + " · " + d.value2;
  byId("detailMethod").textContent = d.method;
  byId("detailSrc").innerHTML = `Source: <a href="${s.url}" target="_blank" rel="noopener">${s.label} ↗</a> · accessed ${s.d}`;
  drawDetailChart(d);
  ov.classList.add("open"); document.body.style.overflow = "hidden";
}
window.closeDetail = function () { byId("detailOv").classList.remove("open"); document.body.style.overflow = ""; };
byId("detailOv")?.addEventListener("click", (e) => { if (e.target.id === "detailOv") window.closeDetail(); });
addEventListener("keydown", (e) => { if (e.key === "Escape") window.closeDetail(); });

function drawDetailChart(d) {
  const svg = byId("detailChart");
  const col = d.family === "ice" ? "var(--ice)" : "var(--ember)";
  const xs = d.series.map((p) => p[0]), ys = d.series.map((p) => p[1]);
  const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
  const W = 560, H = 160, pad = 24;
  const px = (x) => pad + ((x - minX) / (maxX - minX || 1)) * (W - pad * 2);
  const py = (y) => H - pad - ((y - minY) / (maxY - minY || 1)) * (H - pad * 2);
  const pts = d.series.map((p) => `${px(p[0]).toFixed(1)},${py(p[1]).toFixed(1)}`);
  svg.innerHTML = `
    <line x1="${pad}" y1="${H - pad}" x2="${W - pad}" y2="${H - pad}" stroke="#20272f"/>
    <path d="M${pts[0]} L${pts.join(" L")} L${px(maxX)},${H - pad} L${px(minX)},${H - pad} Z" fill="${col}" opacity="0.1"/>
    <polyline points="${pts.join(" ")}" fill="none" stroke="${col}" stroke-width="2" vector-effect="non-scaling-stroke"/>
    <text x="${pad}" y="${H - 6}" fill="#58626c" font-family="monospace" font-size="10">${minX}</text>
    <text x="${W - pad}" y="${H - 6}" fill="#58626c" font-family="monospace" font-size="10" text-anchor="end">${maxX}</text>`;
}

/* ═══ HEAT STRIPES ═══ */
let stripesCVD = false; // colour-blind-safe palette toggle (P2-4)
function buildStripes() {
  const wrap = byId("stripes");
  if (!wrap) return;
  const ys = HEAT_STRIPES.map((d) => d[1]);
  const min = Math.min(...ys), max = Math.max(...ys);
  wrap.innerHTML = HEAT_STRIPES.map(([yr, v]) => {
    const t = (v - min) / (max - min || 1); // 0..1
    return `<span class="stripe" style="background:${stripeColor(t)}" title="${yr}: ${v >= 0 ? "+" : ""}${v.toFixed(2)} °C"></span>`;
  }).join("");
}
function rampColor(stops, t) {
  let a = stops[0], b = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) if (t >= stops[i][0] && t <= stops[i + 1][0]) { a = stops[i]; b = stops[i + 1]; break; }
  const f = (t - a[0]) / (b[0] - a[0] || 1);
  const c = a[1].map((v, i) => Math.round(v + (b[1][i] - v) * f));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
function stripeColor(t) {
  const brand = [[0, [42, 111, 140]], [0.35, [110, 199, 232]], [0.5, [205, 214, 220]], [0.72, [178, 58, 20]], [1, [255, 107, 53]]];
  return rampColor(stripesCVD ? STRIPES_CVD : brand, t);
}
window.toggleStripePalette = function () {
  stripesCVD = !stripesCVD;
  const b = byId("cvdToggle");
  if (b) { b.setAttribute("aria-pressed", String(stripesCVD)); b.classList.toggle("on", stripesCVD); b.textContent = stripesCVD ? "Brand palette" : "High-contrast palette"; }
  buildStripes();
  if (typeof window.__recordRedraw === "function") window.__recordRedraw(); // the rings share the palette
};

/* ═══ P2-1 · FOREST-COVER RIBBON ═══ */
function buildForestRibbon() {
  const wrap = byId("forestRibbon");
  if (!wrap) return;
  const max = Math.max(...FOREST_RIBBON.map((d) => d[1]));
  const min = Math.min(...FOREST_RIBBON.map((d) => d[1]));
  wrap.innerHTML = FOREST_RIBBON.map(([yr, mha]) => {
    const t = (mha - min) / (max - min || 1); // 0..1 loss intensity
    // faint slate → ember, darkness ∝ loss
    const col = rampColor([[0, [26, 42, 34]], [0.5, [122, 74, 40]], [1, [255, 107, 53]]], t);
    return `<span class="fr-cell" style="background:${col}" title="${yr}: ${mha} Mha lost"></span>`;
  }).join("");
}

/* ═══ P2-2 · WHAT WORKS ═══ */
function buildProgress() {
  const el = byId("progressBlock");
  if (!el) return;
  const r = PROGRESS.renewables, o = PROGRESS.ozone;
  el.innerHTML = `
    <div class="pg-eyebrow">Not prophecy, and not only loss — what works</div>
    <div class="pg-grid">
      <div class="pg-card">
        <div class="pg-stat ice">${r.stat}</div>
        <div class="pg-body">${r.body}</div>
        <div class="pg-caveat">${r.caveat}</div>
        <div class="pg-src"><a href="${r.url}" target="_blank" rel="noopener">${r.src} ↗</a></div>
      </div>
      <div class="pg-card">
        <div class="pg-stat ice">${o.stat}</div>
        <div class="pg-body">${o.body}</div>
        <div class="pg-lesson">${o.lesson}</div>
        <div class="pg-src"><a href="${o.url}" target="_blank" rel="noopener">${o.src} ↗</a></div>
      </div>
    </div>`;
}

/* ═══ P2-3 · STICKY CHAPTER-NAV PILL ═══ */
function initNavpill() {
  const pill = byId("navpill");
  if (!pill) return;
  let dismissed = false, lastY = window.scrollY;
  pill.querySelector(".np-close")?.addEventListener("click", () => { dismissed = true; });
  const onScroll = () => {
    if (dismissed) return;
    const y = window.scrollY, past = y > window.innerHeight * 0.9;
    if (!past) { pill.setAttribute("hidden", ""); lastY = y; return; }
    // hide on scroll-down, reveal on scroll-up
    if (y > lastY + 6) pill.setAttribute("hidden", "");
    else if (y < lastY - 6) pill.removeAttribute("hidden");
    lastY = y;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/* ═══ CHAPTER 02 · LATITUDINAL ANOMALY BAND ═══
   Illustrative zonal anomalies (°C vs 1951–1980), strongest in the Arctic —
   the shape of NASA GISS zonal-mean warming. */
function buildAnomaly() {
  const wrap = byId("anomalyWrap");
  if (!wrap) return;
  // [latitude label, anomaly °C] from ~90N to 90S — Arctic amplification visible
  const bands = [
    ["80–90°N", 3.4], ["60–80°N", 2.6], ["40–60°N", 1.9], ["20–40°N", 1.5],
    ["0–20°N", 1.2], ["0–20°S", 1.0], ["20–40°S", 0.9], ["40–60°S", 0.7], ["60–90°S", 0.6],
  ];
  const maxA = 3.6;
  const rows = bands.map(([lab, a]) => {
    const t = a / maxA;
    return `<g>
      <rect x="0" y="0" width="100%" height="34" fill="${anomalyColor(t)}"></rect>
      <text x="12" y="22" fill="#06080a" font-family="IBM Plex Mono, monospace" font-size="11" font-weight="600">${lab}</text>
      <text x="98%" y="22" fill="#06080a" font-family="IBM Plex Mono, monospace" font-size="11" text-anchor="end" font-weight="600">+${a.toFixed(1)} °C</text>
    </g>`;
  });
  wrap.innerHTML = `<svg class="anomaly-svg" viewBox="0 0 600 ${bands.length * 35}" preserveAspectRatio="none" role="img" aria-label="Temperature anomaly by latitude band, strongest in the Arctic">
    ${bands.map(([lab, a], i) => {
      const t = a / maxA;
      return `<g transform="translate(0,${i * 35})">
        <rect x="0" y="0" width="600" height="34" fill="${anomalyColor(t)}"></rect>
        <text x="12" y="22" fill="#06080a" font-family="IBM Plex Mono, monospace" font-size="12" font-weight="600">${lab}</text>
        <text x="588" y="22" fill="#06080a" font-family="IBM Plex Mono, monospace" font-size="12" text-anchor="end" font-weight="600">+${a.toFixed(1)} °C</text>
      </g>`;
    }).join("")}
  </svg>`;
}
function anomalyColor(t) {
  const stops = [[0, [110, 199, 232]], [0.4, [205, 214, 220]], [0.7, [255, 138, 90]], [1, [255, 107, 53]]];
  let a = stops[0], b = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) if (t >= stops[i][0] && t <= stops[i + 1][0]) { a = stops[i]; b = stops[i + 1]; break; }
  const f = (t - a[0]) / (b[0] - a[0] || 1);
  const c = a[1].map((v, i) => Math.round(v + (b[1][i] - v) * f));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

/* ═══ CHAPTER 03 · LEDGER ═══ */
let statesView = "cumPct";
function buildStates() {
  const wrap = byId("statesBars");
  if (!wrap) return;
  const unit = statesView === "perCap" ? " t" : "%";
  const sorted = [...LEDGER_STATES].sort((a, b) => b[statesView] - a[statesView]);
  const max = Math.max(...sorted.map((s) => s[statesView]));
  wrap.innerHTML = sorted.map((s) => {
    const w = (s[statesView] / max) * 100;
    const bad = /insufficient|critically/i.test(s.cat);
    const col = bad ? "var(--ember)" : "var(--ice)";
    return `<div class="bar-row">
      <div class="bar-name">${s.name}</div>
      <div class="bar-track"><div class="bar-fill" style="background:${col}" data-w="${w.toFixed(1)}"></div></div>
      <div class="bar-val">${s[statesView]}${unit}</div>
    </div>
    <div class="bar-meta" style="grid-column:2/3;margin-top:-.3rem;margin-bottom:.2rem">CAT rating: ${s.cat}</div>`;
  }).join("");
  byId("statesNote").innerHTML = LEDGER_NOTE.replace(/Our World in Data.*$/, '<a href="https://ourworldindata.org/co2-emissions" target="_blank" rel="noopener">Our World in Data / Global Carbon Project ↗</a>; <a href="https://climateactiontracker.org/" target="_blank" rel="noopener">Climate Action Tracker ↗</a>.');
  animateBars(wrap);
}
function initStatesTabs() {
  document.querySelectorAll(".ledger-tab").forEach((t) => t.addEventListener("click", () => {
    document.querySelectorAll(".ledger-tab").forEach((x) => x.classList.remove("on"));
    t.classList.add("on"); statesView = t.dataset.view; buildStates();
  }));
}
function animateBars(wrap) {
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { wrap.querySelectorAll(".bar-fill").forEach((b) => b.style.width = b.dataset.w + "%"); io.disconnect(); }
  }), { threshold: 0.15 });
  io.observe(wrap);
}
const OWN_LABEL = { investor: "Investor-owned", state: "State-owned", nation: "Nation-state" };
function buildMajors() {
  byId("majorsBig").textContent = CARBON_MAJORS_STAT.headline;
  byId("majorsBody").innerHTML = CARBON_MAJORS_STAT.body + ` <a href="https://carbonmajors.org/" target="_blank" rel="noopener" style="color:var(--ice)">Carbon Majors 2024 ↗</a>`;
  byId("subsidyBig").textContent = CARBON_MAJORS_STAT.subsidy;
  byId("subsidyBody").innerHTML = CARBON_MAJORS_STAT.subsidyBody + ` <a href="https://www.imf.org/en/Topics/climate-change/energy-subsidies" target="_blank" rel="noopener" style="color:var(--ice)">IMF ↗</a>`;

  const max = Math.max(...CARBON_MAJORS.map((m) => m.cum));
  const bars = CARBON_MAJORS.map((m, i) =>
    `<button class="maj-row" data-i="${i}" aria-label="${m.name}, ${m.cum}% of cumulative CO₂, ${OWN_LABEL[m.own]}">
      <span class="maj-name">${m.name}</span>
      <span class="maj-track"><span class="maj-fill ${m.own}" style="width:0" data-w="${((m.cum / max) * 100).toFixed(1)}"></span></span>
      <span class="maj-val">${m.cum}%</span>
    </button>`).join("");

  byId("majorsList").innerHTML =
    `<div class="majors-legend">
      <span><i class="own-dot investor"></i>Investor-owned</span>
      <span><i class="own-dot state"></i>State-owned company</span>
      <span><i class="own-dot nation"></i>Nation-state production</span>
      <span class="majors-hint">tap a producer ↓</span>
    </div>
    <div class="maj-axis">share of all fossil &amp; cement CO₂ since 1854</div>
    <div class="maj-axis-note">read as a core tray · each core is what that producer pulled out of the ground</div>
    <div class="majors-bars" id="majorsBars">${bars}</div>
    <div class="majors-detail" id="majorsDetail" aria-live="polite">${majorDetailHTML(0)}</div>`;

  const rows = byId("majorsBars");
  rows.querySelectorAll(".maj-row").forEach((b) => {
    const show = () => { byId("majorsDetail").innerHTML = majorDetailHTML(+b.dataset.i);
      rows.querySelectorAll(".maj-row").forEach((r) => r.classList.toggle("on", r === b)); };
    b.addEventListener("click", show);
    b.addEventListener("mouseenter", show);
    b.addEventListener("focus", show);
  });
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { rows.querySelectorAll(".maj-fill").forEach((f) => f.style.width = f.dataset.w + "%"); io.disconnect(); } }), { threshold: 0.1 });
  io.observe(rows);
}
function majorDetailHTML(i) {
  const m = CARBON_MAJORS[i];
  return `<div class="md-name">${m.name}</div>
    <div class="md-tags"><span class="own-badge ${m.own}">${OWN_LABEL[m.own]}</span><span class="md-hq">${m.hq}</span></div>
    <div class="md-stats">
      <span><b>${m.cum}%</b> of all CO₂ since 1854</span>
      ${m.y2024 ? `<span><b>${m.y2024}%</b> of 2024 emissions</span>` : ""}
      ${m.rev ? `<span><b>${m.rev}</b> · 2024 revenue</span>` : ""}
    </div>
    <div class="md-leader">${m.leader}</div>
    <div class="md-src">Source: <a href="https://carbonmajors.org/" target="_blank" rel="noopener">InfluenceMap · Carbon Majors 2024 ↗</a> · CEOs verified Jun 2026</div>`;
}
function buildTimeline() {
  byId("timeline").innerHTML = POLICY_TIMELINE.map((e) =>
    `<div class="tl-item ${e.kind}">
       <div class="tl-year">${e.year}</div>
       <div class="tl-title">${e.title}</div>
       <div class="tl-body">${e.body}</div>
       ${e.lobby ? `<div class="tl-lobby"><span class="tl-lobby-tag">Lobbying</span>${e.lobby}</div>` : ""}
     </div>`).join("");
  byId("lobbyNote").innerHTML = LOBBY_NOTE + ` <a href="https://www.opensecrets.org/industries/indus.php?ind=E01" target="_blank" rel="noopener">OpenSecrets ↗</a> · <a href="https://influencemap.org/" target="_blank" rel="noopener">InfluenceMap ↗</a> · <a href="https://kickbigpollutersout.org/" target="_blank" rel="noopener">Kick Big Polluters Out ↗</a>`;
  byId("newsFeed").innerHTML = `<div class="news-head-lbl">A curated feed · high-credibility journalism &amp; primary data releases</div>` +
    NEWS_FEED.map((n) =>
      `<div class="news-item"><span class="news-outlet">${n.outlet}</span><a class="news-head" href="${n.url}" target="_blank" rel="noopener" style="color:var(--text)">${n.head}</a><span class="news-date">${n.date}</span></div>`).join("");
}

/* ═══ CHAPTER 04 · FORECAST EXPLORER ═══ */
let horizon = "2050";
let cmp = ["pledges", "aligned"]; // [A, B]
function buildScenarioBtns() {
  const wrap = byId("scenarioBtns");
  wrap.innerHTML = SCENARIOS.map((s) =>
    `<button class="fc-btn ${s.color === "ice" ? "ice" : ""}" data-s="${s.id}">${s.name}</button>`).join("");
  wrap.querySelectorAll(".fc-btn").forEach((b) => b.addEventListener("click", () => {
    const id = b.dataset.s;
    if (cmp.includes(id)) return;
    cmp = [id, cmp[0]]; // newest on left, push previous A to B
    renderForecast();
  }));
  byId("horizonBtns").querySelectorAll(".fc-btn").forEach((b) => b.addEventListener("click", () => {
    horizon = b.dataset.h;
    byId("horizonBtns").querySelectorAll(".fc-btn").forEach((x) => x.classList.remove("on"));
    b.classList.add("on"); renderForecast();
  }));
}
function scenarioById(id) { return SCENARIOS.find((s) => s.id === id); }
function renderForecast() {
  document.querySelectorAll("#scenarioBtns .fc-btn").forEach((b) =>
    b.classList.toggle("on", cmp.includes(b.dataset.s)));
  renderCard("cardA", scenarioById(cmp[0]));
  renderCard("cardB", scenarioById(cmp[1]));
  buildCompare();
}
function parseMeters(sl) { const m = sl.match(/([\d.]+)/); return m ? parseFloat(m[1]) : 0; }
function renderCard(id, s) {
  const el = byId(id);
  const h = s.horizons[horizon];
  const src = SOURCES[s.src];
  const slm = parseMeters(h.sl);
  const fill = Math.min(100, (slm / 1.0) * 100); // 1 m = full box
  el.className = "forecast-card " + (s.color === "ice" ? "ice" : "ember");
  el.innerHTML = `
    <div class="fc-scenario">${s.name} · ${s.short}</div>
    <div class="fc-temp">${h.temp}</div>
    <div class="fc-range">by ${horizon} · 2100 outlook ${s.temp2100} (${s.tempRange})</div>
    <div class="fc-note">${h.note}.</div>
    <div class="sl-illus">
      <div class="sl-label">sea level ${h.sl} by ${horizon}</div>
      <div class="sl-water" style="height:0%"></div>
    </div>
    <div class="fc-basis">${s.basis} <a href="${src.url}" target="_blank" rel="noopener">source ↗</a></div>`;
  // animate water
  const water = el.querySelector(".sl-water");
  requestAnimationFrame(() => requestAnimationFrame(() => { water.style.height = fill + "%"; }));
}
function buildCompare() {
  const a = scenarioById(cmp[0]), b = scenarioById(cmp[1]);
  const cls = (s) => (s.color === "ice" ? "v-ice" : "v-ember");
  const head = `<div class="fcmp-row head fcmp3"><div>Endpoint impact</div><div class="${cls(a)}">${a.name}</div><div class="${cls(b)}">${b.name}</div></div>`;
  const rows = FORECAST_IMPACTS.map((r) =>
    `<div class="fcmp-row fcmp3">
      <div class="k" data-k="Impact">${r.k}</div>
      <div class="${cls(a)}" data-k="${a.name}">${r.byPath[cmp[0]]}</div>
      <div class="${cls(b)}" data-k="${b.name}">${r.byPath[cmp[1]]}</div>
    </div>`).join("");
  byId("forecastCompare").innerHTML = head + rows +
    `<div class="fcmp-src">By pathway at 2100 / mid-century (not per horizon). Sources: <a href="https://www.ipcc.ch/report/ar6/syr/" target="_blank" rel="noopener">IPCC AR6</a> · <a href="https://www.worldbank.org/en/news/feature/2021/09/13/millions-on-the-move-in-their-own-countries-the-human-face-of-climate-change" target="_blank" rel="noopener">World Bank Groundswell</a>.</div>`;
}

/* ═══ P1-5 · LOCALISE THE FORECAST (Open-Meteo downscaled CMIP6) ═══
   Opt-in. Coordinates query only the projection API. Falls back to the
   selected country's pathway when local data is unavailable. */
function flStatus(m) { const el = byId("flStatus"); if (el) el.textContent = m; }
window.localiseForecast = function () {
  if (!navigator.geolocation) { flStatus("Geolocation isn't available — type a place instead."); return; }
  flStatus("Asking your browser for permission…");
  navigator.geolocation.getCurrentPosition(
    (p) => runLocalForecast(p.coords.latitude, p.coords.longitude),
    (e) => flStatus(e.code === 1 ? "Permission declined — type a place instead." : "Couldn't get your location — type a place."),
    { timeout: 10000, maximumAge: 600000 });
};
async function flReverseGeocode(lat, lng) {
  try {
    const j = await (await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`)).json();
    return [j.city || j.locality, j.countryCode].filter(Boolean).join(", ") || "your area";
  } catch (_) { return "your area"; }
}
async function runLocalForecast(lat, lng, label) {
  flStatus("Loading your area's climate projection…");
  window.__madForecastLoc = { lat, lng, label: label || null };
  saveState();
  try {
    if (!label) label = await flReverseGeocode(lat, lng);
    const url = `https://climate-api.open-meteo.com/v1/climate?latitude=${lat}&longitude=${lng}` +
      `&start_date=2000-01-01&end_date=2049-12-31&models=MRI_AGCM3_2_S&daily=temperature_2m_mean,temperature_2m_max&temperature_unit=celsius`;
    const j = await (await fetch(url)).json();
    const t = j.daily.time, mean = j.daily.temperature_2m_mean, mx = j.daily.temperature_2m_max;
    const yr = {}; // year → {sum,n,hot}
    for (let i = 0; i < t.length; i++) {
      const y = +t[i].slice(0, 4);
      const o = (yr[y] = yr[y] || { sum: 0, n: 0, hot: 0 });
      if (mean[i] != null) { o.sum += mean[i]; o.n++; }
      if (mx[i] != null && mx[i] >= 30) o.hot++;
    }
    const decMean = (a, b) => { let s = 0, c = 0; for (let y = a; y <= b; y++) if (yr[y] && yr[y].n) { s += yr[y].sum / yr[y].n; c++; } return c ? s / c : null; };
    const decHot = (a, b) => { let s = 0, c = 0; for (let y = a; y <= b; y++) if (yr[y]) { s += yr[y].hot; c++; } return c ? s / c : null; };
    const m2000 = decMean(2000, 2009), m2040 = decMean(2040, 2049);
    const h2010 = decHot(2010, 2019), h2040 = decHot(2040, 2049);
    if (m2000 == null || m2040 == null) throw new Error("insufficient data");
    const warming = m2040 - m2000;
    byId("flResult").innerHTML = `
      <div class="fl-place">${label}</div>
      <div class="fl-grid">
        <div class="fl-stat"><div class="fl-v ember">+${warming.toFixed(1)} °C</div><div class="fl-k">annual mean warming, 2000s → 2040s</div></div>
        <div class="fl-stat"><div class="fl-v">${m2000.toFixed(1)} → ${m2040.toFixed(1)} °C</div><div class="fl-k">local average temperature</div></div>
        ${h2010 != null && h2040 != null ? `<div class="fl-stat"><div class="fl-v ember">${Math.round(h2010)} → ${Math.round(h2040)}</div><div class="fl-k">days above 30 °C per year</div></div>` : ""}
      </div>
      <div class="fl-src">Downscaled CMIP6 (MRI-AGCM3-2-S, high-emission), via <a href="https://open-meteo.com/en/docs/climate-api" target="_blank" rel="noopener">Open-Meteo Climate API ↗</a>. One model shown; the direction, not the decimal, is the point.</div>`;
    byId("flResult").classList.add("show");
    flStatus("");
  } catch (e) {
    byId("flResult").classList.remove("show");
    flStatus(selectedCountry
      ? `Couldn't load a local projection here. Your country, ${selectedCountry[0]}, is rated "${selectedCountry[2]}" against the 1.5 °C pathway (Climate Action Tracker).`
      : "Couldn't load a local projection. Try again, or pick your country below.");
  }
}
function initLocalForecastSearch() {
  const inp = byId("flSearch");
  if (!inp) return;
  inp.addEventListener("keydown", async (e) => {
    if (e.key !== "Enter") return;
    const q = inp.value.trim(); if (!q) return;
    flStatus("Looking up '" + q + "'…");
    try {
      const r = await (await fetch("https://geocoding-api.open-meteo.com/v1/search?count=1&language=en&format=json&name=" + encodeURIComponent(q))).json();
      if (r.results && r.results[0]) { const g = r.results[0]; runLocalForecast(g.latitude, g.longitude, [g.name, g.country_code].filter(Boolean).join(", ")); }
      else flStatus("Couldn't find '" + q + "'. Try a larger town or city.");
    } catch (_) { flStatus("Place lookup failed — check your connection."); }
  });
}

/* ═══ CODA · STEP 01 · PRIORITIES (select = rank) ═══ */
function buildPriorities() {
  const grid = byId("prioGrid");
  grid.innerHTML = PRIORITIES.map((p, i) => {
    const s = SOURCES[p.src];
    return `<div class="prio-card" data-i="${i}" role="button" tabindex="0" aria-pressed="false">
      <span class="prio-rank">${i + 1}</span>
      <span class="prio-body"><span class="prio-name">${p.name}</span><span class="prio-desc">${p.desc}</span>
        <a class="prio-src" href="${s.url}" target="_blank" rel="noopener">${s.label.split(" · ")[0]} ↗</a></span>
    </div>`;
  }).join("");
  grid.querySelectorAll(".prio-card").forEach((b) => {
    b.addEventListener("click", (e) => { if (!e.target.closest(".prio-src")) togglePriority(+b.dataset.i); });
    b.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && !e.target.closest(".prio-src")) { e.preventDefault(); togglePriority(+b.dataset.i); }
    });
  });
}
function togglePriority(i) {
  const at = ranking.indexOf(i);
  if (at === -1) ranking.push(i); else ranking.splice(at, 1);
  renderPriorities();
}
function renderPriorities() {
  document.querySelectorAll(".prio-card").forEach((b) => {
    const i = +b.dataset.i, at = ranking.indexOf(i);
    const on = at !== -1;
    b.classList.toggle("on", on);
    b.setAttribute("aria-pressed", on);
    b.querySelector(".prio-rank").textContent = on ? at + 1 : i + 1;
  });
  const list = byId("orderedList");
  if (!ranking.length) {
    list.innerHTML = `<div class="ordered-empty">Nothing chosen yet. Tap an action above to begin.</div>`;
  } else {
    list.innerHTML = ranking.map((idx, k) =>
      `<div class="ordered-row">
        <span class="ordered-n">${k + 1}</span>
        <span class="ordered-name">${PRIORITIES[idx].name}</span>
        <span class="ordered-ctrl">
          <button onclick="moveRank(${k},-1)" aria-label="Move up" ${k === 0 ? "disabled" : ""}>↑</button>
          <button onclick="moveRank(${k},1)" aria-label="Move down" ${k === ranking.length - 1 ? "disabled" : ""}>↓</button>
          <button onclick="moveRank(${k},0)" aria-label="Remove">✕</button>
        </span>
      </div>`).join("");
  }
  generateLetter();
}
window.moveRank = function (k, dir) {
  if (dir === 0) ranking.splice(k, 1);
  else { const j = k + dir; if (j < 0 || j >= ranking.length) return; [ranking[k], ranking[j]] = [ranking[j], ranking[k]]; }
  renderPriorities();
};

/* ═══ NAV ═══ */
window.goToStep = function (id) {
  byId(id)?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  if (id === "coalitionStep") setTimeout(() => { try { buildGlobe(); } catch (e) {} }, 50);
};

/* ═══ COUNTRY ═══ */
function buildCountrySelect() {
  const sel = byId("countrySelect");
  [...COUNTRIES].sort((a, b) => a[0].localeCompare(b[0])).forEach((c) => {
    const o = document.createElement("option"); o.value = c[0]; o.textContent = c[0]; sel.appendChild(o);
  });
}
window.showCountry = function (name) {
  selectedCountry = COUNTRIES.find((c) => c[0] === name) || null;
  const card = byId("countryCard");
  if (!selectedCountry) { card.classList.remove("show"); generateLetter(); return; }
  const [nm, iso, rating, perCap, contact] = selectedCountry;
  const bad = /insufficient|critically/i.test(rating);
  card.className = "country-card show";
  card.innerHTML = `
    <div class="cc-name">${nm}</div>
    <div class="cc-grid">
      <div class="cc-stat"><div class="cc-v">${perCap}</div><div class="cc-k">tonnes CO₂ / person / yr</div></div>
      <div class="cc-stat"><div class="cc-v ice">${rating === "not rated" ? "—" : rating}</div><div class="cc-k">1.5 °C alignment (CAT)</div></div>
    </div>
    <span class="cc-rating ${bad ? "bad" : "ok"}">${rating === "not rated" ? "Not yet rated by Climate Action Tracker" : "Climate Action Tracker: " + rating}</span>
    <div style="font-family:var(--fm);font-size:.6rem;color:var(--faint);margin-top:.9rem">Per-capita: Our World in Data / GCP. Rating: <a href="https://climateactiontracker.org/countries/" target="_blank" rel="noopener" style="color:var(--faint)">Climate Action Tracker ↗</a></div>`;
  generateLetter();
};

/* ═══ LETTER ═══ */
function generateLetter() {
  const out = byId("letterOutput");
  if (!out) return;
  const note = byId("letterNote");
  const rankDone = ranking.length >= 1, countryDone = !!selectedCountry;
  if (note) note.classList.toggle("show", !(rankDone && countryDone));

  const RED = (t) => `<span class="letter-redfill">${t}</span>`;
  const name = (byId("letterName")?.value || "").trim() || "A concerned citizen";
  const leaderRaw = (byId("letterLeader")?.value || "").trim();
  const country = countryDone ? selectedCountry[0] : RED("[your country]");
  // per-country office (President / Prime Minister / Chancellor / King) — the
  // stable institution, so no head-of-state NAME can go stale. If the reader
  // types a specific name it takes precedence.
  const office = countryDone ? (selectedCountry[5] || "Head of Government") : null;
  const leader = leaderRaw || (countryDone ? office : RED("[your head of state]"));
  const perCapLine = countryDone
    ? `${selectedCountry[0]} emits about ${selectedCountry[3]} tonnes of CO₂ per person each year, and its current climate plan is rated "${selectedCountry[2]}" against the 1.5 °C pathway.`
    : RED("[Pick your country below to show its emissions and its 1.5 °C alignment.]");
  const prioList = rankDone
    ? ranking.map((idx, i) => `  ${i + 1}. ${PRIORITIES[idx].name} — ${PRIORITIES[idx].desc}`).join("\n")
    : RED("[Go back to Step 01, choose the actions you want, and rank them. Your priorities will appear here.]");

  const letter = `Dear ${leader},

My name is ${name}. I am writing not as a partisan, and not from anger, but as someone who has sat with the numbers and can no longer stay quiet about what they mean.

In 2025 the burning of fossil fuels released a record 38.1 billion tonnes of CO₂ — more than 1,200 tonnes every second. Atmospheric CO₂ passed 430 parts per million for the first time in human history. The three years to 2025 were, on average, more than 1.5 °C above the pre-industrial climate — a line the world agreed in Paris it would try never to cross. The remaining budget for a 50% chance of holding 1.5 °C is now about four years at current emissions (Global Carbon Project 2025).

${perCapLine}

None of this is prophecy. It is arithmetic, and it is conditional on choices that governments — including yours — still control. The technologies exist. The money exists; the world spends about seven trillion dollars a year subsidising the very fuels driving this. What is missing is political will.

I am asking you to supply it. These are the actions I would have you take first, in order of priority:

${prioList}

I understand that change at this scale demands courage that short electoral cycles rarely reward. But we are one species, sharing one atmosphere, and the decisions made in this decade will set the climate our children inherit. I am choosing to believe you would rather be remembered for acting than for delay.

I am asking you, respectfully but urgently, to act like it.

Yours sincerely,

${name}
${country}`;

  out.innerHTML = letter.replace(/\n/g, "<br>");
  out.dataset.plain = out.innerText;

  const contact = byId("letterContact");
  if (contact) contact.innerHTML = countryDone && selectedCountry[4]
    ? `When you're ready, here is the official contact route for ${selectedCountry[0]}: <a href="${selectedCountry[4]}" target="_blank" rel="noopener">${selectedCountry[4]} ↗</a>`
    : "";
  saveState(); // persist the journey (P1-8); guarded during restore
}
window.copyLetter = function () {
  const out = byId("letterOutput");
  navigator.clipboard.writeText(out.innerText).then(() => flashBtn(event?.target, "✓ Copied"));
};
window.emailLetter = function () {
  const txt = byId("letterOutput").innerText;
  const sub = encodeURIComponent("On our national climate policy — a citizen's priorities");
  window.open(`mailto:?subject=${sub}&body=${encodeURIComponent(txt)}`, "_blank");
};
window.tweetLetter = function () {
  if (!ranking.length) { alert("Choose and rank some priorities first."); return; }
  const top = ranking.slice(0, 3).map((i) => PRIORITIES[i].name).join(", ");
  const txt = `My government's climate priorities, in order: ${top}. 38.1 Gt of fossil CO₂ a year; ~4 years of 1.5°C budget left. studioex.co #MutuallyReassuredDestruction @404blueprint`;
  window.open("https://twitter.com/intent/tweet?text=" + encodeURIComponent(txt), "_blank");
};
window.sendToRepresentative = function () {
  const txt = byId("letterOutput").innerText;
  const open = () => {
    const url = selectedCountry && selectedCountry[4];
    if (url) window.open(url, "_blank", "noopener");
    else window.open(`mailto:?subject=${encodeURIComponent("On our national climate policy")}&body=${encodeURIComponent(txt)}`, "_blank");
  };
  if (navigator.clipboard && txt) navigator.clipboard.writeText(txt).then(() => { alert("Your letter is copied. We'll open your representative's contact page — paste it in."); open(); }, open);
  else open();
};
function flashBtn(b, msg) { if (!b) return; const o = b.textContent; b.textContent = msg; setTimeout(() => (b.textContent = o), 1800); }

/* ═══ COALITION ═══ */
const SEED_COUNT = (window.MAD_CONFIG && window.MAD_CONFIG.SEED_COUNT) || MAD_SEED_COUNT;
function getLocalSubs() { try { return JSON.parse(localStorage.getItem("mad_subs") || "[]"); } catch (e) { return []; } }
function saveLocalSub(d) { const a = getLocalSubs(); a.push(d); try { localStorage.setItem("mad_subs", JSON.stringify(a.slice(-500))); } catch (e) {} }
function getTally() {
  if (window.__madConfigured && window.__madLive && window.__madLive.ready)
    return { count: SEED_COUNT + window.__madLive.count, tally: { ...window.__madLive.tally } };
  const local = getLocalSubs(), tally = {};
  local.forEach((s) => (s.ranking || []).forEach((i) => (tally[i] = (tally[i] || 0) + 1)));
  return { count: SEED_COUNT + local.length, tally };
}
function renderCoalitionCount() {
  const { count } = getTally();
  const el = byId("coalitionNum");
  if (el) animateCount(el, count);
}
function animateCount(el, target) {
  if (reduceMotion) { el.textContent = target.toLocaleString(); return; }
  const start = performance.now(), from = 0, dur = 1400;
  (function step(t) {
    const p = Math.min(1, (t - start) / dur);
    el.textContent = Math.floor(from + (target - from) * (1 - Math.pow(1 - p, 3))).toLocaleString();
    if (p < 1) requestAnimationFrame(step);
  })(start);
}
function globalPriorityTally() {
  const { tally } = getTally();
  return SEED_PRIORITY_WEIGHTS.map((w, i) => ({ i, w: w + (tally[i] || 0) })).sort((a, b) => b.w - a.w);
}
function buildGlobalPriorities() {
  const wrap = byId("globalPrio");
  if (!wrap) return;
  const t = globalPriorityTally(), max = t[0].w;
  wrap.innerHTML = `<div class="global-prio-h">What the coalition would demand first</div>` +
    t.slice(0, 8).map((x) => {
      const p = PRIORITIES[x.i], col = p.color === "ice" ? "var(--ice)" : "var(--ember)";
      return `<div class="gp-row"><div class="gp-name">${p.name}</div><div class="gp-track"><div class="gp-fill" style="background:${col};width:0" data-w="${((x.w / max) * 100).toFixed(0)}"></div></div><div class="gp-pct">${((x.w / max) * 100).toFixed(0)}%</div></div>`;
    }).join("");
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { wrap.querySelectorAll(".gp-fill").forEach((b) => b.style.width = b.dataset.w + "%"); io.disconnect(); } }), { threshold: 0.15 });
  io.observe(wrap);
}
window.submitCoalition = function () {
  if (!ranking.length) { alert("Choose and rank at least one priority in Step 01 first."); return; }
  const email = (byId("coalitionEmail")?.value || "").trim();
  const consent = byId("coalitionConsent")?.checked;
  const country = selectedCountry ? selectedCountry[0] : "Unknown";
  const payload = { ranking: [...ranking], country, email: consent ? email : "", ts: Date.now() };
  saveLocalSub(payload);
  if (window.__madConfigured && window.__madSubmit) window.__madSubmit(payload);
  byId("coalitionThanks").style.display = "block";
  renderCoalitionCount(); buildGlobalPriorities(); refreshGlobe();
  generateShareCard();
};

/* ═══ COALITION GLOBE (globe.gl, lazy) ═══ */
let globeInstance = null;
function getCountrySignups() {
  const out = Object.assign({}, SEED_COUNTRY_SIGNUPS);
  getLocalSubs().forEach((s) => { if (s.country && s.country !== "Unknown") out[s.country] = (out[s.country] || 0) + 1; });
  if (window.__madCountrySignups) Object.entries(window.__madCountrySignups).forEach(([k, v]) => out[k] = (out[k] || 0) + v);
  return out;
}
function volColor(t) {
  const stops = [[0, [110, 199, 232]], [0.5, [205, 214, 220]], [0.8, [255, 138, 90]], [1, [255, 107, 53]]];
  let a = stops[0], b = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) if (t >= stops[i][0] && t <= stops[i + 1][0]) { a = stops[i]; b = stops[i + 1]; break; }
  const f = (t - a[0]) / (b[0] - a[0] || 1);
  const c = a[1].map((v, i) => Math.round(v + (b[1][i] - v) * f));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}
function globeData() {
  const counts = getCountrySignups(), max = Math.max(1, ...Object.values(counts)), pts = [];
  Object.entries(counts).forEach(([country, n]) => {
    const c = COUNTRY_COORDS[country]; if (!c || n <= 0) return;
    const t = n / max;
    pts.push({ country, count: n, lat: c[0], lng: c[1], alt: 0.04 + Math.sqrt(t) * 0.55, color: volColor(t) });
  });
  return pts;
}
function hasWebGL() { try { const c = document.createElement("canvas"); return !!(window.WebGLRenderingContext && (c.getContext("webgl") || c.getContext("experimental-webgl"))); } catch (e) { return false; } }

/* P0-3: the 3D globe is progressive enhancement only. If WebGL is absent,
   globe.gl fails to load, or it doesn't initialise within 6 s, we render a
   guaranteed flat fallback (equirectangular dot-map on canvas). Either way
   the "rendering the globe…" string is removed and something always draws. */
let flatActive = false, globeTimeout = null;
function buildGlobe() {
  const wrap = byId("globeWrap");
  if (!wrap || globeInstance || flatActive) return;
  if (!hasWebGL()) { buildFlatFallback(); return; }
  if (window.Globe) { initGlobe(); return; }
  globeTimeout = setTimeout(() => { if (!globeInstance) buildFlatFallback(); }, 6000);
  const s = document.createElement("script");
  s.src = "https://cdn.jsdelivr.net/npm/globe.gl";
  s.onload = initGlobe;
  s.onerror = () => buildFlatFallback();
  document.head.appendChild(s);
}
function initGlobe() {
  const wrap = byId("globeWrap");
  if (!wrap || flatActive) return;
  if (!window.Globe) { buildFlatFallback(); return; }
  clearTimeout(globeTimeout);
  byId("globeLoading")?.remove();
  const mobile = innerWidth <= 760;
  try {
    globeInstance = Globe()(wrap)
      .width(wrap.clientWidth).height(wrap.clientHeight)
      .backgroundColor("rgba(0,0,0,0)")
      .globeImageUrl("https://unpkg.com/three-globe/example/img/earth-night.jpg")
      .showAtmosphere(true).atmosphereColor("#6ec7e8").atmosphereAltitude(0.18)
      .pointsData(globeData()).pointLat("lat").pointLng("lng").pointAltitude("alt").pointColor("color")
      .pointRadius(mobile ? 0.5 : 0.4).pointResolution(mobile ? 6 : 12)
      .pointLabel((d) => `${d.country}: ${d.count.toLocaleString()} voices`);
    const controls = globeInstance.controls();
    controls.autoRotate = !reduceMotion; controls.autoRotateSpeed = 0.5; controls.enableZoom = true;
    addEventListener("resize", () => { if (globeInstance) globeInstance.width(wrap.clientWidth).height(wrap.clientHeight); }, { passive: true });
  } catch (e) { buildFlatFallback(); }
}
function buildFlatFallback() {
  if (flatActive || globeInstance) return;
  flatActive = true;
  clearTimeout(globeTimeout);
  const wrap = byId("globeWrap");
  if (!wrap) return;
  wrap.innerHTML = '<canvas id="flatGlobe" style="width:100%;height:100%;display:block"></canvas><div class="globe-sub" style="position:absolute;left:12px;bottom:8px;margin:0">each point is a country · brighter = more voices</div>';
  wrap.style.position = "relative";
  drawFlat();
  addEventListener("resize", drawFlat, { passive: true });
}
function drawFlat() {
  const cv = byId("flatGlobe"); if (!cv) return;
  const wrap = byId("globeWrap");
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const W = wrap.clientWidth, H = wrap.clientHeight;
  cv.width = W * dpr; cv.height = H * dpr;
  const x = cv.getContext("2d"); x.setTransform(dpr, 0, 0, dpr, 0, 0);
  x.clearRect(0, 0, W, H);
  x.strokeStyle = "rgba(110,199,232,0.06)"; x.lineWidth = 1;
  for (let lon = -180; lon <= 180; lon += 30) { const px = ((lon + 180) / 360) * W; x.beginPath(); x.moveTo(px, 0); x.lineTo(px, H); x.stroke(); }
  for (let lat = -60; lat <= 60; lat += 30) { const py = ((90 - lat) / 180) * H; x.beginPath(); x.moveTo(0, py); x.lineTo(W, py); x.stroke(); }
  const counts = getCountrySignups(), max = Math.max(1, ...Object.values(counts));
  Object.entries(counts).forEach(([country, n]) => {
    const c = COUNTRY_COORDS[country]; if (!c || n <= 0) return;
    const t = n / max, col = volColor(t);
    const px = ((c[1] + 180) / 360) * W, py = ((90 - c[0]) / 180) * H, r = 2 + Math.sqrt(t) * 9;
    x.globalAlpha = 0.22; x.beginPath(); x.arc(px, py, r * 2.2, 0, 7); x.fillStyle = col; x.fill();
    x.globalAlpha = 0.9; x.beginPath(); x.arc(px, py, r, 0, 7); x.fillStyle = col; x.fill();
    x.globalAlpha = 1;
  });
}
function refreshGlobe() {
  if (globeInstance) globeInstance.pointsData(globeData());
  else if (flatActive) drawFlat();
}

/* ═══ SHARE CARD (canvas PNG export) ═══ */
window.generateShareCard = function () {
  const issues = byId("scIssues");
  const top = ranking.slice(0, 5);
  issues.innerHTML = top.length
    ? top.map((idx, i) => `<div class="sc-issue"><span class="n">${i + 1}</span>${PRIORITIES[idx].name}</div>`).join("")
    : `<div class="sc-issue"><span class="n">—</span>Choose your priorities in Step 01</div>`;
  byId("scCountry").textContent = selectedCountry ? selectedCountry[0] + " · studioex.co" : "studioex.co";
  byId("scOverlay").classList.add("open");
};
window.shareCardTo = function (where) {
  const url = "https://studioex-creative.github.io/mutually-reassured-destruction/";
  const txt = "The planetary bill of carbon, and the ledger of choices that produced it. Mutually Reassured Destruction — Blueprint × StudioEX.";
  if (where === "twitter") window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(txt)}&url=${encodeURIComponent(url)}`, "_blank");
  else navigator.clipboard.writeText(url).then(() => alert("Link copied."));
};
window.downloadCard = function () {
  const W = 1080, H = 1350, cv = document.createElement("canvas");
  cv.width = W; cv.height = H; const x = cv.getContext("2d");
  const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, "#0b0e12"); g.addColorStop(1, "#06080a");
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  const P = 90;
  x.fillStyle = "#ff6b35"; x.font = "500 26px 'IBM Plex Mono', monospace";
  x.fillText("MUTUALLY REASSURED DESTRUCTION · 2026", P, 110);
  x.fillStyle = "#8593a0"; x.font = "24px 'IBM Plex Mono', monospace";
  x.fillText("Blueprint × StudioEX", P, 150);
  x.fillStyle = "#fff"; x.font = "600 66px 'Source Serif 4', Georgia, serif";
  wrapText(x, "I'm choosing to break the lock.", P, 300, W - P * 2, 74);
  // priorities
  let y = 470; x.font = "500 34px 'Inter', sans-serif";
  const top = ranking.slice(0, 5);
  if (top.length) top.forEach((idx, i) => { x.fillStyle = "#6ec7e8"; x.fillText(`${i + 1}.  ${PRIORITIES[idx].name}`, P, y); y += 62; });
  else { x.fillStyle = "#58626c"; x.fillText("Choose your priorities at studioex.co", P, y); }
  // stats
  x.strokeStyle = "#20272f"; x.beginPath(); x.moveTo(P, 1040); x.lineTo(W - P, 1040); x.stroke();
  x.fillStyle = "#ff6b35"; x.font = "600 56px 'Source Serif 4', Georgia, serif"; x.fillText("38.1 Gt", P, 1130);
  x.fillStyle = "#8593a0"; x.font = "22px 'IBM Plex Mono', monospace"; x.fillText("fossil CO₂ a year, and rising", P, 1165);
  x.fillStyle = "#6ec7e8"; x.font = "600 56px 'Source Serif 4', Georgia, serif"; x.textAlign = "right"; x.fillText("~4 years", W - P, 1130);
  x.fillStyle = "#8593a0"; x.font = "20px 'IBM Plex Mono', monospace"; x.fillText("left for a 50% chance of 1.5 °C", W - P, 1165); x.textAlign = "left";
  x.fillStyle = "#8593a0"; x.font = "22px 'IBM Plex Mono', monospace";
  x.fillText(selectedCountry ? selectedCountry[0] : "studioex.co", P, 1270);
  x.textAlign = "right"; x.fillText("@404blueprint", W - P, 1270); x.textAlign = "left";
  const a = document.createElement("a"); a.download = "mutually-reassured-destruction.png"; a.href = cv.toDataURL("image/png"); a.click();
};
function wrapText(ctx, text, x, y, maxW, lh) {
  const words = text.split(" "); let line = "";
  for (const w of words) {
    if (ctx.measureText(line + w + " ").width > maxW && line) { ctx.fillText(line.trim(), x, y); line = ""; y += lh; }
    line += w + " ";
  }
  ctx.fillText(line.trim(), x, y);
}

/* ═══ COALITION GLOBE lazy trigger ═══
   Bulletproof: an IntersectionObserver AND a scroll backstop AND an
   immediate proximity check, all converging on one idempotent buildGlobe(). */
function initGlobeLazy() {
  const wrap = byId("globeWrap"); if (!wrap) return;
  let fired = false;
  const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) fire(); }, { rootMargin: "600px 0px" });
  const onScroll = () => {
    const r = wrap.getBoundingClientRect();
    if (r.top < window.innerHeight + 600 && r.bottom > -600) fire();
  };
  function fire() {
    if (fired) return; fired = true;
    io.disconnect(); window.removeEventListener("scroll", onScroll);
    buildGlobe();
  }
  io.observe(wrap);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll(); // in case it is already near the viewport on load
}
window.onMadHydrated = function () { renderCoalitionCount(); buildGlobalPriorities(); refreshGlobe(); };

/* ═══ STATE PERSISTENCE (P1-8) ═══
   Everything the reader builds — ranked priorities, country, letter draft,
   hazard radius, local forecast location — survives a refresh. Stored ONLY in
   this browser's localStorage; never sent to any backend. */
function saveState() {
  if (!hydrated || restoringState) return;
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify({
      priorityOrder: ranking,
      country: selectedCountry ? selectedCountry[0] : null,
      letterName: byId("letterName")?.value || "",
      letterLeader: byId("letterLeader")?.value || "",
      letterDraft: letterEdited ? (byId("letterOutput")?.innerText || "") : null,
      radius: window.__madRadius || 250,
      localForecastLocation: window.__madForecastLoc || null,
      lastUpdated: Date.now(),
    }));
  } catch (e) {}
}
window.saveState = saveState; // let hazard.js persist radius changes
function loadState() {
  let s;
  try { s = JSON.parse(localStorage.getItem(STATE_KEY) || "null"); } catch (e) { return; }
  if (!s) return;
  restoringState = true;
  if (Array.isArray(s.priorityOrder)) ranking = s.priorityOrder.filter((i) => i >= 0 && i < PRIORITIES.length);
  if (s.letterName && byId("letterName")) byId("letterName").value = s.letterName;
  if (s.letterLeader && byId("letterLeader")) byId("letterLeader").value = s.letterLeader;
  renderPriorities();
  if (s.country) { const sel = byId("countrySelect"); if (sel) { sel.value = s.country; window.showCountry(s.country); } }
  if (s.radius && typeof window.setRadius === "function") { window.__madRadius = s.radius; window.setRadius(s.radius); }
  if (s.localForecastLocation) window.__madForecastLoc = s.localForecastLocation;
  if (s.letterDraft) {
    letterEdited = true;
    const o = byId("letterOutput");
    if (o) { o.innerHTML = s.letterDraft.replace(/\n/g, "<br>"); o.dataset.plain = s.letterDraft; }
    if (byId("letterNote")) byId("letterNote").classList.remove("show");
  }
  restoringState = false;
}
window.clearMadState = function () {
  try { localStorage.removeItem(STATE_KEY); } catch (e) {}
  ranking = []; selectedCountry = null; letterEdited = false;
  const sel = byId("countrySelect"); if (sel) sel.value = "";
  byId("countryCard")?.classList.remove("show");
  if (byId("letterName")) byId("letterName").value = "";
  if (byId("letterLeader")) byId("letterLeader").value = "";
  renderPriorities();
  const btn = byId("clearStateBtn"); if (btn) { const o = btn.textContent; btn.textContent = "✓ Cleared"; setTimeout(() => (btn.textContent = o), 1800); }
};

/* ═══ INIT ═══ */
function init() {
  initBg();
  tickers();
  initReveal();
  buildCards(); initSort();
  buildStripes();
  buildForestRibbon();
  buildAnomaly();
  buildStates(); initStatesTabs();
  buildMajors(); buildTimeline();
  buildScenarioBtns(); renderForecast();
  buildProgress(); initNavpill();
  buildPriorities(); renderPriorities();
  buildCountrySelect();
  renderCoalitionCount(); buildGlobalPriorities(); initGlobeLazy();
  // letter hand-edits mark the draft dirty so it persists across refresh
  byId("letterOutput")?.addEventListener("input", () => { letterEdited = true; saveState(); });
  initLocalForecastSearch();
  loadState(); // restore any saved journey last, once the DOM is built
  hydrated = true; // now enable persistence for real user actions (P1-8)
  // repopulate a saved local forecast (a stored coordinate, no new geolocation)
  const fl = window.__madForecastLoc;
  if (fl && fl.lat != null) runLocalForecast(fl.lat, fl.lng, fl.label);
}
if (document.readyState !== "loading") init();
else document.addEventListener("DOMContentLoaded", init);
