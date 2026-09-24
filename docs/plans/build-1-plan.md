# Build 1 plan — Prove the loop

Source of truth: `../../CLAUDE.md` and `../../Working Files/product-plan.md`.
Rules: one step at a time, stop for approval after each check. Nothing is
installed or reprovisioned. Supabase is accessed server-side only, with the
service key.

## Before starting (hard gate)
- CLAUDE.md stack items are still `[confirm]`. Step 5 (deploy) needs GitHub,
  Vercel, and Domain confirmed. Step 1 needs the Supabase URL and service key.
- `.env.local` still holds stubs. Steps 1–4 need the real `NEXT_PUBLIC_SUPABASE_URL`
  and `SUPABASE_SERVICE_ROLE_KEY`. Step 6 also needs `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- Confirm a Next.js (App Router) app already exists in this repo and is linked
  to the Vercel project. If it isn't there, stop and ask. Don't scaffold without approval.
- Supabase and Vercel connectors must be signed in, and GitHub must connect.

## Step 1 — Database schema
Env: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (or the Supabase connector).
Apply one migration, `001_people_contacts`:
- `people`: `id uuid pk default gen_random_uuid()`, `email text not null unique`
  (stored lowercased and trimmed), `name text`, `phone text`, `company text`, `role text`,
  `source_site text`, `ok_to_contact boolean not null default false`,
  `attributes jsonb not null default '{}'`, `created_at timestamptz not null default now()`,
  `updated_at timestamptz not null default now()`. Add a trigger that sets `updated_at` on update.
- `contacts`: `id uuid pk default gen_random_uuid()`, `person_id uuid not null
  references people(id) on delete cascade`, `type text not null check (type in
  ('sizing','materials','laptop_fit'))`, `subject text`, `message text`, `source text`,
  `status text not null default 'new_lead' check (status in ('new_lead','contacted',
  'discovery_call','proposal','won','lost'))`, `metadata jsonb not null default '{}'`,
  `created_at timestamptz not null default now()`.
- Indexes: `contacts(person_id)`, `contacts(created_at desc)`.
- Enable RLS on both tables with no policies. The service key bypasses RLS, and the
  anon key can't read or write either table.
- Attributes contract: `laptop_size` ∈ `13"`,`14"`,`15"`,`16"+`; `primary_use` ∈
  `commute`,`travel`,`hiking`,`school`. The server checks these before any write.

**Check:** Supabase → Table Editor shows `people` and `contacts` with the columns above.
Inserting a contacts row with `type = 'wholesale'` fails with a check error.

## Step 2 — Server-only data layer
Env: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.
- `lib/supabase/admin.ts`: `import 'server-only'`, then create the client with the service key.
- `lib/leads.ts`, holding `submitInquiry(input)`:
  1. Validate. Email is required and normalized. Type must be in the enum. Attributes
     must match the contract. Message is required, max 5,000 chars.
  2. Upsert `people` `on conflict (email)`. Update name, phone, and attributes (merged).
     Once `ok_to_contact` is true, never set it back to false.
     `source_site = 'sample-project-brown-iota.vercel.app'`.
  3. Insert `contacts` with `person_id`, `type`, `subject` (default: "Sizing question" /
     "Materials question" / "Laptop fit question"), `message`, `source`, `status = 'new_lead'`.
- `source` is `website_form` by default. The operator logs email or phone inquiries
  through `/?source=email` or `/?source=phone`. Only those three values are accepted.

**Check:** `npm run build` passes, and a search of the client bundle (`.next/static`)
for the service key finds nothing.

## Step 3 — Public site and form at `/`
Env: none new.
- `app/page.tsx`: a Minimalist Apple marketing page (white, `#1D1D1F` text, `#0071E3`
  accent, `#F5F5F7` panels, Inter) with the inquiry form.
- Form fields: name, email*, phone, inquiry type* (radio: Sizing, Materials, Will it fit
  my laptop), laptop size (select), primary use (select), message*, and an
  "Email me news and new bags" checkbox that sets `ok_to_contact`.
- The form posts to a server action `app/actions.ts → submitInquiry`. On success it shows
  "Thanks, we'll reply within 24 hours". On error it shows the message inline.
  A hidden honeypot field drops bot submits.

**Check:** At `http://localhost:3000`, submit as `test1@example.com`. One new row appears in
Supabase `people` and one in `contacts` (status `new_lead`), with
`attributes = {"laptop_size": "...", "primary_use": "..."}`. Submit again with the same
email: `people` still has 1 row and `contacts` has 2.

## Step 4 — Leads page at `/admin`
Env: none new.
- `app/admin/page.tsx` is a server component with `dynamic = 'force-dynamic'` and no caching.
  It reads `contacts` joined to `people`, ordered `created_at desc`, limit 200.
- Columns: received (relative time), name, email, type, laptop size, primary use,
  message (first 140 chars, click to expand), source, status.
- A new_lead count sits at the top. Per the brief, the page stays open with no auth
  until Step 6.

**Check:** At `http://localhost:3000/admin`, both Step 3 submissions show, newest first,
with type, message, and both attributes readable without opening Supabase.

## Step 5 — Deploy to the live domain
Env: set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SITE_URL=https://sample-project-brown-iota.vercel.app`
in Vercel (Production and Preview). Needs GitHub, Vercel, and Domain confirmed in CLAUDE.md.
- Commit and push to the linked GitHub repo. Vercel deploys on push.

**Check:** Open `https://sample-project-brown-iota.vercel.app` on your phone and submit as
`test2@example.com`. Within seconds it's at the top of `https://sample-project-brown-iota.vercel.app/admin`.

## Step 6 — Lock /admin (only after you explicitly say "add auth")
Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- You create one user in Supabase → Authentication → Users (email and password,
  auto-confirm). I never handle the password. Turn off public sign-ups.
- `app/admin/login/page.tsx`: email and password form using Supabase Auth (`@supabase/ssr`
  cookies, if already in the project; otherwise ask before adding).
- `proxy.ts` (`middleware.ts` on Next < 16): every `/admin/*` route except `/admin/login`
  needs a valid session, or it redirects to `/admin/login`. `app/admin/page.tsx` also
  checks the user server-side (belt and braces).
- A sign-out button on `/admin`.

**Check:** In a private window, `https://sample-project-brown-iota.vercel.app/admin` redirects to
`/admin/login`. After you log in, the leads list shows.

## Step 7 — Run-through and catalog update
**Check:** You do it yourself: submit as a visitor on the live site, log in, and see the lead
in under 60 seconds from a cold start. Then I update CLAUDE.md: Build 1 status → done,
Admin account seeded → done, plus the confirmed stack values.

## Definition of Done (every box must be true)
- [ ] The contact form is live on my real domain, not localhost.
- [ ] Submitting it creates exactly one People row and one linked Contacts
  row, deduplicated by email on repeat submits.
- [ ] My chosen custom attributes are saved correctly inside attributes.
- [ ] A new Contacts row lands in status new_lead.
- [ ] I can log in to /admin with my one seeded account.
- [ ] The admin leads page shows the submission within seconds, newest first.
- [ ] I personally run the full flow once: submit as a visitor, log in, see it.
