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

const ageRangeOptions = [
  { value: "18-25", label: "18-25" },
  { value: "26-35", label: "26-35" },
  { value: "36-45", label: "36-45" },
  { value: "46-plus", label: "46+" },
];

const hourlyRateOptions = [
  { value: "under-300", label: "Under Rs. 300/hr" },
  { value: "300-500", label: "Rs. 300-500/hr" },
  { value: "500-1000", label: "Rs. 500-1,000/hr" },
  { value: "under-1000", label: "Under Rs. 1,000/hr" },
  { value: "1000-2000", label: "Rs. 1,000-2,000/hr" },
  { value: "2000-plus", label: "Rs. 2,000+/hr" },
];

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
            <div className="mt-2 grid gap-2 rounded-lg border border-sky-100 bg-sky-50/50 p-3 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
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
                  Age
                </span>
                <select
                  name="age"
                  defaultValue=""
                  disabled={!isAdvancedOpen}
                  className="h-10 rounded-md border border-input bg-white px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Any age</option>
                  {ageRangeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                  Hourly rate
                </span>
                <select
                  name="rate"
                  defaultValue=""
                  disabled={!isAdvancedOpen}
                  className="h-10 rounded-md border border-input bg-white px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Any rate</option>
                  {hourlyRateOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
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
              <label className="grid gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                  Sort
                </span>
                <select
                  name="sort"
                  defaultValue="featured"
                  disabled={!isAdvancedOpen}
                  className="h-10 rounded-md border border-input bg-white px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="featured">Featured first</option>
                  <option value="newest">Recently added</option>
                  <option value="experienced">Most experienced</option>
                  <option value="rate-low">Lowest hourly rate</option>
                  <option value="rate-high">Highest hourly rate</option>
                </select>
              </label>
              <label className="flex h-10 items-center gap-2 rounded-md border border-input bg-white px-3 text-sm shadow-sm">
                <input
                  type="checkbox"
                  name="verified"
                  value="true"
                  disabled={!isAdvancedOpen}
                  className="size-4"
                />
                Verified only
              </label>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
