import { LoaderCircle } from "lucide-react";

import { KamkerLogo } from "@/components/kamker-logo";

export default function Loading() {
  return (
    <main className="min-h-screen bg-background" aria-busy="true">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-7xl items-center px-4 sm:px-6 lg:px-8">
          <KamkerLogo />
        </div>
      </header>
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <div role="status" className="flex items-center gap-2 text-sm font-semibold text-primary">
          <LoaderCircle className="size-4 motion-safe:animate-spin" aria-hidden="true" />
          Loading page...
        </div>
        <div className="mt-6 space-y-4 motion-safe:animate-pulse" aria-hidden="true">
          <div className="h-8 w-2/3 rounded-md bg-slate-200" />
          <div className="h-4 w-5/6 rounded-md bg-slate-200" />
          <div className="grid gap-4 pt-4 sm:grid-cols-2">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className="h-40 rounded-lg border bg-white" />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
