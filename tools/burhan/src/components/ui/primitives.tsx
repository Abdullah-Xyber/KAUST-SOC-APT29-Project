"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ Card -- */

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)]",
        "shadow-[var(--shadow-card)]",
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({
  className,
  title,
  description,
  action,
  icon,
  ...props
}: Omit<React.HTMLAttributes<HTMLDivElement>, "title"> & {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex items-start justify-between gap-4 border-b border-[color:var(--border)] px-5 py-4",
        className,
      )}
      {...props}
    >
      <div className="flex min-w-0 items-start gap-2.5">
        {icon && (
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[color:var(--surface-sunken)] text-[color:var(--ink-secondary)]">
            {icon}
          </span>
        )}
        <div className="min-w-0">
          {title && <h3 className="text-sm font-semibold text-[color:var(--ink)]">{title}</h3>}
          {description && (
            <p className="mt-1 text-xs leading-relaxed text-[color:var(--ink-muted)]">{description}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-5", className)} {...props} />;
}

/* ---------------------------------------------------------------- Button -- */

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-colors " +
    "disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap",
  {
    variants: {
      variant: {
        primary:
          "bg-[color:var(--primary)] text-[color:var(--primary-ink)] hover:brightness-110 active:brightness-95",
        secondary:
          "border border-[color:var(--border-strong)] bg-[color:var(--surface)] text-[color:var(--ink)] hover:bg-[color:var(--surface-sunken)]",
        ghost: "text-[color:var(--ink-secondary)] hover:bg-[color:var(--surface-sunken)] hover:text-[color:var(--ink)]",
        danger: "bg-[color:var(--critical)] text-white hover:brightness-110",
        navy: "bg-[color:var(--accent)] text-white hover:brightness-125",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-4",
        lg: "h-11 px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = "button", ...props }, ref) => (
    <button ref={ref} type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = "Button";

/* ----------------------------------------------------------------- Badge -- */

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[11px] font-semibold leading-5",
  {
    variants: {
      tone: {
        neutral: "bg-[color:var(--surface-sunken)] text-[color:var(--ink-secondary)]",
        brand: "bg-[color:var(--primary-soft)] text-[color:var(--primary)]",
        good: "bg-[color:var(--good-soft)] text-[color:var(--good-ink)]",
        warning: "bg-[color:var(--warning-soft)] text-[color:var(--warning-ink)]",
        serious: "bg-[color:var(--serious-soft)] text-[color:var(--serious-ink)]",
        critical: "bg-[color:var(--critical-soft)] text-[color:var(--critical-ink)]",
        outline: "border border-[color:var(--border-strong)] text-[color:var(--ink-secondary)]",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}

/* ------------------------------------------------------------ form parts -- */

export function Label({ className, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return (
    <label
      className={cn("block text-xs font-medium text-[color:var(--ink-secondary)]", className)}
      {...props}
    />
  );
}

const fieldClass =
  "w-full rounded-lg border border-[color:var(--border-strong)] bg-[color:var(--surface)] px-3 py-2 " +
  "text-sm text-[color:var(--ink)] placeholder:text-[color:var(--ink-muted)] " +
  "focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/25 " +
  "disabled:opacity-60";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn(fieldClass, "h-9", className)} {...props} />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(fieldClass, "font-mono text-xs leading-relaxed", className)} {...props} />
));
Textarea.displayName = "Textarea";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select ref={ref} className={cn(fieldClass, "h-9 pr-8", className)} {...props}>
    {children}
  </select>
));
Select.displayName = "Select";

export function Field({
  label,
  hint,
  error,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label>{label}</Label>
      {children}
      {error ? (
        <p className="text-xs font-medium text-[color:var(--critical-ink)]">{error}</p>
      ) : hint ? (
        <p className="text-xs text-[color:var(--ink-muted)]">{hint}</p>
      ) : null}
    </div>
  );
}

export function Switch({
  checked,
  onChange,
  label,
  id,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  id?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
        checked ? "bg-[color:var(--primary)]" : "bg-[color:var(--border-strong)]",
      )}
    >
      <span
        className={cn(
          "inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform",
          checked ? "translate-x-[19px]" : "translate-x-[3px]",
        )}
      />
    </button>
  );
}

/* -------------------------------------------------------------- Progress -- */

export function Progress({
  value,
  className,
  tone = "brand",
}: {
  value: number;
  className?: string;
  tone?: "brand" | "good" | "warning" | "critical";
}) {
  const color =
    tone === "good"
      ? "var(--good)"
      : tone === "warning"
        ? "var(--warning)"
        : tone === "critical"
          ? "var(--critical)"
          : "var(--primary)";
  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--surface-sunken)]", className)}
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full transition-[width] duration-500"
        style={{ width: `${Math.max(0, Math.min(100, value))}%`, background: color }}
      />
    </div>
  );
}

/* ----------------------------------------------------------- state views -- */

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-14 text-center", className)}>
      {icon && (
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-[color:var(--surface-sunken)] text-[color:var(--ink-muted)]">
          {icon}
        </div>
      )}
      <p className="text-sm font-semibold text-[color:var(--ink)]">{title}</p>
      {description && (
        <p className="mt-1 max-w-sm text-xs leading-relaxed text-[color:var(--ink-muted)]">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-[color:var(--surface-sunken)] sweep",
        className,
      )}
    />
  );
}

export function ErrorState({ title, description, onRetry }: { title: string; description?: string; onRetry?: () => void }) {
  return (
    <div className="rounded-lg border border-[color:var(--critical)]/30 bg-[color:var(--critical-soft)] p-4">
      <p className="text-sm font-semibold text-[color:var(--critical-ink)]">{title}</p>
      {description && <p className="mt-1 text-xs text-[color:var(--critical-ink)]/85">{description}</p>}
      {onRetry && (
        <Button size="sm" variant="secondary" className="mt-3" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

/* --------------------------------------------------------------- Tooltip -- */

/**
 * Lightweight hover/focus tooltip. Used throughout to explain security metrics
 * (MTTD, MTTC, technique coverage) without cluttering the surface.
 */
export function Tooltip({
  content,
  children,
  side = "top",
  className,
}: {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: "top" | "bottom";
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);
  return (
    <span
      className={cn("relative inline-flex", className)}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      {children}
      {open && (
        <span
          role="tooltip"
          className={cn(
            "pointer-events-none absolute left-1/2 z-50 w-56 -translate-x-1/2 rounded-lg px-3 py-2",
            "bg-[color:var(--surface-inverse)] text-[11px] leading-relaxed text-white shadow-[var(--shadow-pop)]",
            side === "top" ? "bottom-full mb-2" : "top-full mt-2",
          )}
        >
          {content}
        </span>
      )}
    </span>
  );
}

export function InfoHint({ children }: { children: React.ReactNode }) {
  return (
    <Tooltip content={children}>
      <span
        tabIndex={0}
        aria-label="More information"
        className="ml-1 inline-flex h-3.5 w-3.5 cursor-help items-center justify-center rounded-full border border-[color:var(--border-strong)] text-[9px] font-bold text-[color:var(--ink-muted)]"
      >
        i
      </span>
    </Tooltip>
  );
}
