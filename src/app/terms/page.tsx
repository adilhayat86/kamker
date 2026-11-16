import { PageNavigation } from "@/components/page-navigation";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  alternates: { canonical: "/terms" },
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
            <p className="mt-2 text-sm text-muted-foreground">Last updated: 16 November 2026</p>
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
              <p>
                Browsing and worker registration are free. Send Requirement outreach, featured profiles, and company packages are optional paid services. Review the displayed price and recipient count before submitting payment. Payment verification does not guarantee replies, worker availability, or a completed hire.
              </p>
              <p>
                Availability and rates are provided by workers or companies and may change. Agree on the scope, rate, timing, and payment directly with the provider before work begins. Contact Kamker through the Contact Us page for marketplace or payment-review questions.
              </p>
              <h2 className="text-lg font-semibold text-foreground">Profile and content rules</h2>
              <p>
                Publish only accurate details and photos or text you own or have permission to use. Do not impersonate another person, invent qualifications or verification claims, publish someone else&apos;s private information, or post spam, scams, threats, hateful or sexually explicit material, or offers of illegal goods or services.
              </p>
              <p>
                Public profiles are provided by users. Kamker may restrict or remove content or accounts that violate these rules. To report a problem, use the{" "}
                <a href="/contact#report-content" className="font-semibold text-primary underline">content-reporting instructions</a>{" "}
                and include the relevant public page link.
              </p>
              <h2 className="text-lg font-semibold text-foreground">Advertising</h2>
              <p>
                If display ads are introduced, they will be identified separately from worker profiles and site navigation. An advertisement is not a Kamker endorsement. Do not click advertisements to support Kamker, use automated traffic, or ask other people to click ads.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
