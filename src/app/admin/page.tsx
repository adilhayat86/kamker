import Link from "next/link";
import { BadgeCheck, ClipboardList, Send, Users } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { recentProfessionals } from "@/lib/marketplace-data";

export const metadata = {
  title: "Admin Dashboard | Kamker",
  description: "Mock Kamker admin dashboard for Phase 1.",
};

const adminStats = [
  { label: "Total Professionals", value: "15,000+", icon: BadgeCheck },
  { label: "Total Customers", value: "32,400+", icon: Users },
  { label: "Total Requirements", value: "8,920", icon: Send },
];

export default function AdminPage() {
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
          Mock operational dashboard for the Phase 1 directory.
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
