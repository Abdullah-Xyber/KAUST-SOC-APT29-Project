"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, MailCheck } from "lucide-react";
import { BurhanLogo } from "@/components/brand/BurhanLogo";
import { Button, Field, Input } from "@/components/ui/primitives";

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [sent, setSent] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      setSent(true);
    }, 500);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[color:var(--page)] px-6 py-12">
      <div className="w-full max-w-sm fade-up">
        <div className="mb-8 flex flex-col items-center text-center">
          <BurhanLogo size="lg" tagline="SOC & IR VALIDATION" />
        </div>

        <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] p-6 shadow-[var(--shadow-card)]">
          {sent ? (
            <div className="text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[color:var(--good-soft)] text-[color:var(--good-ink)]">
                <MailCheck className="h-5 w-5" />
              </div>
              <h2 className="mt-3 text-sm font-semibold text-[color:var(--ink)]">Check your inbox</h2>
              <p className="mt-1 text-xs leading-relaxed text-[color:var(--ink-muted)]">
                If an account exists for <span className="font-medium text-[color:var(--ink)]">{email}</span>,
                a password reset link has been sent. In this exhibition build, no email is actually
                dispatched — sign back in with the demo credentials.
              </p>
              <Link href="/login" className="mt-5 inline-flex">
                <Button variant="primary">Back to sign in</Button>
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-base font-semibold text-[color:var(--ink)]">Reset your password</h2>
              <p className="mt-1 text-xs text-[color:var(--ink-muted)]">
                Enter the email associated with your Burhan account and we&apos;ll send a reset link.
              </p>
              <form onSubmit={onSubmit} className="mt-5 space-y-4">
                <Field label="Email">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@company.com"
                    required
                  />
                </Field>
                <Button type="submit" variant="primary" className="w-full" disabled={submitting}>
                  {submitting ? "Sending…" : "Send reset link"}
                </Button>
              </form>
            </>
          )}
        </div>

        <Link
          href="/login"
          className="mt-5 flex items-center justify-center gap-1.5 text-xs font-medium text-[color:var(--ink-muted)] hover:text-[color:var(--ink)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
