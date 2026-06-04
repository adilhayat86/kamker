import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldAlert, Sparkles } from "lucide-react";

import { DismissibleCard } from "@/components/dismissible-notice";
import { PageNavigation } from "@/components/page-navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  isAdminAuthenticated,
  isAdminPasswordConfigured,
} from "@/lib/admin-auth";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export const metadata = {
  title: "Requirement Matches | Kamker Admin",
};

export const dynamic = "force-dynamic";

type Requirement = {
  id: string;
  required_service: string;
  area: string | null;
  availability: string | null;
  details: string;
  urgency: string;
  status: string;
  cities: { name: string } | null;
};

type RequirementMatch = {
  id: string;
  match_score: number;
  professionals: {
    id: string;
    full_name: string;
    availability: string | null;
    expected_rate: string | null;
    cities: { name: string } | null;
    categories: { name: string } | null;
  } | null;
};

type RequirementDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

async function getRequirement(id: string) {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("requirements")
    .select("id, required_service, area, availability, details, urgency, status, cities(name)")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Failed to load requirement detail", error);
    return null;
  }

  return data as unknown as Requirement | null;
}

async function getRequirementMatches(id: string) {
  if (!isSupabaseConfigured || !supabase) {
    return [] as RequirementMatch[];
  }

  const { data, error } = await supabase
    .from("requirement_matches")
    .select(
      "id, match_score, professionals(id, full_name, availability, expected_rate, cities(name), categories(name))",
    )
    .eq("requirement_id", id)
    .order("match_score", { ascending: false });

  if (error) {
    console.error("Failed to load requirement matches", error);
    return [] as RequirementMatch[];
  }

  return (data ?? []) as unknown as RequirementMatch[];
}

export default async function RequirementDetailPage({
  params,
}: RequirementDetailPageProps) {
  const adminPasswordConfigured = isAdminPasswordConfigured();
  const adminAuthenticated = await isAdminAuthenticated();

  if (adminPasswordConfigured && !adminAuthenticated) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const [requirement, matches] = await Promise.all([
    getRequirement(id),
    getRequirementMatches(id),
  ]);

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-5xl">
        <PageNavigation backHref="/admin" backLabel="Admin" />

        {!adminPasswordConfigured ? (
          <DismissibleCard
            className="mt-6 border-amber-200 bg-amber-50 text-amber-950 shadow-sm"
            cardContentClassName="p-4"
            contentClassName="flex gap-3"
            closeLabel="Close admin setup warning"
          >
                <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                <p className="text-sm">
                  Set KAMKER_ADMIN_PASSWORD and KAMKER_AUTH_SECRET before using
                  requirement matches with real customer data.
                </p>
          </DismissibleCard>
        ) : null}

        <div className="mt-6">
          <p className="text-sm font-semibold uppercase tracking-normal text-primary">
            Requirement detail
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-normal">
            {requirement?.required_service ?? "Requirement"}
          </h1>
          {requirement ? (
            <p className="mt-2 text-muted-foreground">
              {requirement.cities?.name ?? "Unknown city"}
              {requirement.area ? ` - ${requirement.area}` : ""} -{" "}
              {requirement.availability ?? "Any availability"} -{" "}
              {requirement.urgency}
            </p>
          ) : (
            <p className="mt-2 text-muted-foreground">
              Requirement not found or Supabase is not configured.
            </p>
          )}
        </div>

        {requirement?.details ? (
          <Card className="mt-6 bg-white shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm font-semibold uppercase tracking-normal text-primary">
                Details
              </p>
              <p className="mt-2 leading-7 text-muted-foreground">
                {requirement.details}
              </p>
            </CardContent>
          </Card>
        ) : null}

        <Card className="mt-6 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-normal text-primary">
                  Matched Professionals
                </p>
                <h2 className="mt-1 text-2xl font-bold tracking-normal">
                  {matches.length} stored match{matches.length === 1 ? "" : "es"}
                </h2>
              </div>
              <Badge className="gap-1">
                <Sparkles className="size-3" aria-hidden="true" />
                Future notifications ready
              </Badge>
            </div>

            {matches.length > 0 ? (
              <div className="mt-5 grid gap-3">
                {matches.map((match) => {
                  const professional = match.professionals;

                  return (
                    <div
                      key={match.id}
                      className="grid gap-3 rounded-lg border p-4 sm:grid-cols-[1fr_auto]"
                    >
                      <div>
                        <p className="font-semibold">
                          {professional?.full_name ?? "Unknown professional"}
                        </p>
                        <div className="mt-2 grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
                          <span>
                            Category:{" "}
                            {professional?.categories?.name ?? "Not provided"}
                          </span>
                          <span>
                            City: {professional?.cities?.name ?? "Not provided"}
                          </span>
                          <span>
                            Availability:{" "}
                            {professional?.availability ?? "Not provided"}
                          </span>
                          <span>
                            Hourly Rate:{" "}
                            {professional?.expected_rate ?? "Not provided"}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-start gap-2 sm:items-end">
                        <Badge variant="secondary">
                          Match Score: {match.match_score}
                        </Badge>
                        {professional?.id ? (
                          <Link
                            href={`/professionals/${professional.id}`}
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            View Profile
                          </Link>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="mt-5 rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                No matches stored for this requirement yet.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
