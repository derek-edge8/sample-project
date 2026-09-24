import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { inquiryTypeLabel } from "@/lib/crm";
import { listLeads } from "@/lib/leads";
import { signOutAction } from "./actions";

export const metadata: Metadata = { title: "Leads · sample-project admin", robots: { index: false } };

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

function timeAgo(iso: string) {
  const seconds = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
  const steps: [Intl.RelativeTimeFormatUnit, number][] = [
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60],
  ];
  for (const [unit, size] of steps) {
    if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
  }
  return "just now";
}

const STATUS_LABEL: Record<string, string> = {
  new_lead: "New",
  contacted: "Contacted",
  discovery_call: "Discovery call",
  proposal: "Proposal",
  won: "Won",
  lost: "Lost",
};

export default async function LeadsPage() {
  const admin = await requireAdmin();
  const leads = await listLeads();
  const newCount = leads.filter((l) => l.status === "new_lead").length;

  return (
    <main className="flex-1 bg-panel">
      <header className="border-b border-line bg-bg">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <span className="font-semibold tracking-tight">sample-project admin</span>
          <div className="flex items-center gap-2 text-sm text-muted">
            <span className="hidden sm:inline">{admin.email}</span>
            <form action={signOutAction}>
              <button type="submit" className="btn-quiet">Sign out</button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight">Leads</h1>
            <p className="mt-1 text-muted">Newest first · {leads.length} total</p>
          </div>
          <div className="rounded-2xl bg-bg px-5 py-3 text-right">
            <p className="text-3xl font-semibold text-accent">{newCount}</p>
            <p className="text-sm text-muted">waiting for a reply</p>
          </div>
        </div>

        {leads.length === 0 ? (
          <div className="mt-8 rounded-2xl bg-bg p-12 text-center text-muted">
            No leads yet. Submit the form on the homepage and it will appear here.
          </div>
        ) : (
          <ul className="mt-8 space-y-3">
            {leads.map((lead) => (
              <li key={lead.id} className="rounded-2xl bg-bg p-5 sm:p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-lg font-semibold">{lead.person.name || lead.person.email}</p>
                    <p className="truncate text-sm text-muted">
                      <a href={`mailto:${lead.person.email}`} className="text-accent hover:underline">{lead.person.email}</a>
                      {lead.person.phone && <> · {lead.person.phone}</>}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="rounded-full bg-accent/10 px-3 py-1 font-medium text-accent">
                      {inquiryTypeLabel(lead.type)}
                    </span>
                    <span className="rounded-full bg-panel px-3 py-1 text-ink">{STATUS_LABEL[lead.status] ?? lead.status}</span>
                    <time dateTime={lead.created_at} title={new Date(lead.created_at).toLocaleString("en-AU")} className="text-muted">
                      {timeAgo(lead.created_at)}
                    </time>
                  </div>
                </div>

                <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-1 text-sm">
                  <div className="flex gap-2"><dt className="text-muted">Laptop size</dt><dd>{lead.person.attributes?.laptop_size ?? "—"}</dd></div>
                  <div className="flex gap-2"><dt className="text-muted">Primary use</dt><dd className="capitalize">{lead.person.attributes?.primary_use ?? "—"}</dd></div>
                  <div className="flex gap-2"><dt className="text-muted">Source</dt><dd>{(lead.source ?? "website_form").replace("_", " ")}</dd></div>
                </dl>

                {lead.message && (
                  lead.message.length > 140 ? (
                    <details className="mt-4 text-ink">
                      <summary className="cursor-pointer list-none">
                        {lead.message.slice(0, 140)}… <span className="text-accent">Read more</span>
                      </summary>
                      <p className="mt-2 whitespace-pre-wrap">{lead.message}</p>
                    </details>
                  ) : (
                    <p className="mt-4 whitespace-pre-wrap">{lead.message}</p>
                  )
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
