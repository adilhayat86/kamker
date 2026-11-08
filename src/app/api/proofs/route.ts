import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getSessionProfessional } from "@/lib/auth";
import { canManageCompany, canManageRequirement } from "@/lib/ownership";
import { proofPath, signedProofUrl } from "@/lib/private-proofs";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const reference = new URL(request.url).pathname + new URL(request.url).search;
  const path = proofPath(reference);
  if (!path) return new NextResponse(null, { status: 404 });
  let allowed = await isAdminAuthenticated();
  if (!allowed) {
    const [scope, id] = path.split("/");
    if (scope === "company-packages") allowed = await canManageCompany(id);
    if (scope === "requirement-broadcasts") allowed = await canManageRequirement(id);
    if (scope === "featured_profile") allowed = (await getSessionProfessional())?.id === id;
  }
  if (!allowed) return new NextResponse(null, { status: 404 });
  try {
    return NextResponse.redirect(await signedProofUrl(reference), {
      headers: { "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" },
    });
  } catch {
    return new NextResponse(null, { status: 503 });
  }
}
