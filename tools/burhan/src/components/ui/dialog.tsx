"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Minimal, dependency-free modal/drawer primitives. Two shapes:
 *  - Dialog: centred panel, for confirmations and configuration.
 *  - Drawer: right-edge panel, used for the Evidence Drawer (§17).
 */

function useEscapeAndLock(open: boolean, onClose: () => void) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);
}

function usePortalRoot() {
  const [root, setRoot] = React.useState<HTMLElement | null>(null);
  React.useEffect(() => setRoot(document.body), []);
  return root;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  useEscapeAndLock(open, onClose);
  const root = usePortalRoot();
  if (!open || !root) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-[2px] fade-up"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative z-10 w-full max-w-lg rounded-xl border border-[color:var(--border)] bg-[color:var(--surface)] shadow-[var(--shadow-pop)] fade-up",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[color:var(--border)] px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-[color:var(--ink)]">{title}</h2>
            {description && (
              <p className="mt-1 text-xs text-[color:var(--ink-muted)]">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-[color:var(--ink-muted)] hover:bg-[color:var(--surface-sunken)] hover:text-[color:var(--ink)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="max-h-[70vh] overflow-y-auto px-5 py-4">{children}</div>
        {footer && (
          <div className="flex items-center justify-end gap-2 border-t border-[color:var(--border)] px-5 py-3">
            {footer}
          </div>
        )}
      </div>
    </div>,
    root,
  );
}

export function Drawer({
  open,
  onClose,
  title,
  eyebrow,
  children,
  width = "max-w-xl",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  eyebrow?: string;
  children: React.ReactNode;
  width?: string;
}) {
  useEscapeAndLock(open, onClose);
  const root = usePortalRoot();
  if (!open || !root) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-end">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[1px]" onClick={onClose} aria-hidden />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "relative z-10 flex h-full w-full flex-col border-l border-[color:var(--border)] bg-[color:var(--surface)] shadow-[var(--shadow-pop)]",
          width,
        )}
        style={{ animation: "burhan-fade-up 0.22s ease-out" }}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[color:var(--border)] px-6 py-4">
          <div>
            {eyebrow && (
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--primary)]">
                {eyebrow}
              </p>
            )}
            <h2 className="mt-0.5 text-base font-semibold text-[color:var(--ink)]">{title}</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-[color:var(--ink-muted)] hover:bg-[color:var(--surface-sunken)] hover:text-[color:var(--ink)]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>,
    root,
  );
}
