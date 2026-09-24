"use client";

import { useActionState } from "react";
import { setPasswordAction, signInAction, type FormState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(signInAction, null);
  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input id="email" name="email" type="email" required autoComplete="username" className="field" />
      </div>
      <div>
        <label htmlFor="password" className="label">Password</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className="field" />
      </div>
      {state?.error && <p className="text-danger" role="alert">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn w-full">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

export function SetPasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(setPasswordAction, null);
  return (
    <form action={action} className="space-y-5">
      <div>
        <label htmlFor="password" className="label">New password</label>
        <input id="password" name="password" type="password" required minLength={10} autoComplete="new-password" className="field" />
      </div>
      <div>
        <label htmlFor="confirm" className="label">Confirm password</label>
        <input id="confirm" name="confirm" type="password" required minLength={10} autoComplete="new-password" className="field" />
      </div>
      {state?.error && <p className="text-danger" role="alert">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn w-full">
        {pending ? "Saving…" : "Save password"}
      </button>
    </form>
  );
}
