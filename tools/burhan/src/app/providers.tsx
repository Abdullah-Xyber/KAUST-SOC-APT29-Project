"use client";

import { AuthProvider } from "@/lib/state/AuthProvider";
import { DataProvider } from "@/lib/state/DataProvider";
import { ThemeProvider } from "@/lib/state/ThemeProvider";
import { EvidenceDrawerProvider } from "@/components/evidence/EvidenceDrawer";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <EvidenceDrawerProvider>{children}</EvidenceDrawerProvider>
        </DataProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
