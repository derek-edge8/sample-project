"use client";

import { useActionState } from "react";
import { INQUIRY_TYPES, LAPTOP_SIZES, PRIMARY_USES, type Source } from "@/lib/crm";
import { submitInquiryAction, type InquiryState } from "./actions";

export function InquiryForm({ source }: { source: Source }) {
  const [state, action, pending] = useActionState<InquiryState, FormData>(submitInquiryAction, null);

  if (state?.ok) {
    return (
      <div className="rounded-2xl bg-panel p-10 text-center" role="status">
        <p className="text-2xl font-semibold">Thanks, we&apos;ve got it.</p>
        <p className="mt-2 text-muted">We&apos;ll reply within 24 hours.</p>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="source" value={source} />
      <div aria-hidden className="absolute -left-[9999px]">
        <label>
          Company website
          <input type="text" name="company_website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <fieldset>
        <legend className="label">What&apos;s your question about?</legend>
        <div className="grid gap-3 sm:grid-cols-3">
          {INQUIRY_TYPES.map((t, i) => (
            <label
              key={t.value}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-line px-4 py-3 has-[:checked]:border-accent has-[:checked]:ring-4 has-[:checked]:ring-accent/15"
            >
              <input type="radio" name="type" value={t.value} required defaultChecked={i === 0} className="accent-accent" />
              <span>{t.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="label">Name</label>
          <input id="name" name="name" autoComplete="name" className="field" />
        </div>
        <div>
          <label htmlFor="email" className="label">Email</label>
          <input id="email" name="email" type="email" required autoComplete="email" className="field" />
        </div>
        <div>
          <label htmlFor="phone" className="label">Phone <span className="text-muted">(optional)</span></label>
          <input id="phone" name="phone" type="tel" autoComplete="tel" className="field" />
        </div>
        <div>
          <label htmlFor="laptop_size" className="label">Laptop size</label>
          <select id="laptop_size" name="laptop_size" className="field" defaultValue="">
            <option value="">Not sure / no laptop</option>
            {LAPTOP_SIZES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="primary_use" className="label">Mostly used for</label>
          <select id="primary_use" name="primary_use" className="field" defaultValue="">
            <option value="">Choose one</option>
            {PRIMARY_USES.map((u) => (
              <option key={u.value} value={u.value}>{u.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="message" className="label">Your question</label>
        <textarea id="message" name="message" required rows={5} maxLength={5000} className="field resize-y" />
      </div>

      <label className="flex items-start gap-3 text-muted">
        <input type="checkbox" name="ok_to_contact" className="mt-1 h-4 w-4 accent-accent" />
        <span>Email me news and new bags. No spam, unsubscribe any time.</span>
      </label>

      {state?.error && (
        <p className="rounded-xl bg-danger/5 px-4 py-3 text-danger" role="alert">{state.error}</p>
      )}

      <button type="submit" disabled={pending} className="btn w-full sm:w-auto">
        {pending ? "Sending…" : "Send question"}
      </button>
    </form>
  );
}
