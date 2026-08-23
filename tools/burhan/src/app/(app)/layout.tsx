"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { useRequireAuth } from "@/lib/state/AuthProvider";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isReady } = useRequireAuth();

  if (!isReady || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[color:var(--page)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[color:var(--border-strong)] border-t-[color:var(--primary)]" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[color:var(--page)]">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="min-w-0 flex-1 px-4 py-6 lg:px-8">
          <div className="mx-auto max-w-[1400px]">{children}</div>
        </main>
      </div>
    </div>
  );
}
