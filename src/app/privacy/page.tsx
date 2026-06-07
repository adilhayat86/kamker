import { PageNavigation } from "@/components/page-navigation";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Privacy Policy | Kamker",
  description: "How Kamker handles basic marketplace registration and contact data.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl">
        <PageNavigation />
        <Card className="mt-6 bg-white shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm font-semibold uppercase tracking-normal text-primary">
              Privacy
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-normal">Privacy Policy</h1>
            <div className="mt-5 grid gap-4 text-sm leading-6 text-muted-foreground">
              <p>
                Kamker collects registration, profile, company, requirement, and contact details needed to operate the worker directory and requirement marketplace.
              </p>
              <p>
                Public worker and company profile information may be shown to visitors so customers can browse by category and city. Private admin notes, proof review details, and system data are used for review and operations.
              </p>
              <p>
                Kamker does not sell weapons, act as an agency, or guarantee any worker or customer. Users should verify details before contacting or hiring.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
