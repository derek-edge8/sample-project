import type { Metadata } from "next";
import { LoginForm } from "../password-form";

export const metadata: Metadata = { title: "Admin sign in · sample-project", robots: { index: false } };

export default async function LoginPage({ searchParams }: PageProps<"/admin/login">) {
  const { error } = await searchParams;
  return (
    <main className="flex flex-1 items-center justify-center bg-panel px-4 py-16">
      <div className="w-full max-w-sm rounded-3xl bg-bg p-8 shadow-sm">
        <p className="text-sm font-medium text-muted">sample-project</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">Admin sign in</h1>
        {error === "link" && (
          <p className="mt-4 rounded-xl bg-danger/5 px-4 py-3 text-sm text-danger">
            That link has expired or was already used. Ask for a new one.
          </p>
        )}
        <div className="mt-8">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
