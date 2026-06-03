import { MapPin, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cities } from "@/lib/marketplace-data";

export function SearchPanel() {
  return (
    <Card className="border-0 bg-white/95 shadow-md">
      <CardContent className="p-2 sm:p-3">
        <form
          action="/professionals"
          className="grid gap-2 sm:grid-cols-[1fr_0.75fr_auto] sm:gap-3"
        >
          <label className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground sm:top-3.5"
              aria-hidden="true"
            />
            <span className="sr-only">Service</span>
            <Input
              placeholder="Search nurses, maids, drivers, tutors..."
              className="h-10 pl-9 sm:h-11"
              name="q"
            />
          </label>
          <label className="relative">
            <MapPin
              className="pointer-events-none absolute left-3 top-3 size-4 text-muted-foreground sm:top-3.5"
              aria-hidden="true"
            />
            <span className="sr-only">Location</span>
            <select
              className="flex h-10 w-full appearance-none rounded-md border border-input bg-background px-9 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:h-11"
              name="city"
              defaultValue=""
            >
              <option value="">All locations</option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" className="h-10 sm:h-11">
            Search
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
