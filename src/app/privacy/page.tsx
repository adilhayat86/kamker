import { PageNavigation } from "@/components/page-navigation";
import { Card, CardContent } from "@/components/ui/card";

export const metadata = {
  alternates: { canonical: "/privacy" },
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
              <h2 className="text-lg font-semibold text-foreground">Cookies and measurement</h2>
              <p>
                Kamker uses first-party cookies to keep accounts signed in and browser storage to measure visits and registration activity. When Google Ads measurement is enabled, Google may use advertising cookies and ad-click identifiers to measure successful worker registrations.
              </p>
              <p>
                Kamker&apos;s conversion-event payloads do not include phone numbers, email addresses, CNIC numbers, passwords, payment receipts, or message text. Registration events use a random transaction identifier to avoid counting the same signup again.
              </p>
              <h2 className="text-lg font-semibold text-foreground">Advertising choices</h2>
              <p>
                If display advertising is enabled, third-party vendors, including Google, may use cookies to serve ads based on prior visits to this or other websites. Google&apos;s advertising cookies may allow Google and its partners to personalize those ads.
                You can manage personalized advertising through{" "}
                <a href="https://myadcenter.google.com/" className="font-semibold text-primary underline" target="_blank" rel="noreferrer">Google My Ad Center</a>{" "}
                or visit{" "}
                <a href="https://www.aboutads.info/choices/" className="font-semibold text-primary underline" target="_blank" rel="noreferrer">industry advertising choices</a>.
              </p>
              <p>
                For questions about your Kamker data, use the{" "}
                <a href="/contact" className="font-semibold text-primary underline">Contact Us page</a>.
                Workers can update their public details from their account.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
