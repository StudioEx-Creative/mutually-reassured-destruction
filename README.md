# Mutually Reassured Destruction

An interactive data artwork about the planetary bill of carbon — and the ledger of
choices that produced it. A climate companion to **[The Cost of War](https://studioex-creative.github.io/cost-of-war/)**.

**Blueprint × StudioEX · 2026.** Same hand, same standard of citation; its own voice —
a serif display and an ice-and-ember palette.

---

## What it is

A single static page (no framework, no build step required) that moves through:

1. **Prologue · The Ticker** — fossil CO₂ released since you opened the page (1,208 t/s, GCP 2025).
2. **Ch.01 · The Record** — the canonical climate indicators as sortable, sourced cards with sparklines + heat stripes.
3. **Ch.02 · The Map** — a full-bleed MapLibre world map: live hazards (USGS quakes + GDACS, 7 days), a decadal temperature-anomaly overlay, forest-loss hotspots and World Weather Attribution pins, with a 1980→today time scrubber and the latitude band beneath.
4. **Ch.03 · The Ledger** — emissions by state, by corporation (Carbon Majors), and the 30-year policy/lobbying timeline.
5. **Ch.04 · The Forecast** — a scenario explorer (IPCC / CAT / IEA), every number with its scenario and range.
6. **Coda · Have your say** — rank priorities → your area (live hazards) → an auto-written, editable letter to your head of state → the coalition globe + shareable card.

Every visible number is sourced inline, in its detail panel, and in
[`DATA-SOURCES.md`](DATA-SOURCES.md). All figures verified against primary sources in June 2026.

## Run it locally

It's static. Any static server works:

```bash
cd ~/Projects/mad
python3 -m http.server 8000   # then open http://localhost:8000
```

## Files

```
index.html          # structure, all chapters
css/style.css       # design system (Source Serif 4 / Inter / IBM Plex Mono; ice + ember)
js/data.js          # ALL figures + SOURCES manifest (the single source of truth)
js/main.js          # ticker, cards, stripes, ledger, forecast, coda, letter, globe, share card
js/hazard.js        # "Your area" live hazard feed (free keyless APIs)
js/config.js        # backend keys (empty = local demo mode)
js/backend.js       # Supabase client for the coalition (mirrors Cost of War)
supabase/schema.sql # locked-down table + aggregate RPCs
privacy.html        # plain-language privacy policy
DATA-SOURCES.md     # master audit trail + refresh calendar
BACKEND.md          # backend dev setup notes
```

## For the backend developer

The coalition counter runs in **local demo mode** until Supabase is wired — exactly
the Cost of War pattern, so the setup is identical. See [`BACKEND.md`](BACKEND.md).
Short version: create a free Supabase project, run `supabase/schema.sql`, paste the
project URL + anon key into `js/config.js`. The anon key is safe to publish.

**Two live APIs still need a free key** (everything else is keyless and already wired):
- **NASA FIRMS** active fires — needs a free `MAP_KEY`.
- **OpenAQ v3** air monitors — needs an API key.
Route both through a small proxy (e.g. a Cloudflare Worker) so the key isn't exposed,
then add the fetch in `js/hazard.js`. The feed already works without them (USGS quakes,
Open-Meteo weather + air quality, GDACS).

## Deploy (GitHub Pages — same as Cost of War)

Push to a public repo under the `StudioEx-Creative` org and enable Pages from `main`
root. Bump the `?v=2026rN` query string on the CSS/JS tags in `index.html` each deploy
so Pages serves fresh assets. URL: `studioex-creative.github.io/mutually-reassured-destruction/`.

## Known v1 scope (for the next pass)

This is a complete, deployable first pass built to the Cost of War caliber. Deliberately
deferred, with hooks already in place:
- **Map layers needing an API key** — NASA FIRMS active fires and NOAA NHC cyclones; and
  the heavier build-time layers (GFW raster tiles, full 1°-gridded anomaly). The map ships
  with live USGS quakes + GDACS, a decadal zonal-anomaly overlay, forest hotspots and WWA pins.
- **`scripts/fetch.mjs`** build-time data snapshot — v1 figures are hand-verified
  (June 2026) and documented; the heat-stripes per-year CSV is the one series flagged to
  swap for the authoritative Berkeley Earth file.
- **NASA FIRMS / OpenAQ** live layers (need keys, see above).
- **OG/Twitter card image** at `assets/og.png` (meta tags reference it; image to be added).

## Accessibility & performance
Mobile-first; keyboard-navigable; `prefers-reduced-motion` honoured (background motes,
reveals, counters, globe auto-rotate all disable); tabular figures; ARIA on interactive
SVG and the dialog. Heavy assets (globe) lazy-load on scroll. No third-party trackers.

---

*An artwork by Blueprint · Produced by StudioEX · 2026.*
