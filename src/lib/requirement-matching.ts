import { isSupabaseConfigured, supabase } from "@/lib/supabase";

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

function sameText(left?: string | null, right?: string | null) {
  return Boolean(
    left && right && left.trim().toLowerCase() === right.trim().toLowerCase(),
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

  if (sameText(professional.categories?.name, requirement.requiredService)) {
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

export async function createRequirementMatches(requirement: RequirementForMatching) {
  if (!isSupabaseConfigured || !supabase) {
    return 0;
  }

  const { data, error } = await supabase
    .from("professionals")
    .select("id, area, availability, cities(name), categories(name)")
    .eq("is_active", true)
    .limit(500);

  if (error) {
    console.error("Failed to load professionals for requirement matching", error);
    return 0;
  }

  const matches = ((data ?? []) as unknown as MatchableProfessional[])
    .map((professional) => ({
      requirement_id: requirement.id,
      professional_id: professional.id,
      match_score: calculateRequirementMatchScore(requirement, professional),
    }))
    .filter((match) => match.match_score >= 70)
    .sort((left, right) => right.match_score - left.match_score);

  if (matches.length === 0) {
    return 0;
  }

  const { error: insertError } = await supabase
    .from("requirement_matches")
    .upsert(matches, { onConflict: "requirement_id,professional_id" });

  if (insertError) {
    console.error("Failed to save requirement matches", insertError);
    return 0;
  }

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

  return matches.length;
}
