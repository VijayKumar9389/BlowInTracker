"use client";

import Link from "next/link";
import { useTransition } from "react";
import { logout } from "@/app/logout/actions";

export function Header() {
  const [isPending, startTransition] = useTransition();

  const handleLogout = () => {
    startTransition(async () => {
      await logout();
    });
  };

  return (
    <header className="border-b border-line">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/jobs" className="text-lg font-semibold text-ink">
          Blow-In Tracker
        </Link>
        <button
          onClick={handleLogout}
          disabled={isPending}
          className="min-h-11 px-4 text-sm text-muted hover:text-ink transition-colors"
        >
          {isPending ? "Signing out..." : "Sign out"}
        </button>
      </div>
    </header>
  );
}
