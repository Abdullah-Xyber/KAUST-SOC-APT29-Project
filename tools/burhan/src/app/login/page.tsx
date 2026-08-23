"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, ShieldCheck, Radar, FileCheck2 } from "lucide-react";
import { BurhanLogo } from "@/components/brand/BurhanLogo";
import { Button, Field, Input } from "@/components/ui/primitives";
import { useAuth, DEMO_CREDENTIALS } from "@/lib/state/AuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isReady } = useAuth();

  const [email, setEmail] = React.useState(DEMO_CREDENTIALS.email);
  const [password, setPassword] = React.useState("");
  const [remember, setRemember] = React.useState(true);
  const [showPassword, setShowPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (isReady && isAuthenticated) router.replace("/dashboard");
  }, [isReady, isAuthenticated, router]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    window.setTimeout(() => {
      const result = login(email, password, remember);
      if (!result.ok) {
        setError(result.error ?? "Sign in failed.");
        setSubmitting(false);
        return;
      }
      router.replace("/dashboard");
    }, 380);
  }

  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between brand-gradient px-12 py-10 text-white">
        <div className="absolute inset-0 circuit-field opacity-[0.18]" />
        <div className="relative flex items-center gap-3">
          <BurhanLogo monochrome size="sm" tagline={null} className="text-white" />
        </div>

        <div className="relative max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-200/80">
            Continuous SOC &amp; IR Validation
          </p>
          <h1 className="mt-4 text-4xl font-bold leading-tight">
            Definitive proof for your cyber readiness.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-white/70">
            Burhan compares adversary emulation against your SOC&apos;s detection and response
            data, and turns the result into measurable, evidence-backed validation — not another
            dashboard of assumptions.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4">
            <BrandStat icon={<Radar className="h-4 w-4" />} label="Validate" value="Emulate real attacks" />
            <BrandStat icon={<ShieldCheck className="h-4 w-4" />} label="Measure" value="Score every control" />
            <BrandStat icon={<FileCheck2 className="h-4 w-4" />} label="Respond" value="Prove the outcome" />
          </div>
        </div>

        <p className="relative text-xs text-white/50">
          © {new Date().getFullYear()} Burhan Demo Enterprise · Exhibition build
        </p>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center bg-[color:var(--page)] px-6 py-12">
        <div className="w-full max-w-sm fade-up">
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <BurhanLogo size="lg" tagline="SOC & IR VALIDATION" />
          </div>

          <div className="hidden lg:block">
            <h2 className="text-xl font-semibold text-[color:var(--ink)]">Sign in</h2>
            <p className="mt-1 text-sm text-[color:var(--ink-muted)]">
              Access your organization&apos;s validation console.
            </p>
          </div>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <Field label="Email">
              <Input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
              />
            </Field>

            <Field label="Password">
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[color:var(--ink-muted)] hover:text-[color:var(--ink)]"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-[color:var(--ink-secondary)]">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-[color:var(--border-strong)] accent-[color:var(--primary)]"
                />
                Remember me
              </label>
              <Link href="/forgot-password" className="font-medium text-[color:var(--primary)] hover:underline">
                Forgot password?
              </Link>
            </div>

            {error && (
              <p className="rounded-lg bg-[color:var(--critical-soft)] px-3 py-2 text-xs font-medium text-[color:var(--critical-ink)]">
                {error}
              </p>
            )}

            <Button type="submit" variant="primary" size="lg" className="w-full" disabled={submitting}>
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <div className="mt-6 rounded-lg border border-dashed border-[color:var(--border-strong)] bg-[color:var(--surface-sunken)] px-4 py-3 text-xs text-[color:var(--ink-secondary)]">
            <p className="font-semibold text-[color:var(--ink)]">Demo credentials</p>
            <p className="mt-1">
              Email <span className="font-mono">{DEMO_CREDENTIALS.email}</span>
            </p>
            <p>
              Password <span className="font-mono">{DEMO_CREDENTIALS.password}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function BrandStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/15 bg-white/5 px-3 py-3 backdrop-blur-sm">
      <div className="flex items-center gap-1.5 text-cyan-200/90">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wider">{label}</span>
      </div>
      <p className="mt-1.5 text-xs text-white/70">{value}</p>
    </div>
  );
}
