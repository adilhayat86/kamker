import { Bot, UploadCloud } from "lucide-react";

import { FormField, SelectField } from "@/components/form-field";
import { PageNavigation } from "@/components/page-navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { submitProofForReview } from "./actions";

export const metadata = {
  title: "Proof Upload | Kamker",
};

const statusMessages = {
  missing: "Please add amount and image.",
  "not-configured": "Supabase is not configured yet.",
  "upload-error": "Could not upload image. Please try again.",
  "save-error": "Could not save AI review. Please try again.",
  auto_approved: "AI review completed and marked this proof as auto-approved for audit.",
  needs_review: "AI review completed and marked this proof for review.",
} as const;

type ProofUploadPageProps = {
  searchParams?: Promise<{ status?: keyof typeof statusMessages }>;
};

export default async function ProofUploadPage({ searchParams }: ProofUploadPageProps) {
  const query = await searchParams;
  const status = query?.status;
  const statusMessage = status ? statusMessages[status] : null;

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-3xl">
        <PageNavigation />

        <div className="mt-5">
          <Badge variant="secondary" className="gap-1.5">
            <Bot className="size-3.5" aria-hidden="true" />
            AI proof review
          </Badge>
          <h1 className="mt-3 text-3xl font-bold tracking-normal">Upload Proof</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Upload a receipt or transfer screenshot. Kamker AI reads visible details and saves the result for audit.
          </p>
        </div>

        {statusMessage ? (
          <div className="mt-5 rounded-lg border bg-white p-4 text-sm font-medium">
            {statusMessage}
          </div>
        ) : null}

        <Card className="mt-6 bg-white shadow-sm">
          <CardContent className="p-5 sm:p-6">
            <form action={submitProofForReview} className="grid gap-4 sm:grid-cols-2">
              <SelectField
                label="Proof type"
                name="reviewType"
                options={["requirement", "company", "featured_profile", "general"]}
              />
              <FormField label="Expected amount PKR" name="expectedAmountPkr" type="number" placeholder="350" />
              <FormField label="Related ID optional" name="relatedId" placeholder="Requirement or company ID" />
              <label className="grid gap-2 text-sm font-medium sm:col-span-2">
                Proof image
                <input
                  name="proofImage"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="h-12 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </label>
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950 sm:col-span-2">
                <p className="font-semibold">Audit note</p>
                <p className="mt-1">
                  AI review is saved for Kamker records. Automatic activation can be connected later after this upload flow is tested.
                </p>
              </div>
              <Button className="h-12 sm:col-span-2">
                <UploadCloud className="size-4" aria-hidden="true" />
                Upload and Review
              </Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
