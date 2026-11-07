import Link from "next/link";

import { Button } from "@/components/ui/button";

export function DirectoryEmptyState({ category, city }: { category?: string; city?: string }) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  const categoryHref = params.size ? `/professionals?${params}` : "/professionals";
  return (
    <section className="mt-6 rounded-lg border border-dashed bg-white p-5 shadow-sm sm:p-6">
      <h2 className="text-lg font-semibold text-foreground">
        No matching {category || "worker"} profiles{city ? ` in ${city}` : ""} yet
      </h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">
        Try a broader search or view other services. Availability varies by worker and location.
      </p>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        {city && category ? (
          <Button asChild variant="outline" className="h-11">
            <Link href={categoryHref}>View {category} in all cities</Link>
          </Button>
        ) : null}
        <Button asChild variant="outline" className="h-11">
          <Link href="/categories">Browse service categories</Link>
        </Button>
        <Button asChild className="h-11">
          <Link href="/professionals">View all workers</Link>
        </Button>
      </div>
    </section>
  );
}
