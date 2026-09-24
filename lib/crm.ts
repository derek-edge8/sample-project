// Shared CRM vocabulary. Must stay in sync with the check constraints in
// supabase/migrations/20260924000001_crm_schema.sql.

export const INQUIRY_TYPES = [
  { value: "sizing", label: "Sizing", subject: "Sizing question" },
  { value: "materials", label: "Materials", subject: "Materials question" },
  { value: "laptop_fit", label: "Will it fit my laptop?", subject: "Laptop fit question" },
] as const;

export const LAPTOP_SIZES = ['13"', '14"', '15"', '16"+'] as const;

export const PRIMARY_USES = [
  { value: "commute", label: "Commute" },
  { value: "travel", label: "Travel" },
  { value: "hiking", label: "Hiking" },
  { value: "school", label: "School" },
] as const;

export const SOURCES = ["website_form", "email", "phone"] as const;

export type InquiryType = (typeof INQUIRY_TYPES)[number]["value"];
export type LaptopSize = (typeof LAPTOP_SIZES)[number];
export type PrimaryUse = (typeof PRIMARY_USES)[number]["value"];
export type Source = (typeof SOURCES)[number];

export function inquiryTypeLabel(value: string) {
  return INQUIRY_TYPES.find((t) => t.value === value)?.label ?? value;
}

export function toSource(value: unknown): Source {
  return SOURCES.includes(value as Source) ? (value as Source) : "website_form";
}
