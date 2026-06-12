import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import { serviceGroups } from "@/lib/marketplace-data";

type RequirementForMatching = {
  id: string;
  requiredService: string;
  cityName: string | null;
  area: string | null;
  availability: string | null;
};

type MatchableProfessional = {
  id: string;
  area: string | null;
  availability: string | null;
  cities: { name: string } | null;
  categories: { name: string } | null;
};

type MatchableCompanyListing = {
  id: string;
  area: string | null;
  availability: string | null;
  city: string | null;
  category: string | null;
  service_group: string | null;
};

function sameText(left?: string | null, right?: string | null) {
  return Boolean(
    left && right && left.trim().toLowerCase() === right.trim().toLowerCase(),
  );
}

function normalize(value?: string | null) {
  return (value ?? "")
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function serviceMatches(workerService?: string | null, requiredService?: string | null) {
  if (sameText(workerService, requiredService)) {
    return true;
  }

  const requiredKey = normalize(requiredService);
  const workerKey = normalize(workerService);
  const serviceGroup = serviceGroups.find(
    (group) => normalize(group.name) === requiredKey,
  );

  if (!serviceGroup) {
    return false;
  }

  return serviceGroup.subcategories.some(
    (subcategory) => normalize(subcategory) === workerKey,
  );
}

function areaMatches(professionalArea?: string | null, requirementArea?: string | null) {
  if (!professionalArea || !requirementArea) {
    return false;
  }

  const professionalValue = professionalArea.trim().toLowerCase();
  const requirementValue = requirementArea.trim().toLowerCase();

  return (
    professionalValue === requirementValue ||
    professionalValue.includes(requirementValue) ||
    requirementValue.includes(professionalValue)
  );
}

export function calculateRequirementMatchScore(
  requirement: Omit<RequirementForMatching, "id">,
  professional: MatchableProfessional,
) {
  let score = 0;

  if (serviceMatches(professional.categories?.name, requirement.requiredService)) {
    score += 45;
  }

  if (sameText(professional.cities?.name, requirement.cityName)) {
    score += 25;
  }

  if (areaMatches(professional.area, requirement.area)) {
    score += 20;
  }

  if (sameText(professional.availability, requirement.availability)) {
    score += 10;
  }

  return score;
}

function calculateCompanyListingMatchScore(
  requirement: Omit<RequirementForMatching, "id">,
  listing: MatchableCompanyListing,
) {
  const categoryBackedListing: MatchableProfessional = {
    id: listing.id,
    area: listing.area,
    availability: listing.availability,
    cities: { name: listing.city ?? "" },
    categories: { name: listing.category ?? "" },
  };
  const serviceGroupBackedListing: MatchableProfessional = {
    ...categoryBackedListing,
    categories: { name: listing.service_group ?? "" },
  };

  return Math.max(
    calculateRequirementMatchScore(requirement, categoryBackedListing),
    calculateRequirementMatchScore(requirement, serviceGroupBackedListing),
  );
}

export async function createRequirementMatches(requirement: RequirementForMatching) {
  if (!isSupabaseConfigured || !supabase) {
    return 0;
  }

  const [professionalsResult, companyListingsResult] = await Promise.all([
    supabase
      .from("professionals")
      .select("id, area, availability, cities(name), categories(name)")
      .eq("is_active", true)
      .limit(500),
    supabase
      .from("company_listings")
      .select("id, area, availability, city, category, service_group")
      .eq("status", "approved")
      .limit(500),
  ]);

  if (professionalsResult.error) {
    console.error("Failed to load professionals for requirement matching", professionalsResult.error);
    return 0;
  }

  if (companyListingsResult.error) {
    console.error(
      "Failed to load company staff for requirement matching",
      companyListingsResult.error,
    );
  }

  const matches = ((professionalsResult.data ?? []) as unknown as MatchableProfessional[])
    .map((professional) => ({
      requirement_id: requirement.id,
      professional_id: professional.id,
      match_score: calculateRequirementMatchScore(requirement, professional),
    }))
    .filter((match) => match.match_score >= 70)
    .sort((left, right) => right.match_score - left.match_score);

  const companyMatches = ((companyListingsResult.data ?? []) as unknown as MatchableCompanyListing[])
    .map((listing) => ({
      requirement_id: requirement.id,
      company_listing_id: listing.id,
      match_score: calculateCompanyListingMatchScore(requirement, listing),
    }))
    .filter((match) => match.match_score >= 70)
    .sort((left, right) => right.match_score - left.match_score);

  let savedCount = 0;

  if (matches.length > 0) {
    const { error: insertError } = await supabase
      .from("requirement_matches")
      .upsert(matches, { onConflict: "requirement_id,professional_id" });

    if (insertError) {
      console.error("Failed to save professional requirement matches", insertError);
    } else {
      savedCount += matches.length;
    }
  }

  if (companyMatches.length > 0) {
    const { error: companyInsertError } = await supabase
      .from("requirement_matches")
      .upsert(companyMatches, { onConflict: "requirement_id,company_listing_id" });

    if (companyInsertError) {
      console.error("Failed to save company staff requirement matches", companyInsertError);
    } else {
      savedCount += companyMatches.length;
    }
  }

  if (matches.length > 0) {
    const notifications = matches.map((match) => ({
      requirement_id: match.requirement_id,
      professional_id: match.professional_id,
      channel: "app",
      status: "unread",
    }));

    const { error: notificationError } = await supabase
      .from("requirement_notifications")
      .upsert(notifications, { onConflict: "requirement_id,professional_id,channel" });

    if (notificationError) {
      console.error("Failed to create requirement notifications", notificationError);
    }
  }

  return savedCount;
}
