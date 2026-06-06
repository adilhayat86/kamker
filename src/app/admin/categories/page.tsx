import Link from "next/link";
import { redirect } from "next/navigation";

import { createAdminCategory } from "@/app/admin/actions";
import {
  AdminEmptyState,
  AdminMetaGrid,
  AdminSection,
  AdminShell,
  AdminStatCard,
  AdminWarning,
} from "@/components/admin/admin-ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  isAdminAuthenticated,
  isAdminPasswordConfigured,
} from "@/lib/admin-auth";
import { categorySlug } from "@/lib/marketplace-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export const metadata = {
  title: "Categories | Kamker Admin",
};

export const dynamic = "force-dynamic";

type CategoryRow = {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  parent_id: number | null;
  sort_order: number;
  created_at: string;
};

const iconOptions = [
  "stethoscope",
  "home",
  "graduation",
  "wrench",
  "car",
  "palette",
  "monitor",
  "shield",
  "briefcase",
  "clipboard",
  "heart",
  "drill",
  "scissors",
  "users",
];

async function getAdminCategories() {
  if (!isSupabaseConfigured || !supabase) {
    return [] as CategoryRow[];
  }

  const { data, error } = await supabase
    .from("categories")
    .select("id, name, slug, icon, description, parent_id, sort_order, created_at")
    .order("parent_id", { ascending: true, nullsFirst: true })
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });

  if (error) {
    console.error("Failed to load admin categories", error);
    return [] as CategoryRow[];
  }

  return (data ?? []) as CategoryRow[];
}

export default async function AdminCategoriesPage() {
  const adminPasswordConfigured = isAdminPasswordConfigured();
  const adminAuthenticated = await isAdminAuthenticated();

  if (adminPasswordConfigured && !adminAuthenticated) {
    redirect("/admin/login");
  }

  const rows = await getAdminCategories();
  const parentCategories = rows.filter((category) => category.parent_id === null);
  const subcategories = rows.filter((category) => category.parent_id !== null);
  const childrenByParent = new Map<number, CategoryRow[]>();

  subcategories.forEach((subcategory) => {
    const existing = childrenByParent.get(subcategory.parent_id as number) ?? [];
    childrenByParent.set(subcategory.parent_id as number, [...existing, subcategory]);
  });

  return (
    <AdminShell
      active="/admin/categories"
      title="Categories"
      description="Add service groups and subcategories that organize Kamker worker discovery."
      actions={
        <Button asChild variant="outline">
          <Link href="/categories">View Public Categories</Link>
        </Button>
      }
    >
      {!isSupabaseConfigured ? (
        <AdminWarning title="Supabase is not configured">
          Admin-added categories require the Supabase categories table. Built-in code categories still show publicly.
        </AdminWarning>
      ) : null}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <AdminStatCard label="Service Groups" value={parentCategories.length} />
        <AdminStatCard label="Subcategories" value={subcategories.length} />
        <AdminStatCard label="Total Managed Categories" value={rows.length} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AdminSection title="Add Service Group" description="Creates a parent category such as Healthcare, Education, or Home Repairs.">
          <form action={createAdminCategory} className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-medium">Service group name</span>
              <input name="name" placeholder="Healthcare" required className="h-11 rounded-md border border-input bg-background px-3 text-sm shadow-sm" />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium">Icon</span>
              <select name="icon" defaultValue="wrench" className="h-11 rounded-md border border-input bg-background px-3 text-sm shadow-sm">
                {iconOptions.map((icon) => (
                  <option key={icon} value={icon}>{icon}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium">Description</span>
              <textarea name="description" placeholder="Nurses, caregivers, and home health support." className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm" />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium">Sort order</span>
              <input name="sortOrder" type="number" defaultValue={0} className="h-11 rounded-md border border-input bg-background px-3 text-sm shadow-sm" />
            </label>
            <Button disabled={!adminAuthenticated || !isSupabaseConfigured}>Add Service Group</Button>
          </form>
        </AdminSection>

        <AdminSection title="Add Subcategory" description="Creates a worker profession under a service group, such as Nurses under Healthcare.">
          <form action={createAdminCategory} className="grid gap-4">
            <label className="grid gap-2">
              <span className="text-sm font-medium">Parent service group</span>
              <select name="parentId" required className="h-11 rounded-md border border-input bg-background px-3 text-sm shadow-sm">
                <option value="">Choose parent group</option>
                {parentCategories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium">Subcategory name</span>
              <input name="name" placeholder="Nurses" required className="h-11 rounded-md border border-input bg-background px-3 text-sm shadow-sm" />
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium">Icon</span>
              <select name="icon" defaultValue="wrench" className="h-11 rounded-md border border-input bg-background px-3 text-sm shadow-sm">
                {iconOptions.map((icon) => (
                  <option key={icon} value={icon}>{icon}</option>
                ))}
              </select>
            </label>
            <label className="grid gap-2">
              <span className="text-sm font-medium">Description</span>
              <textarea name="description" placeholder="Home nurses and patient care professionals." className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm" />
            </label>
            <Button disabled={!adminAuthenticated || !isSupabaseConfigured || parentCategories.length === 0}>Add Subcategory</Button>
          </form>
        </AdminSection>
      </div>

      <AdminSection title="Managed Categories" description="Supabase categories that admins can use for registrations and future dynamic discovery.">
        <div className="grid gap-4">
          {parentCategories.length > 0 ? (
            parentCategories.map((category) => (
              <div key={category.id} className="rounded-xl border bg-white p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-semibold">{category.name}</h2>
                      <Badge variant="outline">Service group</Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{category.description ?? "No description added."}</p>
                  </div>
                  <Button asChild variant="outline" className="w-full sm:w-auto">
                    <Link href={`/categories/${category.slug || categorySlug(category.name)}`}>Public Page</Link>
                  </Button>
                </div>
                <div className="mt-4">
                  <AdminMetaGrid
                    items={[
                      { label: "Slug", value: category.slug },
                      { label: "Icon", value: category.icon ?? "wrench" },
                      { label: "Sort order", value: category.sort_order },
                    ]}
                  />
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {(childrenByParent.get(category.id) ?? []).length > 0 ? (
                    (childrenByParent.get(category.id) ?? []).map((child) => (
                      <Link
                        key={child.id}
                        href={`/categories/${child.slug || categorySlug(child.name)}`}
                        className="rounded-full border bg-slate-50 px-3 py-1 text-sm font-medium hover:border-primary"
                      >
                        {child.name}
                      </Link>
                    ))
                  ) : (
                    <span className="text-sm text-muted-foreground">No subcategories yet.</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <AdminEmptyState>No Supabase-managed categories found yet.</AdminEmptyState>
          )}
        </div>
      </AdminSection>
    </AdminShell>
  );
}
