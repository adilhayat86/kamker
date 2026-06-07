import Link from "next/link";
import { redirect } from "next/navigation";

import { activateCompanyPackage } from "@/app/admin/actions";
import {
  AdminEmptyState,
  AdminMetaGrid,
  AdminSection,
  AdminShell,
  AdminStatCard,
  AdminStatusBadge,
  AdminWarning,
} from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import {
  isAdminAuthenticated,
  isAdminPasswordConfigured,
} from "@/lib/admin-auth";
import { getAdminCountSummary } from "@/lib/admin-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export const metadata = {
  title: "Payments & Proofs | Kamker Admin",
};

export const dynamic = "force-dynamic";

type ProofReview = {
  id: string;
  review_type: string;
  related_id: string | null;
  expected_amount_pkr: number;
  image_url: string;
  ai_detected_amount_pkr: number | null;
  ai_confidence: number;
  ai_decision: string;
  audit_status: string;
  created_at: string;
};

type ManualPayment = {
  id: string;
  company_id: string;
  package_key: string;
  amount_pkr: number;
  payment_method: string;
  payer_name: string | null;
  sender_phone: string | null;
  transaction_reference: string | null;
  status: string;
  created_at: string;
  companies: { company_name: string } | null;
};

async function getProofReviews() {
  if (!isSupabaseConfigured || !supabase) {
    return [] as ProofReview[];
  }

  const { data, error } = await supabase
    .from("proof_reviews")
    .select("id, review_type, related_id, expected_amount_pkr, image_url, ai_detected_amount_pkr, ai_confidence, ai_decision, audit_status, created_at")
    .order("created_at", { ascending: false })
    .limit(60);

  if (error) {
    console.error("Failed to load proof reviews", error);
    return [] as ProofReview[];
  }

  return (data ?? []) as ProofReview[];
}

async function getManualPayments() {
  if (!isSupabaseConfigured || !supabase) {
    return [] as ManualPayment[];
  }

  const { data, error } = await supabase
    .from("manual_payments")
    .select("id, company_id, package_key, amount_pkr, payment_method, payer_name, sender_phone, transaction_reference, status, created_at, companies(company_name)")
    .order("created_at", { ascending: false })
    .limit(60);

  if (error) {
    console.error("Failed to load manual payments", error);
    return [] as ManualPayment[];
  }

  return (data ?? []) as unknown as ManualPayment[];
}

export default async function AdminPaymentsPage() {
  const adminPasswordConfigured = isAdminPasswordConfigured();
  const adminAuthenticated = await isAdminAuthenticated();

  if (adminPasswordConfigured && !adminAuthenticated) {
    redirect("/admin/login");
  }

  const [summary, proofs, payments] = await Promise.all([
    getAdminCountSummary(),
    getProofReviews(),
    getManualPayments(),
  ]);

  return (
    <AdminShell
      active="/admin/payments"
      title="Payments & Proofs"
      description="Review company package payments, featured profile proofs, and AI proof review outcomes."
    >
      {!isSupabaseConfigured ? (
        <AdminWarning title="Supabase is not configured">
          Proof review and payment queues need Supabase tables and storage buckets.
        </AdminWarning>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <AdminStatCard label="Pending Proof Reviews" value={summary.pendingProofs} tone={summary.pendingProofs ? "warning" : "good"} />
        <AdminStatCard label="Manual Payments Loaded" value={payments.length} />
        <AdminStatCard label="Proof Reviews Loaded" value={proofs.length} />
      </div>

      <AdminSection title="Proof Reviews" description="AI-readable proof checks and manual review status.">
        <div className="grid gap-3">
          {proofs.length > 0 ? (
            proofs.map((proof) => (
              <div key={proof.id} className="rounded-lg border p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{proof.review_type}</p>
                      <AdminStatusBadge>{proof.ai_decision}</AdminStatusBadge>
                      <AdminStatusBadge>{proof.audit_status}</AdminStatusBadge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Created {new Date(proof.created_at).toLocaleString("en-PK")}
                    </p>
                  </div>
                  <Button asChild variant="outline">
                    <Link href={proof.image_url}>Open Proof Image</Link>
                  </Button>
                </div>
                <div className="mt-4">
                  <AdminMetaGrid
                    items={[
                      { label: "Expected", value: `Rs ${proof.expected_amount_pkr}` },
                      { label: "AI amount", value: proof.ai_detected_amount_pkr ? `Rs ${proof.ai_detected_amount_pkr}` : "Not detected" },
                      { label: "AI confidence", value: proof.ai_confidence },
                      { label: "Related ID", value: proof.related_id ?? "Not linked" },
                    ]}
                  />
                </div>
              </div>
            ))
          ) : (
            <AdminEmptyState>No proof reviews found.</AdminEmptyState>
          )}
        </div>
      </AdminSection>

      <AdminSection title="Manual Company Payments" description="Package payments awaiting admin business review.">
        <div className="grid gap-3">
          {payments.length > 0 ? (
            payments.map((payment) => (
              <div key={payment.id} className="rounded-lg border p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{payment.companies?.company_name ?? "Unknown company"}</p>
                      <AdminStatusBadge>{payment.status}</AdminStatusBadge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {payment.package_key} - Rs {payment.amount_pkr} - {payment.payment_method}
                    </p>
                  </div>
                  <Button asChild variant="outline">
                    <Link href={`/companies/${payment.company_id}/dashboard`}>Company Dashboard</Link>
                  </Button>
                </div>
                <div className="mt-4">
                  <AdminMetaGrid
                    items={[
                      { label: "Payer", value: payment.payer_name ?? "Not provided" },
                      { label: "Sender phone", value: payment.sender_phone ?? "Not provided" },
                      { label: "Reference", value: payment.transaction_reference ?? "Not provided" },
                      { label: "Created", value: new Date(payment.created_at).toLocaleString("en-PK") },
                    ]}
                  />
                </div>
                {payment.status !== "approved" ? (
                  <form
                    action={activateCompanyPackage}
                    className="mt-4 grid gap-2 rounded-lg border bg-slate-50 p-3 sm:grid-cols-[1fr_auto]"
                  >
                    <input type="hidden" name="companyId" value={payment.company_id} />
                    <input type="hidden" name="packageKey" value={payment.package_key} />
                    <input type="hidden" name="manualPaymentId" value={payment.id} />
                    <p className="text-sm text-muted-foreground">
                      Approve this payment and activate the selected company package.
                    </p>
                    <Button type="submit" disabled={!adminAuthenticated}>
                      Activate Package
                    </Button>
                  </form>
                ) : null}
              </div>
            ))
          ) : (
            <AdminEmptyState>No manual payments found.</AdminEmptyState>
          )}
        </div>
      </AdminSection>
    </AdminShell>
  );
}
