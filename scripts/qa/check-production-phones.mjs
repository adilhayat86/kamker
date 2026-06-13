import { logJson, supabaseRestAll } from "./qa-utils.mjs";

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
    "professionals?select=id,full_name,phone_number,whatsapp_number,is_active,created_at&order=created_at.desc",
  );
  const byNormalized = new Map();
  const invalid = [];
  const missing = [];

  for (const worker of workers) {
    const result = normalizePakistanMobilePhone(worker.phone_number);

    if (!result.ok) {
      const entry = summarizeWorker(worker);

      if (result.error === "missing") {
        missing.push(entry);
      } else {
        invalid.push({ ...entry, reason: result.error });
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
    .map(([phone, group]) => ({
      phone,
      count: group.length,
      examples: group.slice(0, 8),
    }))
    .sort((a, b) => b.count - a.count || a.phone.localeCompare(b.phone));

  const adminTestWorkers = workers.filter((worker) =>
    (worker.full_name ?? "").startsWith("Admin Test"),
  );

  logJson({
    ok: duplicateGroups.length === 0,
    migrationCanCreateUniqueIndex: duplicateGroups.length === 0,
    nextMigration: "sql/20260608_phone_ownership_rules.sql",
    summary: {
      totalWorkers: workers.length,
      adminTestWorkers: adminTestWorkers.length,
      uniqueValidPhones: byNormalized.size,
      duplicatePhoneGroups: duplicateGroups.length,
      invalidPhones: invalid.length,
      missingPhones: missing.length,
    },
    duplicateGroups: duplicateGroups.slice(0, 20),
    invalidExamples: invalid.slice(0, 20),
    missingExamples: missing.slice(0, 20),
    suggestedCleanupSql: buildCleanupSql(duplicateGroups, invalid),
    note:
      duplicateGroups.length === 0
        ? "The phone ownership migration should be able to create the unique phone index."
        : "Clean or remove duplicate worker phone numbers before expecting the unique index to be created.",
  });

  if (duplicateGroups.length > 0) {
    process.exitCode = 1;
  }
}

function summarizeWorker(worker) {
  return {
    id: worker.id,
    name: worker.full_name,
    phone: worker.phone_number,
    whatsapp: worker.whatsapp_number,
    active: worker.is_active,
    createdAt: worker.created_at,
  };
}

function buildCleanupSql(duplicateGroups, invalid) {
  const duplicateIdsToClear = duplicateGroups.flatMap((group) =>
    group.examples.slice(1).map((worker) => worker.id),
  );
  const invalidIdsToClear = invalid.map((worker) => worker.id);
  const ids = [...new Set([...duplicateIdsToClear, ...invalidIdsToClear])];

  if (ids.length === 0) {
    return "";
  }

  const idList = ids.map((id) => `    '${id}'`).join(",\n");

  return [
    "-- Review before running. This clears duplicate/invalid worker contact numbers only.",
    "-- It does not delete worker rows.",
    "begin;",
    "update professionals",
    "set",
    "  phone_number = null,",
    "  whatsapp_number = null,",
    "  is_phone_verified = false,",
    "  is_active = false",
    "where id in (",
    idList,
    ");",
    "commit;",
  ].join("\n");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
