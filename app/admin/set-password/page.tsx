import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { SetPasswordForm } from "../password-form";

export const metadata: Metadata = { title: "Set password · sample-project", robots: { index: false } };

export default async function SetPasswordPage() {
  const admin = await requireAdmin();
  return (
    <main className="flex flex-1 items-center justify-center bg-panel px-4 py-16">
      <div className="w-full max-w-sm rounded-3xl bg-bg p-8 shadow-sm">
        <p className="text-sm font-medium text-muted">{admin.email}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Choose your password</h1>
        <p className="mt-2 text-muted">At least 10 characters. You&apos;ll use it to sign in to /admin.</p>
        <div className="mt-8">
          <SetPasswordForm />
        </div>
      </div>
    </main>
  );
}
