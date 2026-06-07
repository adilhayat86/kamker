import {
  isActiveFeaturedProfessional,
  recentProfessionals,
  type Professional,
} from "@/lib/marketplace-data";
import { getSessionProfessional } from "@/lib/auth";

export type AccountProfessional = {
  id: string;
  full_name: string;
  phone_number: string;
  whatsapp_number: string | null;
  area: string | null;
  gender: string | null;
  age: number | null;
  availability: string | null;
  years_experience: number | null;
  experience: string | null;
  expected_rate: string | null;
  tagline: string | null;
  short_bio: string | null;
  cnic: string | null;
  profile_photo_url: string | null;
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
  return getSessionProfessional();
}
