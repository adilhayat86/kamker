import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldAlert, Sparkles } from "lucide-react";

import {
  retryRequirementAdminAlert,
  updateRequirementStatus,
} from "@/app/admin/actions";
import { ContactActionButton } from "@/components/contact-action-button";
import { DismissibleCard } from "@/components/dismissible-notice";
import { PageNavigation } from "@/components/page-navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  isAdminAuthenticated,
  isAdminPasswordConfigured,
} from "@/lib/admin-auth";
import { whatsappHref } from "@/lib/phone";
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
  budget: string | null;
  phone_number: string;
  whatsapp_number: string | null;
  urgency: string;
  status: string;
  broadcast_status: string;
  payment_status: string;
  cities: { name: string } | null;
};

type RequirementMatch = {
  id: string;
  match_score: number;
  professionals: {
    id: string;
    full_name: string;
    phone_number: string;
    whatsapp_number: string | null;
    availability: string | null;
    expected_rate: string | null;
    cities: { name: string } | null;
    categories: { name: string } | null;
  } | null;
  company_listings: {
    id: string;
    title: string;
    category: string | null;
    city: string | null;
    availability: string | null;
    hourly_rate: number | null;
    monthly_rate: number | null;
    phone: string | null;
    whatsapp: string | null;
    companies: { company_name: string } | null;
  } | null;
};

type RequirementWhatsappAlert = {
  id: string;
  status: string;
  message_type: string | null;
  provider_message_id: string | null;
  error_message: string | null;
  created_at: string;
};

type RequirementDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
  searchParams?: Promise<{
    notice?: "whatsapp-sent" | "whatsapp-failed";
  }>;
};

async function getRequirement(id: string) {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("requirements")
    .select("id, required_service, area, availability, details, budget, phone_number, whatsapp_number, urgency, status, broadcast_status, payment_status, cities(name)")
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
      "id, match_score, professionals(id, full_name, phone_number, whatsapp_number, availability, expected_rate, cities(name), categories(name)), company_listings(id, title, category, city, availability, hourly_rate, monthly_rate, phone, whatsapp, companies(company_name))",
    )
    .eq("requirement_id", id)
    .order("match_score", { ascending: false });

  if (error) {
    console.error("Failed to load requirement matches", error);
    return [] as RequirementMatch[];
  }

  return (data ?? []) as unknown as RequirementMatch[];
}

async function getRequirementWhatsappAlerts(id: string) {
  if (!isSupabaseConfigured || !supabase) {
    return [] as RequirementWhatsappAlert[];
  }

  const { data, error } = await supabase
    .from("whatsapp_messages")
    .select("id, status, message_type, provider_message_id, error_message, created_at")
    .eq("related_type", "requirement")
    .eq("related_id", id)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    console.error("Failed to load requirement WhatsApp alerts", error);
    return [] as RequirementWhatsappAlert[];
  }

  return (data ?? []) as unknown as RequirementWhatsappAlert[];
}

