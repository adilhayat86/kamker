import { logJson, supabaseRest, supabaseRestAll } from "./qa-utils.mjs";

const allowMutations = process.env.KAMKER_QA_ALLOW_MUTATIONS === "1";

function validatePhoneDigits(value) {
  const raw = (value ?? "").trim();

  if (!raw) {
    return { ok: false, normalized: "", error: "missing" };
  }

  if (/[^0-9+\s().-]/.test(raw)) {
    return { ok: false, normalized: "", error: "invalid" };
  }

  const digits = raw.replace(/\D/g, "");

  if (digits.length < 7 || digits.length > 15) {
    return { ok: false, normalized: "", error: "invalid" };
  }

  if (/^(\d)\1+$/.test(digits)) {
    return { ok: false, normalized: "", error: "fake" };
  }

  return { ok: true, normalized: digits };
}

function normalizePakistanMobilePhone(value) {
  const basic = validatePhoneDigits(value);

  if (!basic.ok) {
    return basic;
  }

  let digits = basic.normalized;

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  if (digits.startsWith("92")) {
    digits = digits.slice(2);
  } else if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  if (!/^3\d{9}$/.test(digits)) {
    return { ok: false, normalized: "", error: "invalid" };
  }

  if (/^3(\d)\1{8}$/.test(digits)) {
    return { ok: false, normalized: "", error: "fake" };
  }

  return { ok: true, normalized: `+92${digits}` };
}

async function main() {
  const workers = await supabaseRestAll(
    "professionals?select=id,full_name,phone_number,whatsapp_number,is_active,is_phone_verified,created_at&order=created_at.desc",
  );
  const hasPhoneNormalized = await phoneNormalizedColumnExists();
  const plan = buildCleanupPlan(workers);
  let postCleanupPlan = null;

  if (allowMutations && plan.idsToClear.length > 0) {
    await clearPhoneClaims(plan.idsToClear, hasPhoneNormalized);
    const updatedWorkers = await supabaseRestAll(
      "professionals?select=id,full_name,phone_number,whatsapp_number,is_active,is_phone_verified,created_at&order=created_at.desc",
    );
    postCleanupPlan = buildCleanupPlan(updatedWorkers);
  }

  logJson({
    ok: true,
    needsCleanup: plan.idsToClear.length > 0,
    cleanupComplete: postCleanupPlan ? postCleanupPlan.idsToClear.length === 0 : plan.idsToClear.length === 0,
    dryRun: !allowMutations,
    applied: allowMutations,
    hasPhoneNormalized,
    summary: {
      totalWorkers: workers.length,
      duplicateGroups: plan.duplicateGroups.length,
      invalidPhones: plan.invalid.length,
      idsToClear: plan.idsToClear.length,
      adminTestIdsToClear: plan.idsToClear.filter((id) =>
        plan.adminTestIds.has(id),
      ).length,
      nonAdminTestIdsToClear: plan.idsToClear.filter(
        (id) => !plan.adminTestIds.has(id),
      ).length,
    },
    duplicateGroups: plan.duplicateGroups.slice(0, 20),
    invalid: plan.invalid.slice(0, 20),
    idsToClear: plan.idsToClear,
    postCleanupSummary: postCleanupPlan
      ? {
          duplicateGroups: postCleanupPlan.duplicateGroups.length,
          invalidPhones: postCleanupPlan.invalid.length,
          idsToClear: postCleanupPlan.idsToClear.length,
        }
      : null,
    nextStep: allowMutations
      ? "Run npm run qa:check-production-phones, then apply sql/20260608_phone_ownership_rules.sql."
      : "Review this dry run. To apply, run KAMKER_QA_ALLOW_MUTATIONS=1 npm run qa:cleanup-production-phone-claims.",
  });
}

