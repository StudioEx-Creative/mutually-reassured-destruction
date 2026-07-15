-- ════════════════════════════════════════════════════════════════════
-- MUTUALLY REASSURED DESTRUCTION — Supabase schema
-- Coalition sign-ups + aggregate tallies for the globe and priority bars.
-- Locked down with row-level security: the public anon key may INSERT a
-- single validated row and may READ only the aggregate RPCs below — never
-- the raw rows (so emails are never publicly readable).
-- Mirrors The Cost of War schema; safe to publish the anon key.
-- Run this in the Supabase SQL editor, then paste URL + anon key into
-- js/config.js.
-- ════════════════════════════════════════════════════════════════════

create table if not exists submissions (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  ranking     int[]       not null,          -- ordered priority indices
  country     text        not null default 'Unknown',
  email       text                            -- nullable; anonymous allowed
);

alter table submissions enable row level security;

-- Allow anonymous INSERT, with light validation. No SELECT on raw rows.
drop policy if exists "anon insert" on submissions;
create policy "anon insert" on submissions
  for insert to anon
  with check (
    array_length(ranking, 1) between 1 and 12
    and char_length(country) <= 64
    and (email is null or char_length(email) <= 254)
  );

-- ── Aggregate RPCs (security definer) — the only public read path ──

-- total sign-ups
create or replace function coalition_count()
returns bigint language sql security definer set search_path = public as $$
  select count(*) from submissions;
$$;

-- votes per priority index (each appearance in a ranking = one vote)
create or replace function priority_tally()
returns table(priority int, votes bigint)
language sql security definer set search_path = public as $$
  select p as priority, count(*) as votes
  from submissions, unnest(ranking) as p
  group by p order by votes desc;
$$;

-- sign-ups per country (drives the 3D globe)
create or replace function signups_by_country()
returns table(country text, signups bigint)
language sql security definer set search_path = public as $$
  select country, count(*) as signups
  from submissions
  where country <> 'Unknown'
  group by country order by signups desc;
$$;

grant execute on function coalition_count()    to anon;
grant execute on function priority_tally()     to anon;
grant execute on function signups_by_country() to anon;
