"use client";

import { useState } from "react";
import { ChevronDown, MapPin, Search, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { categories, cities } from "@/lib/marketplace-data";
import {
  workerDayAvailabilityOptions,
  workerTimeAvailabilityOptions,
} from "@/lib/worker-availability";

export function SearchPanel() {
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  return (
    <Card className="border border-sky-100 bg-white shadow-md">
      <CardContent className="p-2 sm:p-3">
        <form
          action="/professionals"
          className="grid gap-2 sm:grid-cols-[1fr_0.75fr_auto] sm:gap-3"
        >
          <label className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-3 size-4 text-primary sm:top-3.5"
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
              className="pointer-events-none absolute left-3 top-3 size-4 text-primary sm:top-3.5"
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
          <div className="grid gap-1.5">
            <button
              type="button"
              aria-expanded={isAdvancedOpen}
              onClick={() => setIsAdvancedOpen((current) => !current)}
              className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-primary underline-offset-4 hover:underline sm:justify-end"
            >
              <SlidersHorizontal className="size-3.5" aria-hidden="true" />
              {isAdvancedOpen ? "Hide advanced" : "Advanced search"}
              <ChevronDown
                className={`size-3.5 transition-transform duration-300 ${
                  isAdvancedOpen ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>
            <Button type="submit" className="h-10 sm:h-11">
              Search
            </Button>
          </div>

          <div
            aria-hidden={!isAdvancedOpen}
            className={`grid overflow-hidden transition-all duration-300 ease-out sm:col-span-3 ${
              isAdvancedOpen
                ? "visible max-h-[32rem] opacity-100"
                : "invisible max-h-0 opacity-0 pointer-events-none"
            }`}
          >
            <div className="mt-2 grid gap-2 rounded-lg border border-sky-100 bg-sky-50/50 p-3 sm:grid-cols-4 sm:gap-3">
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                  Profession
                </span>
                <select
                  name="category"
                  defaultValue=""
                  disabled={!isAdvancedOpen}
                  className="h-10 rounded-md border border-input bg-white px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Any profession</option>
                  {categories.map((category) => (
                    <option key={category.name} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                  Gender
                </span>
                <select
                  name="gender"
                  defaultValue=""
                  disabled={!isAdvancedOpen}
                  className="h-10 rounded-md border border-input bg-white px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Any gender</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                </select>
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                  Work time
                </span>
                <select
                  name="availabilityTime"
                  defaultValue=""
                  disabled={!isAdvancedOpen}
                  className="h-10 rounded-md border border-input bg-white px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Any time</option>
                  {workerTimeAvailabilityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                  Work days
                </span>
                <select
                  name="availabilityDays"
                  defaultValue=""
                  disabled={!isAdvancedOpen}
                  className="h-10 rounded-md border border-input bg-white px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Any days</option>
                  {workerDayAvailabilityOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
