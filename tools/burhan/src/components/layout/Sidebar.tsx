"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Settings as SettingsIcon } from "lucide-react";
import { BurhanMark } from "@/components/brand/BurhanLogo";
import { NAV_ITEMS } from "@/components/layout/nav";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/state/AuthProvider";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const settingsActive = pathname === "/settings" || pathname?.startsWith("/settings/");

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-white/10 bg-[color:var(--surface-inverse)] lg:flex">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <BurhanMark className="h-8 w-8" />
        <div className="leading-none">
          <p className="text-sm font-bold tracking-wide text-white">BURHAN</p>
          <p className="mt-1 text-[9px] font-medium uppercase tracking-[0.16em] text-cyan-200/60">
            SOC &amp; IR Validation
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-2">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-white/10 text-white"
                  : "text-white/55 hover:bg-white/5 hover:text-white/90",
              )}
            >
              <Icon className={cn("h-4 w-4 shrink-0", active ? "text-cyan-300" : "text-white/40 group-hover:text-white/70")} />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-0.5 border-t border-white/10 px-3 py-3">
        <Link
          href="/settings"
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            settingsActive ? "bg-white/10 text-white" : "text-white/55 hover:bg-white/5 hover:text-white/90",
          )}
        >
          <SettingsIcon className={cn("h-4 w-4 shrink-0", settingsActive ? "text-cyan-300" : "text-white/40")} />
          Settings
        </Link>
        <button
          onClick={() => {
            logout();
            router.replace("/login");
          }}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-white/55 transition-colors hover:bg-white/5 hover:text-white/90"
        >
          <LogOut className="h-4 w-4 shrink-0 text-white/40" />
          Logout
        </button>
      </div>
    </aside>
  );
}
