import { PageNavigation } from "@/components/page-navigation";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  title: "Terms | Kamker",
  description: "Kamker marketplace terms for workers, companies, and customers.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl">
        <PageNavigation />
        <Card className="mt-6 bg-white shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm font-semibold uppercase tracking-normal text-primary">
              Terms
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-normal">Terms of Use</h1>
            <div className="mt-5 grid gap-4 text-sm leading-6 text-muted-foreground">
              <p>
                Kamker is a professional directory and requirement marketplace. It is not a job board, employer, staffing agency, or payment escrow provider.
              </p>
              <p>
                Workers and companies are responsible for accurate profile information. Customers are responsible for verifying identity, skills, pricing, and safety before hiring or meeting anyone.
              </p>
              <p>
                Company packages control how many company-managed staff profiles can be published. Package activation depends on payment proof review and the current Kamker package rules.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
