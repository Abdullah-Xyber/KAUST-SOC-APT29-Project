"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * The Burhan brand mark.
 *
 * A vector reconstruction of the Burhan shield: circuit traces forming the
 * shield wall, the Arabic wordmark برهان at its centre, and the rising
 * validation arrow breaking through the top-right edge.
 *
 * If `public/burhan-logo.png` (or .svg) is present, `BurhanLogo` uses that
 * artwork instead — drop the original file there and the whole application
 * picks it up with no code change.
 */

/** Custom artwork path. Probed once per session, then cached. */
const RASTER_SRC = "/burhan-logo.png";
let rasterAvailable: boolean | null = null;

/**
 * Renders the vector mark immediately and silently upgrades to the supplied
 * artwork if it exists. Probing rather than rendering-and-catching avoids a
 * broken-image flash on every page load when no file has been dropped in.
 */
function useCustomArtwork(): boolean {
  const [available, setAvailable] = useState(rasterAvailable === true);

  useEffect(() => {
    if (rasterAvailable !== null) {
      setAvailable(rasterAvailable);
      return;
    }
    const probe = new Image();
    probe.onload = () => {
      rasterAvailable = true;
      setAvailable(true);
    };
    probe.onerror = () => {
      rasterAvailable = false;
      setAvailable(false);
    };
    probe.src = RASTER_SRC;
  }, []);

  return available;
}

interface MarkProps {
  className?: string;
  /** Renders in a single ink colour, for dark sidebars and print. */
  monochrome?: boolean;
  title?: string;
}

export function BurhanMark({ className, monochrome = false, title = "Burhan" }: MarkProps) {
  const id = monochrome ? "burhan-mono" : "burhan-grad";

  return (
    <svg
      viewBox="0 0 120 132"
      role="img"
      aria-label={title}
      className={cn("shrink-0", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      <defs>
        <linearGradient id={`${id}-shield`} x1="8" y1="126" x2="112" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={monochrome ? "currentColor" : "#0b1f33"} />
          <stop offset="46%" stopColor={monochrome ? "currentColor" : "#12557f"} />
          <stop offset="100%" stopColor={monochrome ? "currentColor" : "#2fb2dd"} />
        </linearGradient>
        <linearGradient id={`${id}-arrow`} x1="62" y1="96" x2="114" y2="14" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={monochrome ? "currentColor" : "#1189bd"} />
          <stop offset="100%" stopColor={monochrome ? "currentColor" : "#5fd0ef"} />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <path d="M60 3 111 20v45c0 27-20 49-51 64C29 114 9 92 9 65V20L60 3Z" />
        </clipPath>
      </defs>

      {/* Shield body */}
      <path
        d="M60 3 111 20v45c0 27-20 49-51 64C29 114 9 92 9 65V20L60 3Z"
        fill={`url(#${id}-shield)`}
        opacity={monochrome ? 0.14 : 0.1}
      />
      <path
        d="M60 3 111 20v45c0 27-20 49-51 64C29 114 9 92 9 65V20L60 3Z"
        stroke={`url(#${id}-shield)`}
        strokeWidth="5"
        strokeLinejoin="round"
      />

      {/* Circuit traces — the technical texture of the mark */}
      <g clipPath={`url(#${id}-clip)`} stroke={`url(#${id}-shield)`} strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 34h16l8-8h20" opacity="0.85" />
        <path d="M18 46h10l7 7h13" opacity="0.6" />
        <path d="M102 40H86l-8-8H62" opacity="0.85" />
        <path d="M102 52H92l-7 7h-9" opacity="0.6" />
        <path d="M20 92h14l9 9h22" opacity="0.75" />
        <path d="M100 92H86l-9 9H62" opacity="0.75" />
        <path d="M28 104h10l8 8" opacity="0.5" />
        <path d="M92 104H82l-8 8" opacity="0.5" />
      </g>
      <g clipPath={`url(#${id}-clip)`} fill={monochrome ? "currentColor" : "#2fb2dd"}>
        <circle cx="34" cy="26" r="4" />
        <circle cx="86" cy="32" r="4" />
        <circle cx="43" cy="101" r="4" />
        <circle cx="77" cy="101" r="4" />
      </g>

      {/* Arabic wordmark: برهان */}
      <text
        x="58"
        y="76"
        textAnchor="middle"
        direction="rtl"
        fontSize="34"
        fontWeight={700}
        fill={monochrome ? "currentColor" : "#0e3f63"}
        style={{ fontFamily: '"Segoe UI", "Tahoma", "Arial", sans-serif' }}
      >
        برهان
      </text>

      {/* Rising validation arrow breaking the shield edge */}
      <path
        d="M64 84 82 62l11 11 22-28"
        stroke={`url(#${id}-arrow)`}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M99 43h17v17"
        stroke={`url(#${id}-arrow)`}
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface LogoProps extends MarkProps {
  /** Show the BURHAN wordmark and tagline beside the shield. */
  showWordmark?: boolean;
  /** Tagline under the wordmark; pass null to hide it. */
  tagline?: string | null;
  size?: "sm" | "md" | "lg";
}

const SIZES = {
  sm: { mark: "h-8 w-8", word: "text-base", tag: "text-[9px] tracking-[0.16em]" },
  md: { mark: "h-11 w-11", word: "text-xl", tag: "text-[10px] tracking-[0.18em]" },
  lg: { mark: "h-20 w-20", word: "text-3xl", tag: "text-[11px] tracking-[0.2em]" },
} as const;

export function BurhanLogo({
  className,
  monochrome = false,
  showWordmark = true,
  tagline = "SOC & IR VALIDATION",
  size = "md",
}: LogoProps) {
  const useRaster = useCustomArtwork();
  const s = SIZES[size];

  return (
    <span className={cn("flex items-center gap-3", className)}>
      {useRaster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={RASTER_SRC} alt="Burhan" className={cn(s.mark, "object-contain")} />
      ) : (
        <BurhanMark className={s.mark} monochrome={monochrome} />
      )}

      {showWordmark && (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              s.word,
              "font-bold tracking-[0.06em]",
              monochrome ? "text-current" : "text-[color:var(--ink)]",
            )}
          >
            BURHAN
          </span>
          {tagline && (
            <span
              className={cn(
                s.tag,
                "mt-1 font-medium uppercase",
                monochrome ? "text-current opacity-70" : "text-[color:var(--ink-muted)]",
              )}
            >
              {tagline}
            </span>
          )}
        </span>
      )}
    </span>
  );
}
