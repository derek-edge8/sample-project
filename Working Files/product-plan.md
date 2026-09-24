# Product plan · sample-project

## What we're actually building and why

In one sentence: Today a backpack inquiry can arrive by website form, email,
or phone and live only in the channel it came in on, so it can sit unanswered
or be forgotten after the first chat; this CRM puts every inquiry in one list
with a stage and a timestamp, so I can answer every sizing, materials, and
laptop-fit question within 24 hours and see exactly which buyers are one
reply away from purchasing.

Who it's for: me, the operator, who has to answer and follow up on every
inquiry; and the shopper filling out my form, who is about to buy a backpack
and needs one specific answer first (will it fit, what's it made of, which
size) before they commit.

What we are deliberately NOT building: no affiliates, no subscriptions,
no cohorts, no analytics dashboards, no integrations beyond what's named
here. If it isn't load-bearing for capturing and working a lead, it's out.

## The brief (drives every /goal command)

You are my engineering partner for building my CRM today. The stack is
already installed and wired (Next.js on Vercel, Supabase, Resend, domain).
Do not reinstall or reprovision anything. Build the app with two surfaces:
a public marketing site that captures leads, and an /admin CRM.
The /admin section is open and unprotected at first; it gets locked
down with email-and-password Supabase Auth later in the build. Do
not add any auth, login page, or route protection until I explicitly
ask for it.

The CRM has exactly four parts:

- People: a contact directory, one row per person, deduplicated by
  email. Columns: id, email (unique), name, phone, company, role,
  source_site, ok_to_contact, attributes (jsonb), created_at,
  updated_at. The custom attributes I named go inside attributes.
  The keys are my attribute names and the values match the types I
  specified.

- Contacts: an inquiry pipeline. Each inquiry links to a person and
  moves through stages new_lead, contacted, discovery_call,
  proposal, won, lost. Columns: id, person_id, type, subject,
  message, source, status, metadata (jsonb), created_at. The type
  field is constrained to exactly the inquiry types I gave in Q4
  (lowercased).

- activity_log: every status change on a Contacts row writes one row
  here. Columns: id, contact_id, person_id, from_status, to_status,
  actor, note, created_at.

- Orders: what people bought. Columns: id, person_id, product_name,
  amount_cents, currency, status (pending, paid, refunded,
  cancelled), created_at.

- Newsletter: people who opted in to email, tracked by
  people.ok_to_contact = true. No separate table.

Conventions:
- Upsert people by email; never duplicate a person.
- Access Supabase server-side with the service key; never expose
  secrets to the client; keys live in environment variables only.
- Keep it simple: no affiliates, no subscriptions, no cohorts.
- Work one step at a time and wait for my approval before each step.

My business: sample-project — sells backpacks
My inquiry types (contacts.type enum): sizing, materials, laptop_fit
My design system: Minimalist Apple
My brand colors: design system defaults — main #1D1D1F (near-black text), accent #0071E3 (blue for buttons and links), background #FFFFFF with #F5F5F7 soft-gray panels
My custom attributes (people.attributes jsonb keys): laptop_size (pick-from-list: 13", 14", 15", 16"+); primary_use (pick-from-list: commute, travel, hiking, school)
My domain: sample-project-brown-iota.vercel.app (Vercel default; a custom domain is required before Resend sending in Build 2)

## BUILD 1 (small) — Prove the loop

Goal: A stranger can submit an inquiry on my live site and I can see
that lead inside /admin, on the same day, without anyone touching the
database by hand. This closes the exact gap I named in Q1: inquiries
scattered across form, email, and phone with no single place to see them.
It is the smallest thing that proves the whole system works end to end.
Nothing else matters until this is real.

The problem: A shopper asks "will this fit my 16-inch laptop?" and the
question sits in whichever channel it arrived in. There is no single list,
so an unanswered question is invisible, and an unanswered pre-purchase
question is a lost sale.

The data: People (email, name, phone, ok_to_contact, attributes with
laptop_size and primary_use) and Contacts (type of sizing, materials, or
laptop_fit; subject; message; source; status). Nothing else.

The workflow: Shopper opens the site → fills in name, email, optional
phone, picks an inquiry type, laptop size, and primary use, writes a
message → submits → server upserts the People row by email and creates a
Contacts row in new_lead → I open /admin and see it at the top of the list.
Inquiries that arrive by email or phone get entered through the same form,
so they land in the same list.

