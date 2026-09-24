"use server";

import { redirect } from "next/navigation";
import { isAdminEmail, requireAdmin } from "@/lib/auth";
import { createAuthClient } from "@/lib/supabase/server";

export type FormState = { error?: string } | null;

export async function signInAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password." };

  const supabase = await createAuthClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !isAdminEmail(email)) {
    await supabase.auth.signOut();
    return { error: "That email and password don't match an admin account." };
  }
  redirect("/admin");
}

export async function setPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 10) return { error: "Use at least 10 characters." };
  if (password !== confirm) return { error: "The two passwords don't match." };

  const supabase = await createAuthClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: error.message };
  redirect("/admin");
}

export async function signOutAction() {
  const supabase = await createAuthClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
