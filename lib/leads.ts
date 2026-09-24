import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  INQUIRY_TYPES,
  LAPTOP_SIZES,
  PRIMARY_USES,
  toSource,
  type InquiryType,
  type LaptopSize,
  type PrimaryUse,
  type Source,
} from "@/lib/crm";

const SOURCE_SITE = "sample-project.vercel.app";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type Inquiry = {
  email: string;
  name: string | null;
  phone: string | null;
  okToContact: boolean;
  type: InquiryType;
  laptopSize: LaptopSize | null;
  primaryUse: PrimaryUse | null;
  message: string;
  source: Source;
};

function text(formData: FormData, key: string, max: number) {
  const value = String(formData.get(key) ?? "").trim();
  return value ? value.slice(0, max) : null;
}

export function parseInquiry(formData: FormData): { data: Inquiry } | { error: string } {
  const email = text(formData, "email", 254)?.toLowerCase();
  if (!email || !EMAIL_RE.test(email)) return { error: "Please enter a valid email address." };

  const type = formData.get("type");
  if (!INQUIRY_TYPES.some((t) => t.value === type)) return { error: "Please choose what your question is about." };

  const message = text(formData, "message", 5000);
  if (!message) return { error: "Please write your question." };

  const laptopSize = formData.get("laptop_size");
  const primaryUse = formData.get("primary_use");

  return {
    data: {
      email,
      name: text(formData, "name", 200),
      phone: text(formData, "phone", 50),
      okToContact: formData.get("ok_to_contact") === "on",
      type: type as InquiryType,
      laptopSize: LAPTOP_SIZES.includes(laptopSize as LaptopSize) ? (laptopSize as LaptopSize) : null,
      primaryUse: PRIMARY_USES.some((u) => u.value === primaryUse) ? (primaryUse as PrimaryUse) : null,
      message,
      source: toSource(formData.get("source")),
    },
  };
}

// Upserts the person by email and creates a new_lead contact, atomically.
export async function submitInquiry(inquiry: Inquiry) {
  const attributes: Record<string, string> = {};
  if (inquiry.laptopSize) attributes.laptop_size = inquiry.laptopSize;
  if (inquiry.primaryUse) attributes.primary_use = inquiry.primaryUse;

  const { error } = await createAdminClient().rpc("submit_inquiry", {
    p_email: inquiry.email,
    p_name: inquiry.name,
    p_phone: inquiry.phone,
    p_ok_to_contact: inquiry.okToContact,
    p_attributes: attributes,
    p_type: inquiry.type,
    p_subject: INQUIRY_TYPES.find((t) => t.value === inquiry.type)!.subject,
    p_message: inquiry.message,
    p_source: inquiry.source,
    p_source_site: SOURCE_SITE,
  });
  if (error) throw new Error(`submit_inquiry failed: ${error.message}`);
}

export type Lead = {
  id: string;
  type: string;
  subject: string | null;
  message: string | null;
  source: string | null;
  status: string;
  created_at: string;
  person: {
    email: string;
    name: string | null;
    phone: string | null;
    attributes: { laptop_size?: string; primary_use?: string };
  };
};

export async function listLeads(limit = 200) {
  const { data, error } = await createAdminClient()
    .from("contacts")
    .select("id, type, subject, message, source, status, created_at, person:people!inner(email, name, phone, attributes)")
    .order("created_at", { ascending: false })
    .limit(limit)
    .overrideTypes<Lead[], { merge: false }>();
  if (error) throw new Error(`listLeads failed: ${error.message}`);
  return data;
}
