import Link from "next/link";
import { BadgeCheck, ClipboardList, Send, Users } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { recentProfessionals } from "@/lib/marketplace-data";

type Requirement = {
  id: string;
  required_service: string;
  area: string | null;
  details: string;
  urgency: string;
  status: string;
  broadcast_status: string | null;
  created_at: string;
  cities: { name: string } | null;
};

export const metadata = {
  title: "Admin Dashboard | Kamker",
  description: "Kamker admin dashboard for requirements and registrations.",
};

async function getRequirements() {
  if (!isSupabaseConfigured || !supabase) {
    return [] as Requirement[];
  }

  const { data, error } = await supabase
    .from("requirements")
    .select("id, required_service, area, details, urgency, status, broadcast_status, created_at, cities(name)")
    .order("created_at", { ascending: false })
    .limit(10);

  if (error) {
    console.error("Failed to load requirements", error);
    return [] as Requirement[];
  }

  return (data ?? []) as Requirement[];
}

export default async function AdminPage() {
  const requirements = await getRequirements();

  const adminStats = [
    { label: "Total Professionals", value: "15,000+", icon: BadgeCheck },
    { label: "Total Customers", value: "32,400+", icon: Users },
    { label: "Recent Requirements", value: String(requirements.length), icon: Send },
  ];

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <Link href="/" className="text-sm font-medium text-primary">
          Kamker
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-normal">
          Admin Dashboard
        </h1>
        <p className="mt-2 text-muted-foreground">
          Review submitted requirements, registrations, and future paid broadcasts.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {adminStats.map((item) => {
            const Icon = item.icon;

            return (
              <Card key={item.label} className="bg-white shadow-sm">
                <CardContent className="p-5">
                  <Icon className="size-6 text-primary" aria-hidden="true" />
                  <p className="mt-4 text-2xl font-bold">{item.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {item.label}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="mt-6 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <Send className="size-5 text-primary" aria-hidden="true" />
              <h2 className="text-xl font-semibold">Submitted Requirements</h2>
            </div>

            {requirements.length > 0 ? (
              <div className="mt-4 grid gap-3">
                {requirements.map((requirement) => (
                  <div key={requirement.id} className="rounded-lg border p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="font-semibold">{requirement.required_service}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {requirement.cities?.name ?? "Unknown city"}
                          {requirement.area ? ` • ${requirement.area}` : ""} • {requirement.urgency}
                        </p>
                      </div>
                      <div className="text-sm font-medium text-primary">
                        {requirement.status} / {requirement.broadcast_status ?? "free"}
                      </div>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-muted-foreground">
                      {requirement.details}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                No requirements found yet. Submit one from the Send Requirement page after setup.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-6 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2">
              <ClipboardList className="size-5 text-primary" aria-hidden="true" />
              <h2 className="text-xl font-semibold">Recent Registrations</h2>
            </div>
            <div className="mt-4 grid gap-3">
              {recentProfessionals.slice(0, 5).map((professional) => (
                <div
                  key={professional.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-semibold">{professional.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {professional.role} • {professional.city}
                    </p>
                  </div>
                  <span className="text-sm font-medium text-primary">New</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
