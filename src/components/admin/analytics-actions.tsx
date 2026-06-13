"use client";

import { Printer } from "lucide-react";

export function AnalyticsPrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center justify-center gap-2 rounded-lg border border-cyan-300/40 bg-cyan-300/10 px-4 py-2 text-sm font-semibold text-cyan-100 shadow-[0_0_24px_rgba(34,211,238,0.16)] transition hover:bg-cyan-300/20"
    >
      <Printer className="size-4" aria-hidden="true" />
      Print Report
    </button>
  );
}
