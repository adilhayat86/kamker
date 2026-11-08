import "server-only";
import { notFound, redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { getSessionCustomer, getSessionProfessional } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function canManageCompany(id: string) {
  if (!supabase) return false;
  if (await isAdminAuthenticated()) return true;
  const customer = await getSessionCustomer();
  if (!customer) return false;
  const { data, error } = await supabase.from("companies").select("id")
    .eq("id", id).eq("owner_user_id", customer.id).maybeSingle();
  return !error && Boolean(data);
}

export async function requireCompanyAccess(id: string) {
  if (!(await canManageCompany(id))) notFound();
}

export async function canManageRequirement(id: string) {
  if (!supabase) return false;
  if (await isAdminAuthenticated()) return true;
  const [customer, professional] = await Promise.all([getSessionCustomer(), getSessionProfessional()]);
  if (!customer && !professional) return false;
  const { data, error } = await supabase.from("requirements")
    .select("customer_id, professional_id").eq("id", id).maybeSingle();
  return !error && Boolean(data && (
    (customer && data.customer_id === customer.id) ||
    (professional && data.professional_id === professional.id)
  ));
}

export async function requireRequirementAccess(id: string) {
  if (!(await canManageRequirement(id))) notFound();
}

export async function requireCustomerAccount(next: string) {
  const customer = await getSessionCustomer();
  if (!customer) redirect(`/login?status=login-required&next=${encodeURIComponent(next)}`);
  return customer;
}