export default async function RequirementDetailPage({
  params,
  searchParams,
}: RequirementDetailPageProps) {
  const adminPasswordConfigured = isAdminPasswordConfigured();
  const adminAuthenticated = await isAdminAuthenticated();

  if (adminPasswordConfigured && !adminAuthenticated) {
    redirect("/admin/login");
  }

  const { id } = await params;
  const query = await searchParams;
  const [requirement, matches, whatsappAlerts] = await Promise.all([
    getRequirement(id),
    getRequirementMatches(id),
    getRequirementWhatsappAlerts(id),
  ]);
  const statusActions = [
    { label: "Mark Open", status: "open" },
    { label: "Mark Contacted", status: "contacted" },
    { label: "Mark Completed", status: "completed" },
    { label: "Mark Spam", status: "spam" },
  ];

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-5xl">
        <PageNavigation backHref="/admin/requirements" backLabel="Requirements" />

        {!adminPasswordConfigured ? (
          <DismissibleCard
            className="mt-6 border-amber-200 bg-amber-50 text-amber-950 shadow-sm"
            cardContentClassName="p-4"
            contentClassName="flex gap-3"
            closeLabel="Close admin setup warning"
          >
                <ShieldAlert className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
                <p className="text-sm">
                    Set owner or manager admin credentials and KAMKER_AUTH_SECRET
                    before using requirement matches with real customer data.
                </p>
          </DismissibleCard>
        ) : null}

        {query?.notice ? (
          <DismissibleCard
            className={`mt-6 shadow-sm ${
              query.notice === "whatsapp-sent"
                ? "border-emerald-200 bg-emerald-50 text-emerald-950"
                : "border-amber-200 bg-amber-50 text-amber-950"
            }`}
            cardContentClassName="p-4"
            closeLabel="Close WhatsApp notice"
          >
            <p className="text-sm font-medium">
              {query.notice === "whatsapp-sent"
                ? "Admin WhatsApp alert was sent."
                : "Admin WhatsApp alert could not be sent. Check the alert history below for the provider status."}
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
          {requirement ? (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge variant="outline">Status: {requirement.status}</Badge>
              <Badge variant="outline">Payment: {requirement.payment_status}</Badge>
              <Badge variant="outline">Broadcast: {requirement.broadcast_status}</Badge>
              <form action={retryRequirementAdminAlert}>
                <input type="hidden" name="requirementId" value={requirement.id} />
                <Button
                  type="submit"
                  size="sm"
                  variant="secondary"
                  disabled={!adminAuthenticated}
                >
                  Retry Admin Alert
                </Button>
              </form>
              {statusActions.map((action) => (
                <form key={action.status} action={updateRequirementStatus}>
                  <input type="hidden" name="requirementId" value={requirement.id} />
                  <input type="hidden" name="status" value={action.status} />
                  <Button
                    type="submit"
                    size="sm"
                    variant={requirement.status === action.status ? "default" : "outline"}
                    disabled={!adminAuthenticated || requirement.status === action.status}
                  >
                    {action.label}
                  </Button>
                </form>
              ))}
            </div>
          ) : null}
        </div>

        {requirement?.details ? (
          <Card className="mt-6 bg-white shadow-sm">
            <CardContent className="p-5">
              <div className="grid gap-5 lg:grid-cols-[1fr_280px]">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-normal text-primary">
                    Details
                  </p>
                  <p className="mt-2 leading-7 text-muted-foreground">
                    {requirement.details}
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4 text-sm">
                  <p className="font-semibold">Customer contact</p>
                  <div className="mt-3 grid gap-2 text-muted-foreground">
                    <p>
                      <span className="font-medium text-foreground">Phone:</span>{" "}
                      {requirement.phone_number}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">WhatsApp:</span>{" "}
                      {requirement.whatsapp_number ?? "Not provided"}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">Budget:</span>{" "}
                      {requirement.budget ?? "Not provided"}
                    </p>
                  </div>
                  <div className="mt-4 grid gap-2">
                    <ContactActionButton
                      href={requirement.phone_number ? `tel:${requirement.phone_number}` : null}
                      displayValue={requirement.phone_number}
                      type="call"
                      className="h-10"
                    />
                    <ContactActionButton
                      href={whatsappHref(requirement.whatsapp_number ?? requirement.phone_number)}
                      displayValue={requirement.whatsapp_number ?? requirement.phone_number}
                      type="whatsapp"
                      className="h-10"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <Card className="mt-6 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-normal text-primary">
                  Admin WhatsApp Alert
                </p>
                <h2 className="mt-1 text-2xl font-bold tracking-normal">
                  {whatsappAlerts[0]?.status ?? "Not sent"}
                </h2>
              </div>
              {whatsappAlerts[0]?.status ? (
                <Badge
                  variant={whatsappAlerts[0].status === "sent" ? "default" : "outline"}
                >
                  {whatsappAlerts[0].message_type ?? "message"}
                </Badge>
              ) : null}
            </div>
            {whatsappAlerts.length > 0 ? (
              <div className="mt-5 grid gap-3">
                {whatsappAlerts.map((alert) => (
                  <div key={alert.id} className="rounded-lg border p-4 text-sm">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={alert.status === "sent" ? "default" : "outline"}>
                        {alert.status}
                      </Badge>
                      <span className="font-medium">
                        {alert.message_type ?? "message"}
                      </span>
                      <span className="text-muted-foreground">
                        {new Date(alert.created_at).toLocaleString("en-PK")}
                      </span>
                    </div>
                    {alert.provider_message_id ? (
                      <p className="mt-2 text-muted-foreground">
                        Provider ID: {alert.provider_message_id}
                      </p>
                    ) : null}
                    {alert.error_message ? (
                      <p className="mt-2 break-words text-xs leading-5 text-amber-700">
                        Provider error recorded. Meta setup may still require
                        display-name approval or payment activation.
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                No admin alert has been logged for this requirement yet.
              </div>
            )}
          </CardContent>
        </Card>

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
                  const companyListing = match.company_listings;
                  const displayName =
                    professional?.full_name ??
                    companyListing?.title ??
                    "Unknown professional";
                  const category =
                    professional?.categories?.name ??
                    companyListing?.category ??
                    "Not provided";
                  const city =
                    professional?.cities?.name ??
                    companyListing?.city ??
                    "Not provided";
                  const availability =
                    professional?.availability ??
                    companyListing?.availability ??
                    "Not provided";
                  const contactPhone =
                    professional?.phone_number ??
                    companyListing?.phone ??
                    "Not provided";
                  const contactWhatsapp =
                    professional?.whatsapp_number ??
                    companyListing?.whatsapp ??
                    "Not provided";
                  const hourlyRate =
                    professional?.expected_rate ??
                    (companyListing?.hourly_rate
                      ? `Rs ${companyListing.hourly_rate.toLocaleString("en-PK")}/hour`
                      : companyListing?.monthly_rate
                        ? `Rs ${companyListing.monthly_rate.toLocaleString("en-PK")}/month`
                        : "Not provided");

                  return (
                    <div
                      key={match.id}
                      className="grid gap-3 rounded-lg border p-4 sm:grid-cols-[1fr_auto]"
                    >
                      <div>
                        <p className="font-semibold">
                          {displayName}
                        </p>
                        {companyListing ? (
                          <p className="mt-1 text-xs font-medium text-primary">
                            Company staff
                            {companyListing.companies?.company_name
                              ? ` - ${companyListing.companies.company_name}`
                              : ""}
                          </p>
                        ) : null}
                        <div className="mt-2 grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
                          <span>
                            Category: {category}
                          </span>
                          <span>
                            City: {city}
                          </span>
                          <span>
                            Availability: {availability}
                          </span>
                          <span>
                            Hourly Rate: {hourlyRate}
                          </span>
                          <span>
                            Phone: {contactPhone}
                          </span>
                          <span>
                            WhatsApp: {contactWhatsapp}
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
                        ) : companyListing?.id ? (
                          <Link
                            href={`/company-listings/${companyListing.id}`}
                            className="text-sm font-medium text-primary hover:underline"
                          >
                            View Staff Profile
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
