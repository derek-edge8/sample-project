-- CRM schema for sample-project (Build 1).
-- Tables are reached only from the server with the service key. RLS is on with
-- no policies, so the anon/publishable key can't read or write anything.

create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- People: one row per person, deduplicated by email ------------------------
create table public.people (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique check (email = lower(btrim(email)) and email <> ''),
  name          text,
  phone         text,
  company       text,
  role          text,
  source_site   text,
  ok_to_contact boolean not null default false,
  attributes    jsonb not null default '{}'::jsonb check (
    jsonb_typeof(attributes) = 'object'
    and (not attributes ? 'laptop_size' or attributes->>'laptop_size' in ('13"', '14"', '15"', '16"+'))
    and (not attributes ? 'primary_use' or attributes->>'primary_use' in ('commute', 'travel', 'hiking', 'school'))
  ),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger people_set_updated_at
  before update on public.people
  for each row execute function public.set_updated_at();

-- Contacts: the inquiry pipeline -------------------------------------------
create table public.contacts (
  id         uuid primary key default gen_random_uuid(),
  person_id  uuid not null references public.people(id) on delete cascade,
  type       text not null check (type in ('sizing', 'materials', 'laptop_fit')),
  subject    text,
  message    text,
  source     text check (source in ('website_form', 'email', 'phone')),
  status     text not null default 'new_lead'
             check (status in ('new_lead', 'contacted', 'discovery_call', 'proposal', 'won', 'lost')),
  metadata   jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index contacts_person_id_idx on public.contacts (person_id);
create index contacts_created_at_idx on public.contacts (created_at desc);

-- activity_log: one row per Contacts status change -------------------------
create table public.activity_log (
  id          uuid primary key default gen_random_uuid(),
  contact_id  uuid not null references public.contacts(id) on delete cascade,
  person_id   uuid not null references public.people(id) on delete cascade,
  from_status text,
  to_status   text not null,
  actor       text not null default 'system',
  note        text,
  created_at  timestamptz not null default now()
);

create index activity_log_contact_id_idx on public.activity_log (contact_id);
create index activity_log_person_id_idx on public.activity_log (person_id);

-- Every status change writes a log row. The app sets the actor per transaction
-- with: select set_config('app.actor', '<email>', true)
create or replace function public.log_contact_status_change()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.status is distinct from old.status then
    insert into public.activity_log (contact_id, person_id, from_status, to_status, actor)
    values (new.id, new.person_id, old.status, new.status,
            coalesce(nullif(current_setting('app.actor', true), ''), 'system'));
  end if;
  return new;
end $$;

create trigger contacts_log_status_change
  after update of status on public.contacts
  for each row execute function public.log_contact_status_change();

-- Orders: what people bought -----------------------------------------------
create table public.orders (
  id           uuid primary key default gen_random_uuid(),
  person_id    uuid not null references public.people(id) on delete cascade,
  product_name text not null,
  amount_cents integer not null check (amount_cents >= 0),
  currency     text not null default 'AUD',
  status       text not null default 'pending'
               check (status in ('pending', 'paid', 'refunded', 'cancelled')),
  created_at   timestamptz not null default now()
);

create index orders_person_id_idx on public.orders (person_id);

-- Newsletter is not a table: people where ok_to_contact = true.

alter table public.people       enable row level security;
alter table public.contacts     enable row level security;
alter table public.activity_log enable row level security;
alter table public.orders       enable row level security;

-- submit_inquiry: upsert the person by email and create a new_lead Contacts
-- row in one transaction. Attributes merge; ok_to_contact never flips back
-- to false once someone has opted in.
create or replace function public.submit_inquiry(
  p_email text,
  p_name text,
  p_phone text,
  p_ok_to_contact boolean,
  p_attributes jsonb,
  p_type text,
  p_subject text,
  p_message text,
  p_source text,
  p_source_site text,
  p_metadata jsonb default '{}'::jsonb
) returns table (person_id uuid, contact_id uuid)
language plpgsql set search_path = '' as $$
declare
  v_person_id uuid;
  v_contact_id uuid;
begin
  insert into public.people as p (email, name, phone, ok_to_contact, attributes, source_site)
  values (lower(btrim(p_email)), nullif(btrim(p_name), ''), nullif(btrim(p_phone), ''),
          coalesce(p_ok_to_contact, false), coalesce(p_attributes, '{}'::jsonb), p_source_site)
  on conflict (email) do update set
    name          = coalesce(excluded.name, p.name),
    phone         = coalesce(excluded.phone, p.phone),
    ok_to_contact = p.ok_to_contact or excluded.ok_to_contact,
    attributes    = p.attributes || excluded.attributes
  returning p.id into v_person_id;

  insert into public.contacts (person_id, type, subject, message, source, metadata)
  values (v_person_id, p_type, p_subject, p_message, p_source, coalesce(p_metadata, '{}'::jsonb))
  returning id into v_contact_id;

  return query select v_person_id, v_contact_id;
end $$;

revoke execute on function public.submit_inquiry(text, text, text, boolean, jsonb, text, text, text, text, text, jsonb)
  from public, anon, authenticated;
