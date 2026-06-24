/* ═══════════════════════════════════════════════════════════════════
   MUTUALLY ASSURED DESTRUCTION — RUNTIME CONFIG
   ───────────────────────────────────────────────────────────────────
   To make the coalition counter and priority tallies LIVE (shared across
   all visitors), create a free Supabase project and paste its URL + anon
   key below. Until then the site runs in local demo mode (counts live only
   in the visitor's own browser). Identical pattern to The Cost of War, so
   the same backend developer can wire it the same way.

   Steps — see BACKEND.md:
     1. supabase.com → New project (free tier).
     2. SQL editor → paste & run supabase/schema.sql.
     3. Project Settings → API → copy the Project URL and the anon key.
     4. Paste them below and deploy.

   The anon key is SAFE to publish (it only allows the locked-down inserts
   and aggregate reads defined by the row-level-security policies). Never
   paste the service_role key here.
   ═══════════════════════════════════════════════════════════════════ */
window.MAD_CONFIG = {
  SUPABASE_URL: "",       // e.g. "https://abcdxyz.supabase.co"
  SUPABASE_ANON_KEY: "",  // the public anon key
  SEED_COUNT: 4120,       // base number shown before/under real submissions

  // Optional, recommended before public promotion: validated, captcha-gated
  // edge function + Cloudflare Turnstile. Leave blank to skip.
  SUBMIT_URL: "",
  TURNSTILE_SITE_KEY: "",
};
