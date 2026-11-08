import "server-only";
import { getAdminSessionRole } from "@/lib/admin-auth";
import { getSessionCustomer, getSessionProfessional } from "@/lib/auth";

export type PhotoActor = { id: string; targetType: "professional" | "customer" | "page" };

export async function getPhotoActors() {
  const [worker, customer, admin] = await Promise.all([
    getSessionProfessional(), getSessionCustomer(), getAdminSessionRole(),
  ]);
  return {
    worker: worker ? { id: worker.id, targetType: "professional" as const } : null,
    customer: customer ? { id: customer.id, targetType: "customer" as const } : null,
    // The application has one owner and one manager account. Keep their upload
    // identities separate from front-end accounts and from each other.
    admin: admin ? {
      id: admin === "owner" ? "00000000-0000-4000-8000-000000000001" : "00000000-0000-4000-8000-000000000002",
      targetType: "page" as const,
    } : null,
  };
}

export async function getPhotoActor(folder: "professional-photos" | "company-staff"): Promise<PhotoActor | null> {
  const actors = await getPhotoActors();
  return folder === "professional-photos" ? actors.worker : actors.admin ?? actors.customer;
}
