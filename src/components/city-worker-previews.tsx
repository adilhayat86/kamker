import Link from "next/link";

import { Button } from "@/components/ui/button";
import { getSeoWorkerPreviews } from "@/lib/seo-worker-previews";
import { buildProfileSlug } from "@/lib/slug";
import { workerAvailabilityLabel } from "@/lib/worker-availability";

export async function CityWorkerPreviews({ city, category, directoryHref }: { city: string; category?: string; directoryHref: string }) {
  const workers = await getSeoWorkerPreviews(city, category ?? null);
  return (
    <section aria-labelledby="city-workers-heading" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h2 id="city-workers-heading" className="text-2xl font-bold">{category ? `${category} profiles` : "Worker profiles"} in {city}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">Review the details workers share, then confirm their services and current availability directly.</p>
      {workers.length ? (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {workers.map((worker) => (
            <article key={worker.id} className="rounded-xl border bg-white p-5 shadow-sm">
              <h3 className="text-lg font-semibold"><Link href={`/professionals/${buildProfileSlug(worker.full_name, worker.id)}`} className="text-primary underline underline-offset-4">{worker.full_name} — {worker.categories?.name ?? "Worker"} in {worker.cities?.name ?? city}</Link></h3>
              <p className="mt-3 text-sm text-muted-foreground">{[worker.area, worker.cities?.name ?? city].filter(Boolean).join(", ")}</p>
              {worker.availability ? <p className="mt-2 text-sm text-muted-foreground">Availability: {workerAvailabilityLabel(worker.availability)}</p> : null}
              {worker.short_bio?.trim() ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{worker.short_bio}</p> : null}
            </article>
          ))}
        </div>
      ) : <p className="mt-5 rounded-xl border bg-white p-5 text-sm leading-6 text-muted-foreground">No matching worker profiles are shown here right now. You can check the worker directory again later or browse other categories. If you offer this service in {city}, you can create a free profile above.</p>}
      <Button asChild variant="outline" className="mt-5 h-11"><Link href={directoryHref}>Browse {category ?? "workers"} in {city}</Link></Button>
    </section>
  );
}