The ROI: At about 10 inquiries a week, every inquiry that goes unseen is
a buyer lost at the moment they were ready to buy. Recovering even one lost
inquiry a week is roughly 52 extra sales a year. Build 1 costs one session.
(Order value is not yet known; put it in Orders during Build 2 to turn this
into a dollar figure.)

Scope: the People and Contacts tables with my custom attributes wired
into the jsonb column; a working contact form on the live marketing
site that writes a People row (upserted by email) and a linked Contacts
row; one admin login with a single verified account; one admin page
that lists incoming leads newest first.

Definition of Done (every box must be true):
- The contact form is live on my real domain, not localhost.
- Submitting it creates exactly one People row and one linked Contacts
  row, deduplicated by email on repeat submits.
- My chosen custom attributes are saved correctly inside attributes.
- A new Contacts row lands in status new_lead.
- I can log in to /admin with my one seeded account.
- The admin leads page shows the submission within seconds, newest first.
- I personally run the full flow once: submit as a visitor, log in, see it.

Success Criteria (how we know it's good, not just done):
- From a cold start, I can go submit to visible in under 60 seconds.
- Two submissions from the same email produce one person, not two.
- I can read the lead's name, type, message, and my custom attributes
  on the admin page without opening Supabase.
- No lead can land and go unseen, which is the failure mode I named in Q1.

## BUILD 2 (all) — Make it the system I run the business from

Goal: Turn the proven loop into the place I actually manage relationships
and money. After this, I work leads, record what people bought, and keep
my newsletter list entirely from /admin behind my login, and every new
lead gets an automatic confirmation email. This is what makes my Q2
ninety-day win achievable: every inquiry answered within 24 hours, 100% of
inquiries tracked in /admin with a current stage, and 3 in 10 inquiries
converting to a paying customer.

The problem: Seeing a lead is not the same as closing it. Without stages,
a history, and a record of what was bought, I can't tell which shoppers I
owe a reply, which are about to buy, or whether my 3-in-10 target is real.

The data: everything in Build 1, plus activity_log (every stage change,
with who made it) and Orders (product, amount, status, linked to the
person). Newsletter is a filtered view of People where ok_to_contact = true.

The workflow: Lead lands → Resend sends the shopper a confirmation →
I reply and move it to contacted → a fit or sizing call moves it to
discovery_call → I send a recommendation (proposal) → they buy (won, and I
add an Orders row) or don't (lost). Every move is logged. Each morning I
open /admin and clear everything still sitting in new_lead.

The ROI: 10 inquiries a week at a 3-in-10 conversion rate is about 3
customers a week, or roughly 156 a year. Orders gives me the average order
value, so from day one I can see the real dollar value of the pipeline and
of every lead that goes to lost.

Scope: the rest of the /admin back end behind my login: the full People
directory, all inquiries with working pipeline stages, the Orders list,
and the Newsletter list (ok_to_contact = true). Plus Resend wired so a
confirmation email fires on form submit. Every Contacts status change
writes an activity_log row.

Definition of Done (every box must be true):
- All four parts (People, Contacts, Orders, Newsletter) are visible and
  usable in /admin, and all of /admin sits behind my login.
- I can move a Contacts row through new_lead to contacted to
  discovery_call to proposal to won or lost from the interface.
- Each status change writes one activity_log row with from_status,
  to_status, and actor.
- The People directory is searchable and shows my custom attributes.
- I can add an Orders row against a person and see it on their record.
- The Newsletter list shows everyone with ok_to_contact = true.
- Resend is connected, the sending domain is verified, and a real
  confirmation email arrives after a form submit.

Success Criteria (how we know it's good, not just done):
- I can run a lead from first inquiry to won without leaving /admin or
  touching the database.
- A person's full history (their inquiries, status changes, and orders)
  is visible in one place.
- A test submission produces a confirmation email in the inbox, not spam,
  with my domain as the sender.
- Nothing in /admin is reachable without logging in.
- At my real inquiry volume from Q2 (about 10 a week), this keeps up
  without me dropping to the database by hand.

Blocker to clear before Build 2: Resend cannot verify a vercel.app
address. Connect a custom domain I own to the Vercel project and verify it
in Resend before the confirmation email step.
