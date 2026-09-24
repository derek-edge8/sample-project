"use server";

import { parseInquiry, submitInquiry } from "@/lib/leads";

export type InquiryState = { ok: boolean; error?: string } | null;

export async function submitInquiryAction(_prev: InquiryState, formData: FormData): Promise<InquiryState> {
  // Honeypot: real visitors never see or fill this field.
  if (formData.get("company_website")) return { ok: true };

  const parsed = parseInquiry(formData);
  if ("error" in parsed) return { ok: false, error: parsed.error };

  try {
    await submitInquiry(parsed.data);
  } catch (err) {
    console.error(err);
    return { ok: false, error: "Something went wrong sending your question. Please try again." };
  }
  return { ok: true };
}