function buildCleanupPlan(workers) {
  const byNormalized = new Map();
  const invalid = [];

  for (const worker of workers) {
    const result = normalizePakistanMobilePhone(worker.phone_number);

    if (!result.ok) {
      if (result.error !== "missing") {
        invalid.push({ ...summarizeWorker(worker), reason: result.error });
      }

      continue;
    }

    const group = byNormalized.get(result.normalized) ?? [];
    group.push({
      ...summarizeWorker(worker),
      normalized: result.normalized,
    });
    byNormalized.set(result.normalized, group);
  }

  const duplicateGroups = [...byNormalized.entries()]
    .filter(([, group]) => group.length > 1)
    .map(([phone, group]) => {
      const sorted = group.sort(comparePhoneClaims);

      return {
        phone,
        keep: sorted[0],
        clear: sorted.slice(1),
      };
    });
  const duplicateIdsToClear = duplicateGroups.flatMap((group) =>
    group.clear.map((worker) => worker.id),
  );
  const invalidIdsToClear = invalid.map((worker) => worker.id);
  const idsToClear = [...new Set([...duplicateIdsToClear, ...invalidIdsToClear])];
  const adminTestIds = new Set(
    workers
      .filter((worker) => (worker.full_name ?? "").startsWith("Admin Test"))
      .map((worker) => worker.id),
  );

  return {
    duplicateGroups,
    invalid,
    idsToClear,
    adminTestIds,
  };
}

function comparePhoneClaims(first, second) {
  const activeDiff = Number(Boolean(second.active)) - Number(Boolean(first.active));

  if (activeDiff !== 0) {
    return activeDiff;
  }

  const firstCreated = new Date(first.createdAt ?? 0).getTime();
  const secondCreated = new Date(second.createdAt ?? 0).getTime();

  if (secondCreated !== firstCreated) {
    return secondCreated - firstCreated;
  }

  return String(second.id).localeCompare(String(first.id));
}

function summarizeWorker(worker) {
  return {
    id: worker.id,
    name: worker.full_name,
    phone: worker.phone_number,
    whatsapp: worker.whatsapp_number,
    active: worker.is_active,
    phoneVerified: worker.is_phone_verified,
    createdAt: worker.created_at,
  };
}

async function phoneNormalizedColumnExists() {
  try {
    await supabaseRest("professionals?select=id,phone_normalized&limit=1");
    return true;
  } catch (error) {
    if (String(error.message).includes("phone_normalized")) {
      return false;
    }

    throw error;
  }
}

async function clearPhoneClaims(ids, hasPhoneNormalized) {
  const payload = {
    phone_number: null,
    whatsapp_number: null,
    is_phone_verified: false,
    is_active: false,
  };

  if (hasPhoneNormalized) {
    payload.phone_normalized = null;
  }

  try {
    for (let start = 0; start < ids.length; start += 100) {
      const chunk = ids.slice(start, start + 100);
      await supabaseRest(`professionals?id=in.(${chunk.join(",")})`, {
        method: "PATCH",
        headers: { Prefer: "return=minimal" },
        body: JSON.stringify(payload),
      });
    }
  } catch (error) {
    if (!String(error.message).includes("violates not-null constraint")) {
      throw error;
    }

    await replacePhoneClaimsWithInactivePlaceholders(ids, hasPhoneNormalized);
  }
}

async function replacePhoneClaimsWithInactivePlaceholders(ids, hasPhoneNormalized) {
  for (let index = 0; index < ids.length; index += 1) {
    const placeholderPhone = `+92319${String(1000000 + index).slice(-7)}`;
    const payload = {
      phone_number: placeholderPhone,
      whatsapp_number: null,
      is_phone_verified: false,
      is_active: false,
    };

    if (hasPhoneNormalized) {
      payload.phone_normalized = placeholderPhone;
    }

    await supabaseRest(`professionals?id=eq.${ids[index]}`, {
      method: "PATCH",
      headers: { Prefer: "return=minimal" },
      body: JSON.stringify(payload),
    });
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
