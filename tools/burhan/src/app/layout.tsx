import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Burhan — Continuous SOC & IR Validation",
  description:
    "Burhan validates whether your SOC and incident response team actually detect and respond to real attacks, and proves it with evidence.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b1f33",
};

/**
 * Applies the persisted theme before paint to avoid a light/dark flash —
 * this has to be an inline script because it must run ahead of hydration.
 */
const THEME_INIT = `
(function () {
  try {
    var t = localStorage.getItem('burhan.theme');
    if (t === 'dark' || t === 'light') {
      document.documentElement.setAttribute('data-theme', t);
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
