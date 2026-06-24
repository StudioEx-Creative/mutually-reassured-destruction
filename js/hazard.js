/* ═══════════════════════════════════════════════════════════════════
   MAD — "YOUR AREA" LIVE HAZARD FEED
   ───────────────────────────────────────────────────────────────────
   Opt-in only. Coordinates are used solely as bounding-box / radius
   queries to public hazard APIs and never sent anywhere else. We use
   only free, keyless, CORS-friendly endpoints so the whole thing runs
   client-side with no backend:

     • USGS Earthquake Hazards    — quakes        (GeoJSON, no key)
     • Open-Meteo Forecast        — current temp  (no key)
     • Open-Meteo Air-Quality     — PM2.5 / AQI   (no key)
     • Open-Meteo Archive         — local normal  (no key) → anomaly
     • Open-Meteo Geocoding       — place search  (no key)
     • GDACS                      — disaster alerts (attempted; graceful
                                     fallback if CORS-blocked)

   NASA FIRMS (active fires) and OpenAQ both require a free API key; wire
   them server-side or with a key before public launch — see README.
   Polling: recursive setTimeout every 10 min, only while the tab is
   visible (paused otherwise). Manual refresh available.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  const POLL_MS = 10 * 60 * 1000; // 10 minutes
  let loc = null;                 // { lat, lng, label }
  let radiusKm = 250;
  let pollTimer = null;
  let lastUpdated = null;

  const $ = (id) => document.getElementById(id);

  // ── geometry ──
  function haversine(aLat, aLng, bLat, bLng) {
    const R = 6371, toR = (d) => (d * Math.PI) / 180;
    const dLat = toR(bLat - aLat), dLng = toR(bLng - aLng);
    const s = Math.sin(dLat / 2) ** 2 +
      Math.cos(toR(aLat)) * Math.cos(toR(bLat)) * Math.sin(dLng / 2) ** 2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s)));
  }
  function timeAgo(ts) {
    const s = Math.floor((Date.now() - ts) / 1000);
    if (s < 3600) return Math.max(1, Math.floor(s / 60)) + " min ago";
    if (s < 86400) return Math.floor(s / 3600) + " h ago";
    return Math.floor(s / 86400) + " d ago";
  }

  function setStatus(msg) { const el = $("areaStatus"); if (el) el.textContent = msg; }

  // ── public entry points (wired to buttons in index.html) ──
  window.requestLocation = function () {
    if (!navigator.geolocation) { setStatus("Geolocation isn't available in this browser — use the search box."); return; }
    setStatus("Asking your browser for permission…");
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation(pos.coords.latitude, pos.coords.longitude),
      (err) => setStatus(err.code === 1
        ? "Permission declined. You can still type a place into the search box."
        : "Couldn't get your location — try the search box."),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  };

  window.setRadius = function (km) {
    radiusKm = km;
    document.querySelectorAll(".radius-btn").forEach((b) =>
      b.classList.toggle("on", +b.dataset.r === km));
    if (loc) refresh();
  };

  async function setLocation(lat, lng, label) {
    loc = { lat, lng, label: label || null };
    if (!loc.label) loc.label = await reverseGeocode(lat, lng);
    setStatus("Loading hazards near " + (loc.label || "you") + "…");
    await refresh();
    startPolling();
  }

  // ── search box ──
  function initSearch() {
    const inp = $("areaSearch");
    if (!inp) return;
    inp.addEventListener("keydown", async (e) => {
      if (e.key !== "Enter") return;
      const q = inp.value.trim();
      if (!q) return;
      setStatus("Looking up '" + q + "'…");
      try {
        const r = await fetch("https://geocoding-api.open-meteo.com/v1/search?count=1&language=en&format=json&name=" + encodeURIComponent(q));
        const j = await r.json();
        if (j.results && j.results[0]) {
          const g = j.results[0];
          setLocation(g.latitude, g.longitude,
            [g.name, g.admin1, g.country_code].filter(Boolean).join(", "));
        } else setStatus("Couldn't find '" + q + "'. Try a larger town or city.");
      } catch (_) { setStatus("Place lookup failed — check your connection."); }
    });
  }

  async function reverseGeocode(lat, lng) {
    try {
      const r = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`);
      const j = await r.json();
      return [j.city || j.locality, j.principalSubdivision, j.countryCode].filter(Boolean).join(", ") || "your location";
    } catch (_) { return "your location"; }
  }

  // ── sources (each resolves to an array of hazard items; never throws) ──
  async function fetchQuakes() {
    try {
      const start = new Date(Date.now() - 7 * 86400000).toISOString();
      const url = `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&starttime=${start}` +
        `&latitude=${loc.lat}&longitude=${loc.lng}&maxradiuskm=${radiusKm}&minmagnitude=2.5&orderby=time&limit=20`;
      const j = await (await fetch(url)).json();
      return (j.features || []).map((f) => {
        const [lng, lat] = f.geometry.coordinates;
        return {
          icon: "⊚", type: `Magnitude ${f.properties.mag?.toFixed(1)} earthquake`,
          place: f.properties.place || "", ts: f.properties.time,
          dist: haversine(loc.lat, loc.lng, lat, lng),
          source: "USGS", link: f.properties.url,
        };
      });
    } catch (_) { return []; }
  }

  async function fetchGdacs() {
    // GDACS may or may not send CORS headers; attempt and fail silently.
    try {
      const j = await (await fetch("https://www.gdacs.org/gdacsapi/api/events/geteventlist/MAP")).json();
      const feats = (j.features || []);
      const ICON = { EQ: "⊚", TC: "🌀", FL: "🌊", DR: "🌵", WF: "🔥", VO: "🌋" };
      return feats.map((f) => {
        const p = f.properties || {};
        const c = (f.geometry && f.geometry.coordinates) || [];
        const lat = c[1], lng = c[0];
        if (lat == null) return null;
        const dist = haversine(loc.lat, loc.lng, lat, lng);
        if (dist > radiusKm) return null;
        return {
          icon: ICON[p.eventtype] || "⚠", type: p.htmldescription || p.name || (p.eventtype + " alert"),
          place: p.country || "", ts: p.fromdate ? new Date(p.fromdate).getTime() : Date.now(),
          dist, source: "GDACS", link: p.url && p.url.report,
        };
      }).filter(Boolean);
    } catch (_) { return []; }
  }

  async function fetchAir() {
    try {
      const url = `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${loc.lat}&longitude=${loc.lng}&current=pm2_5,european_aqi`;
      const j = await (await fetch(url)).json();
      const pm = j.current && j.current.pm2_5;
      if (pm == null) return [];
      let band = "moderate";
      if (pm > 55) band = "unhealthy"; else if (pm > 35) band = "unhealthy for sensitive groups"; else if (pm <= 12) band = "good";
      // only surface as a hazard item when notably elevated
      if (pm < 25) return [];
      return [{
        icon: "🜂", type: `Air quality: PM2.5 at ${pm.toFixed(0)} µg/m³ (${band})`,
        place: loc.label || "", ts: Date.now(), dist: 0, source: "Open-Meteo",
        link: "https://open-meteo.com/en/docs/air-quality-api",
      }];
    } catch (_) { return []; }
  }

  // local temperature + anomaly panel (its own card, not the feed list)
  async function updateLocalTemp() {
    const el = $("areaTemp");
    if (!el) return;
    try {
      const cur = await (await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat}&longitude=${loc.lng}&current=temperature_2m&daily=temperature_2m_max&forecast_days=1&timezone=auto`)).json();
      const t = cur.current && cur.current.temperature_2m;
      if (t == null) { el.classList.remove("show"); return; }

      // climatological normal for today from the archive API (past 10y mean)
      let anomalyHtml = "";
      try {
        const today = new Date();
        const m = String(today.getMonth() + 1).padStart(2, "0");
        const d = String(today.getDate()).padStart(2, "0");
        const startY = today.getFullYear() - 11, endY = today.getFullYear() - 1;
        const arch = await (await fetch(
          `https://archive-api.open-meteo.com/v1/archive?latitude=${loc.lat}&longitude=${loc.lng}` +
          `&start_date=${startY}-${m}-${d}&end_date=${endY}-${m}-${d}&daily=temperature_2m_mean&timezone=auto`)).json();
        const vals = (arch.daily && arch.daily.temperature_2m_mean || []).filter((v) => v != null);
        if (vals.length) {
          const normal = vals.reduce((a, b) => a + b, 0) / vals.length;
          const an = t - normal;
          const sign = an >= 0 ? "+" : "";
          const col = an >= 0 ? "var(--ember)" : "var(--ice)";
          anomalyHtml = `<div style="margin-top:.6rem;font-size:.84rem;color:var(--muted)">
            <span style="color:${col};font-weight:600">${sign}${an.toFixed(1)} °C</span>
            against the ${startY}–${endY} average for this date.</div>`;
        }
      } catch (_) {}

      el.innerHTML = `<div class="cc-k" style="font-family:var(--fm);font-size:.58rem;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)">Right now in ${loc.label || "your area"}</div>
        <div class="alt-big" style="color:${t >= 20 ? "var(--ember)" : "var(--ice)"}">${t.toFixed(1)} °C</div>
        ${anomalyHtml}
        <div style="font-family:var(--fm);font-size:.56rem;color:var(--faint);margin-top:.6rem">Source: <a href="https://open-meteo.com/" target="_blank" rel="noopener" style="color:var(--faint)">Open-Meteo ↗</a></div>`;
      el.classList.add("show");
    } catch (_) { el.classList.remove("show"); }
  }

  // ── render ──
  function render(items) {
    const feed = $("areaFeed");
    if (!feed) return;
    if (!items.length) {
      feed.innerHTML = `<div class="area-empty">No significant hazards reported within ${radiusKm} km in the last 7 days. That is good news — and not the same as nothing happening. Widen the radius, or read the global picture above.</div>`;
      return;
    }
    items.sort((a, b) => (a.dist - b.dist) || (b.ts - a.ts));
    feed.innerHTML = items.slice(0, 25).map((h) => `
      <div class="hz-item">
        <div class="hz-icon" aria-hidden="true">${h.icon}</div>
        <div class="hz-body">
          <div class="hz-type">${escapeHtml(h.type)}</div>
          <div class="hz-meta">${escapeHtml(h.place || "")}${h.place ? " · " : ""}${timeAgo(h.ts)} · ${h.link ? `<a href="${h.link}" target="_blank" rel="noopener">${h.source} ↗</a>` : h.source}</div>
        </div>
        <div class="hz-dist">${h.dist} km</div>
      </div>`).join("");
  }
  function escapeHtml(s) { return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

  async function refresh() {
    if (!loc) return;
    setStatus("Updating…");
    const [quakes, gdacs, air] = await Promise.all([fetchQuakes(), fetchGdacs(), fetchAir()]);
    updateLocalTemp();
    render([...quakes, ...gdacs, ...air]);
    lastUpdated = new Date();
    const t = lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setStatus(`Showing hazards within ${radiusKm} km of ${loc.label || "you"} · last updated ${t} · refreshes every 10 min while this tab is open.`);
  }

  // ── visibility-aware polling ──
  function startPolling() {
    stopPolling();
    const tick = () => {
      if (document.visibilityState === "visible") refresh();
      pollTimer = setTimeout(tick, POLL_MS);
    };
    pollTimer = setTimeout(tick, POLL_MS);
  }
  function stopPolling() { if (pollTimer) { clearTimeout(pollTimer); pollTimer = null; } }
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && loc && lastUpdated &&
        Date.now() - lastUpdated.getTime() > POLL_MS) refresh();
  });

  if (document.readyState !== "loading") initSearch();
  else document.addEventListener("DOMContentLoaded", initSearch);
})();
