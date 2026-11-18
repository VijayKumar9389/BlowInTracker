"use client";

import { useActionState } from "react";
import { login, LoginState } from "./actions";

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(
    login,
    {}
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-semibold text-ink mb-8 text-center">
          Blow-In Tracker
        </h1>

        <form action={formAction} className="space-y-4">
          {state.error && (
            <div className="text-sm text-red-600 bg-red-50 px-4 py-3 rounded-lg">
              {state.error}
            </div>
          )}

          <div>
            <label htmlFor="username" className="block text-sm text-muted mb-1.5">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              autoComplete="username"
              className="w-full h-11 px-4 border border-line rounded-lg bg-white text-ink focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-1"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm text-muted mb-1.5"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full h-11 px-4 border border-line rounded-lg bg-white text-ink focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-1"
            />
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full h-11 bg-ink text-white rounded-full font-medium hover:bg-ink/90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {isPending ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
