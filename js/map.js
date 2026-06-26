/* ═══════════════════════════════════════════════════════════════════
   MAD — CHAPTER 02 · THE WORLD HAZARD MAP (P0-2)
   MapLibre GL JS, lazy-loaded when the chapter scrolls into view.
   Layers (all toggleable):
     1. Live hazards, last 7 days — USGS quakes + GDACS alerts (keyless,
        cached 1 hr client-side).
     2. Temperature anomaly vs 1951–1980 — zonal bands, recoloured by the
        time-scrubber's decade (NASA GISS zonal means).
     3. Forest-loss hotspots — Global Forest Watch 2024.
     4. Attribution studies — World Weather Attribution pins, filtered to
        the scrubbed year; click for the study.
   The scrubber (1980→2026) drives layers 2 & 4. prefers-reduced-motion
   swaps the slider for a discrete year <select>. Basemap: CARTO dark
   raster (keyless). A guaranteed fallback removes the loading string and
   degrades to the latitude band below if MapLibre can't load.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";
  const ML_JS = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js";
  const ML_CSS = "https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css";
  const HAZ_CACHE_KEY = "mad_haz_cache_v1";
  const HAZ_TTL = 60 * 60 * 1000; // 1 hour
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = (id) => document.getElementById(id);

  let map = null, started = false, year = 2026;
  const on = { hazards: true, anomaly: true, forest: true, wwa: true };

  /* ── decade bucket for the anomaly overlay ── */
  function decadeOf(y) { return y < 1990 ? 1980 : y < 2000 ? 1990 : y < 2010 ? 2000 : y < 2020 ? 2010 : 2020; }

  /* ── GeoJSON builders ── */
  function anomalyGeoJSON(y) {
    const dec = decadeOf(y);
    return {
      type: "FeatureCollection",
      features: ANOMALY_ZONES.map((z) => ({
        type: "Feature",
        properties: { an: z.d[dec] },
        geometry: { type: "Polygon", coordinates: [[[-180, z.s], [180, z.s], [180, z.n], [-180, z.n], [-180, z.s]]] },
      })),
    };
  }
  function forestGeoJSON() {
    return { type: "FeatureCollection", features: FOREST_HOTSPOTS.map((f) => ({
      type: "Feature", properties: { name: f.name, note: f.note },
      geometry: { type: "Point", coordinates: [f.lng, f.lat] } })) };
  }
  function wwaGeoJSON(y) {
    return { type: "FeatureCollection", features: WWA_STUDIES.filter((s) => s.year <= y).map((s) => ({
      type: "Feature", properties: { title: s.title, year: s.year, finding: s.finding, url: s.url },
      geometry: { type: "Point", coordinates: [s.lng, s.lat] } })) };
  }

  /* ── live hazards (cached) ── */
  async function getHazards() {
    try {
      const cached = JSON.parse(localStorage.getItem(HAZ_CACHE_KEY) || "null");
      if (cached && Date.now() - cached.ts < HAZ_TTL) return cached;
    } catch (_) {}
    const out = { ts: Date.now(), quakes: emptyFC(), gdacs: emptyFC() };
    try {
      const j = await (await fetch(USGS_FEED)).json();
      out.quakes = {
        type: "FeatureCollection",
        features: (j.features || []).map((f) => ({
          type: "Feature",
          properties: { mag: f.properties.mag, place: f.properties.place || "", time: f.properties.time, url: f.properties.url },
          geometry: f.geometry,
        })),
      };
    } catch (_) {}
    try {
      const g = await (await fetch("https://www.gdacs.org/gdacsapi/api/events/geteventlist/MAP")).json();
      const TYPE = { EQ: "Earthquake", TC: "Tropical cyclone", FL: "Flood", DR: "Drought", WF: "Wildfire", VO: "Volcano" };
      out.gdacs = {
        type: "FeatureCollection",
        features: (g.features || []).filter((f) => f.geometry && f.geometry.coordinates).map((f) => {
          const p = f.properties || {};
          return { type: "Feature",
            properties: { type: TYPE[p.eventtype] || (p.eventtype + " alert"), country: p.country || "", url: (p.url && p.url.report) || "https://www.gdacs.org/" },
            geometry: f.geometry };
        }),
      };
    } catch (_) {}
    try { localStorage.setItem(HAZ_CACHE_KEY, JSON.stringify(out)); } catch (_) {}
    return out;
  }
  function emptyFC() { return { type: "FeatureCollection", features: [] }; }

  /* ── lazy-load MapLibre, then init ── */
  function loadMapLibre() {
    return new Promise((resolve, reject) => {
      if (window.maplibregl) return resolve();
      const css = document.createElement("link");
      css.rel = "stylesheet"; css.href = ML_CSS; document.head.appendChild(css);
      const s = document.createElement("script");
      s.src = ML_JS; s.onload = resolve; s.onerror = reject; document.head.appendChild(s);
    });
  }

  function fallback(msg) {
    const el = $("hazardMap");
    if (el) el.innerHTML = `<div class="map-loading">${msg}</div>`;
    // the latitude band below still carries the spatial story
  }

  function init() {
    if (started) return; started = true;
    const wrap = $("hazardMap");
    if (!wrap) return;
    let settled = false;
    const guard = setTimeout(() => { if (!settled) fallback("Map unavailable right now — the warming-by-latitude band below carries the same story."); }, 10000);

    loadMapLibre().then(() => {
      try {
        map = new maplibregl.Map({
          container: "hazardMap",
          style: {
            version: 8,
            sources: { carto: { type: "raster", tileSize: 256,
              tiles: ["a", "b", "c", "d"].map((s) => `https://${s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png`),
              attribution: '© <a href="https://carto.com/attributions" target="_blank" rel="noopener">CARTO</a>, © OpenStreetMap' } },
            layers: [{ id: "carto", type: "raster", source: "carto" }],
          },
          center: [12, 22], zoom: window.innerWidth < 600 ? 0.6 : 1.25,
          minZoom: 0.4, maxZoom: 7, dragRotate: false, attributionControl: true,
        });
        map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
        map.on("load", () => { settled = true; clearTimeout(guard); addLayers(); });
        map.on("error", () => {}); // tile errors shouldn't blank the map
      } catch (e) { settled = true; clearTimeout(guard); fallback("Map unavailable right now — the latitude band below carries the same story."); }
    }).catch(() => { settled = true; clearTimeout(guard); fallback("Map couldn't load (offline or blocked). The latitude band below carries the same story."); });

    wireToolbar();
    wireScrubber();
  }

  async function addLayers() {
    $("mapLoading")?.remove();

    // 1 · anomaly (below points, above basemap)
    map.addSource("anomaly", { type: "geojson", data: anomalyGeoJSON(year) });
    map.addLayer({ id: "anomaly", type: "fill", source: "anomaly", paint: {
      "fill-opacity": 0.4,
      "fill-color": ["interpolate", ["linear"], ["get", "an"],
        0, "#2a6f8c", 0.8, "#6ec7e8", 1.5, "#cdd6dc", 2.2, "#ff8a5a", 3.2, "#ff6b35"],
    } });

    // 3 · forest hotspots
    map.addSource("forest", { type: "geojson", data: forestGeoJSON() });
    map.addLayer({ id: "forest", type: "circle", source: "forest", paint: {
      "circle-radius": 7, "circle-color": "#7dd66f", "circle-opacity": 0.85,
      "circle-stroke-width": 1.5, "circle-stroke-color": "#0a0d11" } });

    // 4 · WWA attribution pins
    map.addSource("wwa", { type: "geojson", data: wwaGeoJSON(year) });
    map.addLayer({ id: "wwa", type: "circle", source: "wwa", paint: {
      "circle-radius": 7, "circle-color": "#ffd166", "circle-opacity": 0.9,
      "circle-stroke-width": 1.5, "circle-stroke-color": "#0a0d11" } });

    // 1 · live hazards
    const haz = await getHazards();
    map.addSource("quakes", { type: "geojson", data: haz.quakes });
    map.addLayer({ id: "quakes", type: "circle", source: "quakes", paint: {
      "circle-radius": ["interpolate", ["linear"], ["get", "mag"], 2.5, 2.5, 5, 6, 7, 13],
      "circle-color": "#ff6b35", "circle-opacity": 0.6,
      "circle-stroke-width": 0.6, "circle-stroke-color": "#ff6b35" } });
    map.addSource("gdacs", { type: "geojson", data: haz.gdacs });
    map.addLayer({ id: "gdacs", type: "circle", source: "gdacs", paint: {
      "circle-radius": 8, "circle-color": "#ff6b35", "circle-opacity": 0.05,
      "circle-stroke-width": 1.6, "circle-stroke-color": "#ff8a5a" } });

    // popups
    popup("quakes", (p) => `<div class="wwa-pop-h">M${(+p.mag).toFixed(1)} earthquake</div><div class="wwa-pop-meta">${esc(p.place)} · ${new Date(p.time).toLocaleDateString()}</div><a href="${p.url}" target="_blank" rel="noopener">USGS detail ↗</a>`);
    popup("gdacs", (p) => `<div class="wwa-pop-h">${esc(p.type)}</div><div class="wwa-pop-meta">${esc(p.country)}</div><a href="${p.url}" target="_blank" rel="noopener">GDACS alert ↗</a>`);
    popup("forest", (p) => `<div class="wwa-pop-h">${esc(p.name)}</div><div class="wwa-pop-meta">Global Forest Watch 2024</div>${esc(p.note)}.`);
    popup("wwa", (p) => `<div class="wwa-pop-h">${esc(p.title)}</div><div class="wwa-pop-meta">World Weather Attribution · ${p.year}</div>${esc(p.finding)} <a href="${p.url}" target="_blank" rel="noopener">study ↗</a>`);

    applyVisibility();
  }

  function popup(layer, html) {
    map.on("click", layer, (e) => {
      const f = e.features[0];
      new maplibregl.Popup({ closeButton: true, maxWidth: "260px" })
        .setLngLat(f.geometry.type === "Point" ? f.geometry.coordinates : e.lngLat)
        .setHTML(html(f.properties)).addTo(map);
    });
    map.on("mouseenter", layer, () => (map.getCanvas().style.cursor = "pointer"));
    map.on("mouseleave", layer, () => (map.getCanvas().style.cursor = ""));
  }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }

  function applyVisibility() {
    if (!map || !map.getLayer("anomaly")) return;
    const set = (id, vis) => map.getLayer(id) && map.setLayoutProperty(id, "visibility", vis ? "visible" : "none");
    set("anomaly", on.anomaly);
    set("forest", on.forest);
    set("wwa", on.wwa);
    set("quakes", on.hazards);
    set("gdacs", on.hazards);
  }

  /* ── toolbar (keyboard-operable buttons) ── */
  function wireToolbar() {
    document.querySelectorAll("#mapToolbar .map-layer").forEach((b) => b.addEventListener("click", () => {
      const k = b.dataset.layer;
      on[k] = !on[k];
      b.classList.toggle("on", on[k]);
      b.setAttribute("aria-pressed", String(on[k]));
      applyVisibility();
    }));
  }

  /* ── time scrubber (range + reduced-motion select) ── */
  function wireScrubber() {
    const range = $("mapYear"), sel = $("mapYearSelect"), out = $("scrubYear");
    if (sel) {
      for (let y = 2026; y >= 1980; y--) {
        const o = document.createElement("option"); o.value = y; o.textContent = y; sel.appendChild(o);
      }
      sel.value = String(year);
      sel.addEventListener("change", () => setYear(+sel.value));
    }
    if (range) range.addEventListener("input", () => setYear(+range.value));
    if (out) out.textContent = year;
  }
  function setYear(y) {
    year = y;
    const out = $("scrubYear"); if (out) out.textContent = y;
    const range = $("mapYear"); if (range && +range.value !== y) range.value = y;
    const sel = $("mapYearSelect"); if (sel && +sel.value !== y) sel.value = y;
    if (map && map.getSource("anomaly")) map.getSource("anomaly").setData(anomalyGeoJSON(y));
    if (map && map.getSource("wwa")) map.getSource("wwa").setData(wwaGeoJSON(y));
  }

  /* ── lazy trigger ── */
  function observe() {
    const el = $("hazardMap"); if (!el) return;
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) { init(); io.disconnect(); }
    }), { rootMargin: "300px" });
    io.observe(el);
  }
  if (document.readyState !== "loading") observe();
  else document.addEventListener("DOMContentLoaded", observe);
})();
