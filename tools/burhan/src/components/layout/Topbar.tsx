"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings as SettingsIcon,
  Sun,
  Building2,
} from "lucide-react";
import { BurhanMark } from "@/components/brand/BurhanLogo";
import { NAV_ITEMS } from "@/components/layout/nav";
import { Badge } from "@/components/ui/primitives";
import { formatRelative } from "@/lib/utils";
import { useAuth } from "@/lib/state/AuthProvider";
import { useTheme } from "@/lib/state/ThemeProvider";
import { useBurhan } from "@/lib/state/DataProvider";

function useBreadcrumb() {
  const pathname = usePathname();
  const item = NAV_ITEMS.find((n) => pathname === n.href || pathname?.startsWith(n.href + "/"));
  const segments = (pathname ?? "").split("/").filter(Boolean);
  const detail = segments.length > 1 ? segments[segments.length - 1] : null;
  return { section: item?.label ?? "Burhan", detail };
}

export function Topbar() {
  const { section, detail } = useBreadcrumb();
  const { logout } = useAuth();
  const { theme, toggle } = useTheme();
  const { dataset, analysis } = useBurhan();
  const router = useRouter();

  const [userMenuOpen, setUserMenuOpen] = React.useState(false);
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [mobileNavOpen, setMobileNavOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const criticalFindings = analysis.results.filter((r) => r.outcome === "missed").slice(0, 6);

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim().toUpperCase();
    if (!q) return;
    if (dataset.runs.some((r) => r.id.toUpperCase() === q)) {
      router.push(`/runs/${q}`);
    } else if (/^T\d{4}(\.\d{3})?$/.test(q)) {
      router.push(`/mitre-coverage?technique=${q}`);
    } else {
      router.push(`/runs?q=${encodeURIComponent(query.trim())}`);
    }
    setQuery("");
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-4 border-b border-[color:var(--border)] bg-[color:var(--surface)]/90 px-4 backdrop-blur lg:px-6">
      <button
        className="text-[color:var(--ink-muted)] lg:hidden"
        onClick={() => setMobileNavOpen(true)}
        aria-label="Open navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="hidden min-w-0 flex-col lg:flex">
        <div className="flex items-center gap-1.5 text-[11px] text-[color:var(--ink-muted)]">
          <span>Burhan Demo Enterprise</span>
          <span>/</span>
          <span className="font-medium text-[color:var(--ink-secondary)]">{section}</span>
        </div>
        <h1 className="truncate text-sm font-semibold text-[color:var(--ink)]">
          {detail && detail !== section.toLowerCase().replace(/\s+/g, "-") ? detail.toUpperCase() : section}
        </h1>
      </div>

      <form onSubmit={onSearch} className="ml-auto flex max-w-xs flex-1 lg:ml-4">
        <div className="relative w-full">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[color:var(--ink-muted)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search run ID or technique (T1059.001)…"
            className="h-9 w-full rounded-lg border border-[color:var(--border-strong)] bg-[color:var(--surface-sunken)] pl-8 pr-3 text-xs text-[color:var(--ink)] placeholder:text-[color:var(--ink-muted)] focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/20"
          />
        </div>
      </form>

      <div className="hidden items-center gap-1.5 rounded-lg border border-[color:var(--border)] px-2.5 py-1.5 text-xs text-[color:var(--ink-secondary)] md:flex">
        <Building2 className="h-3.5 w-3.5 text-[color:var(--ink-muted)]" />
        {dataset.organization.name}
        <ChevronDown className="h-3 w-3 text-[color:var(--ink-muted)]" />
      </div>

      <button
        onClick={toggle}
        aria-label="Toggle theme"
        className="rounded-lg p-2 text-[color:var(--ink-muted)] hover:bg-[color:var(--surface-sunken)] hover:text-[color:var(--ink)]"
      >
        {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
      </button>

      <div className="relative">
        <button
          onClick={() => setNotifOpen((v) => !v)}
          aria-label="Notifications"
          className="relative rounded-lg p-2 text-[color:var(--ink-muted)] hover:bg-[color:var(--surface-sunken)] hover:text-[color:var(--ink)]"
        >
          <Bell className="h-4 w-4" />
          {criticalFindings.length > 0 && (
            <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-[color:var(--critical)] text-[9px] font-bold text-white">
              {criticalFindings.length}
            </span>
          )}
        </button>
        {notifOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
            <div className="absolute right-0 z-50 mt-2 w-80 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-[var(--shadow-pop)]">
              <div className="border-b border-[color:var(--border)] px-4 py-3">
                <p className="text-sm font-semibold text-[color:var(--ink)]">Critical findings</p>
                <p className="text-[11px] text-[color:var(--ink-muted)]">Missed detections across all validation runs</p>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {criticalFindings.length === 0 ? (
                  <p className="px-4 py-6 text-center text-xs text-[color:var(--ink-muted)]">
                    No missed detections right now.
                  </p>
                ) : (
                  criticalFindings.map((f) => (
                    <Link
                      key={f.id}
                      href={`/runs/${f.runId}`}
                      onClick={() => setNotifOpen(false)}
                      className="block border-b border-[color:var(--border)] px-4 py-3 last:border-b-0 hover:bg-[color:var(--surface-sunken)]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] font-semibold text-[color:var(--critical-ink)]">
                          {f.techniqueId}
                        </span>
                        <Badge tone="critical">missed</Badge>
                      </div>
                      <p className="mt-1 text-xs text-[color:var(--ink)]">{f.techniqueName}</p>
                      <p className="mt-0.5 text-[11px] text-[color:var(--ink-muted)]">
                        {f.hostname} · {formatRelative(f.executedAt, Date.now())}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="relative">
        <button
          onClick={() => setUserMenuOpen((v) => !v)}
          className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 hover:bg-[color:var(--surface-sunken)]"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--accent)] text-xs font-bold text-white">
            {dataset.user.initials}
          </span>
          <span className="hidden text-left leading-tight md:block">
            <span className="block text-xs font-semibold text-[color:var(--ink)]">{dataset.user.name}</span>
            <span className="block text-[10px] text-[color:var(--ink-muted)]">{dataset.user.title}</span>
          </span>
          <ChevronDown className="hidden h-3.5 w-3.5 text-[color:var(--ink-muted)] md:block" />
        </button>
        {userMenuOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
            <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-1.5 shadow-[var(--shadow-pop)]">
              <div className="px-3 py-2">
                <p className="text-xs font-semibold text-[color:var(--ink)]">{dataset.user.name}</p>
                <p className="text-[11px] text-[color:var(--ink-muted)]">{dataset.user.email}</p>
              </div>
              <div className="my-1 h-px bg-[color:var(--border)]" />
              <Link
                href="/settings"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-[color:var(--ink-secondary)] hover:bg-[color:var(--surface-sunken)]"
              >
                <SettingsIcon className="h-3.5 w-3.5" /> Settings
              </Link>
              <button
                onClick={() => {
                  setUserMenuOpen(false);
                  logout();
                  router.replace("/login");
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-[color:var(--critical-ink)] hover:bg-[color:var(--critical-soft)]"
              >
                <LogOut className="h-3.5 w-3.5" /> Sign out
              </button>
            </div>
          </>
        )}
      </div>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-[100] flex lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileNavOpen(false)} />
          <div className="relative z-10 flex h-full w-72 flex-col bg-[color:var(--surface-inverse)]">
            <div className="flex items-center gap-2.5 px-5 py-5">
              <BurhanMark className="h-8 w-8" />
              <p className="text-sm font-bold tracking-wide text-white">BURHAN</p>
            </div>
            <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileNavOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white"
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
