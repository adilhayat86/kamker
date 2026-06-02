import {
  isActiveFeaturedProfessional,
  recentProfessionals,
  type Professional,
} from "@/lib/marketplace-data";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";

export type AccountProfessional = {
  id: string;
  full_name: string;
  phone_number: string;
  whatsapp_number: string | null;
  area: string | null;
  experience: string | null;
  expected_rate: string | null;
  short_bio: string | null;
  cnic: string | null;
  is_cnic_verified: boolean;
  is_phone_verified: boolean;
  is_active: boolean;
  is_featured: boolean;
  featured_until: string | null;
  cities: { name: string } | null;
  categories: { name: string } | null;
};

export type DemoAccountProfessional = Professional & {
  phone_number: string;
  whatsapp_number: string;
  is_cnic_verified: boolean;
  is_active: boolean;
};

export function isAccountFeatured(professional: AccountProfessional) {
  return (
    professional.is_featured &&
    Boolean(professional.featured_until) &&
    new Date(professional.featured_until as string) > new Date()
  );
}

export function getDemoAccountProfessional(): DemoAccountProfessional {
  const professional = recentProfessionals[0];

  return {
    ...professional,
    phone_number: "+92 300 0000000",
    whatsapp_number: "+92 300 0000000",
    is_cnic_verified: true,
    is_active: true,
    is_featured: isActiveFeaturedProfessional(professional),
  };
}

export async function getAccountProfessional() {
  if (!isSupabaseConfigured || !supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("professionals")
    .select(
      "id, full_name, phone_number, whatsapp_number, area, experience, expected_rate, short_bio, cnic, is_cnic_verified, is_phone_verified, is_active, is_featured, featured_until, cities(name), categories(name)",
    )
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to load account professional", error);
    return null;
  }

  return data as unknown as AccountProfessional | null;
}
