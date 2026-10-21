-- Offertanfragen der Website huber-schreinerei.vercel.app
-- Anonyme Besucher dürfen nur einfügen. Lesen nur im Supabase-Dashboard (postgres / service_role).

create table if not exists public.offerte_anfragen (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  name        text not null check (char_length(name) between 2 and 120),
  phone       text not null check (char_length(phone) between 7 and 40),
  email       text check (email is null or (char_length(email) <= 160 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')),
  service     text not null check (service in (
                'Möbel nach Mass', 'Küchenbau', 'Innenausbau', 'Türen und Fenster',
                'Reparatur und Service', 'Beratung und Planung', 'Anderes')),
  message     text not null check (char_length(message) between 10 and 4000),
  page_url    text check (page_url is null or char_length(page_url) <= 300),
  user_agent  text check (user_agent is null or char_length(user_agent) <= 400),
  status      text not null default 'neu' check (status in ('neu', 'kontaktiert', 'offeriert', 'erledigt', 'spam'))
);

comment on table public.offerte_anfragen is 'Offertanfragen aus dem Kontaktformular der Website';

alter table public.offerte_anfragen enable row level security;

-- Nur Einfügen für anonyme Besucher. Kein Lesen, kein Ändern, kein Löschen.
drop policy if exists "website_insert" on public.offerte_anfragen;
create policy "website_insert" on public.offerte_anfragen
  for insert to anon
  with check (status = 'neu');

revoke all on public.offerte_anfragen from anon, authenticated;
grant insert (name, phone, email, service, message, page_url, user_agent) on public.offerte_anfragen to anon;

create index if not exists offerte_anfragen_created_at_idx on public.offerte_anfragen (created_at desc);
