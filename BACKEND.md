# Backend setup — the coalition counter

The artwork works with **no backend** (sign-ups live in the visitor's own browser).
To make the coalition counter and priority tallies **shared across all visitors**,
wire a free Supabase project. This is the same pattern as *The Cost of War*, so if
you set that one up, this is identical.

## Steps (≈ 10 minutes)

1. Go to [supabase.com](https://supabase.com) → **New project** (free tier is fine).
2. In the project, open the **SQL editor** → paste and run
   [`supabase/schema.sql`](supabase/schema.sql). This creates the `submissions`
   table, locks it down with row-level security, and creates three read-only
   aggregate functions (`coalition_count`, `priority_tally`, `signups_by_country`).
3. Open **Project Settings → API**. Copy:
   - the **Project URL** (e.g. `https://abcdxyz.supabase.co`)
   - the **anon / public** key.
4. Paste both into [`js/config.js`](js/config.js):
   ```js
   window.MAD_CONFIG = {
     SUPABASE_URL: "https://abcdxyz.supabase.co",
     SUPABASE_ANON_KEY: "eyJhbGciOi…",   // the anon key, safe to publish
     SEED_COUNT: 4120,
     SUBMIT_URL: "",
     TURNSTILE_SITE_KEY: "",
   };
   ```
5. Deploy. The counter is now live.

## Why the anon key is safe to publish

Row-level security lets the anon key do exactly two things: **insert** one validated
sign-up (1–12 ranked priorities, a country, an optional email ≤ 254 chars), and
**call the three aggregate functions**. It cannot read raw rows, so emails are never
publicly readable. Never put the `service_role` key in client code.

## Optional hardening (before any big public push)

Add a validated, captcha-gated edge function and a Cloudflare Turnstile widget:
- Deploy a `submit` edge function that re-validates and checks the Turnstile token,
  then set `SUBMIT_URL` and `TURNSTILE_SITE_KEY` in `config.js`. The client
  (`js/backend.js`) already routes through `SUBMIT_URL` when present.

## The two keyed hazard APIs (separate from Supabase)

`js/hazard.js` already runs on free keyless APIs (USGS, Open-Meteo, GDACS). Two more
need a free key — wire them through a tiny proxy so the key isn't exposed:
- **NASA FIRMS** (active fires): get a `MAP_KEY` at
  <https://firms.modaps.eosdis.nasa.gov/api/>. CSV endpoint by area.
- **OpenAQ v3** (air monitors): API key at <https://docs.openaq.org/>.

A Cloudflare Worker that injects the key and forwards the request is the cheapest
route; then add the fetch + parse in `hazard.js` next to the existing sources.
