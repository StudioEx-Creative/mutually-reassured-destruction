/* ═══════════════════════════════════════════════════════════════════
   MAD — BACKEND CLIENT (Supabase)
   ───────────────────────────────────────────────────────────────────
   Thin layer over Supabase for the coalition counter, submissions and
   priority tallies. If no credentials are configured (js/config.js), the
   whole thing stays dormant and main.js falls back to localStorage, so the
   site works either way. Mirrors The Cost of War's backend.

   Exposes, when configured:
     window.__madConfigured  – true
     window.__madLive        – { ready, count, tally:{priorityIndex:votes} }
     window.__madSubmit(d)   – async insert one submission
     window.__madCountrySignups – { country: signups } for the globe
     window.onMadHydrated    – set by main.js; called after first load
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  const cfg = window.MAD_CONFIG || {};
  const live = { ready: false, count: 0, tally: {} };
  window.__madLive = live;

  const ready = cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY && window.supabase;
  window.__madConfigured = !!ready;
  if (!ready) return; // demo mode — main.js uses localStorage

  const sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  window.__madClient = sb;
  window.__madTurnstileKey = cfg.TURNSTILE_SITE_KEY || "";

  async function hydrate() {
    try {
      const [{ data: count }, { data: tally }, { data: byCountry }] = await Promise.all([
        sb.rpc("coalition_count"),
        sb.rpc("priority_tally"),
        sb.rpc("signups_by_country"),
      ]);
      live.count = count ?? 0;
      live.tally = {};
      (tally || []).forEach((r) => { live.tally[r.priority] = r.votes; });
      window.__madCountrySignups = {};
      (byCountry || []).forEach((r) => { window.__madCountrySignups[r.country] = r.signups; });
      live.ready = true;
      if (typeof window.onMadHydrated === "function") window.onMadHydrated();
    } catch (e) {
      console.warn("[mad] coalition hydrate failed:", e.message);
    }
  }

  window.__madSubmit = async function (d, turnstileToken) {
    try {
      if (cfg.SUBMIT_URL) {
        const res = await fetch(cfg.SUBMIT_URL, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            apikey: cfg.SUPABASE_ANON_KEY,
            Authorization: "Bearer " + cfg.SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            ranking: d.ranking, country: d.country,
            email: d.email || null, turnstileToken: turnstileToken || null,
          }),
        });
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          console.warn("[mad] submit rejected:", j.error || res.status);
          return false;
        }
      } else {
        await sb.from("submissions").insert({
          ranking: d.ranking, country: d.country, email: d.email || null,
        });
      }
      live.count += 1;
      (d.ranking || []).forEach((i) => { live.tally[i] = (live.tally[i] || 0) + 1; });
      return true;
    } catch (e) {
      console.warn("[mad] submit failed:", e.message);
      return false;
    }
  };

  window.__madHydrate = hydrate;
  hydrate();
})();
