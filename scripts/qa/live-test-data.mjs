export function buildLiveTestData() {
  const stamp = Date.now();
  const suffix = String(stamp).slice(-7);
  const workerPhone = `0301${suffix}`;
  const customerPhone = `0302${suffix}`;
  const companyPhone = `0303${suffix}`;
  const requirementPhone = `0304${suffix}`;

  return {
    generatedAt: new Date(stamp).toISOString(),
    note:
      "Use these values for visible production QA. Keep names/descriptions prefixed with Admin Test so final cleanup can remove them safely.",
    worker: {
      route: "/register/professional",
      expectedRedirect: "/account?status=registered",
      fields: {
        fullName: `Admin Test Worker Nurse Lahore ${suffix}`,
        phone: workerPhone,
        whatsapp: "3005314191",
        city: "Lahore",
        area: "Model Town",
        gender: "Female",
        age: "29",
        category: "Nurses",
        availabilityTime: "morning",
        availabilityDays: "weekdays",
        yearsExperience: "5",
        rate: "900",
        tagline: "Trusted home nurse",
        experience: "5 years home nursing and elderly care",
        bio: `Admin Test Worker Nurse Lahore ${suffix}. Handles home nursing, elderly care, and patient support.`,
        cnic: "",
        password: `Kamker${suffix}!`,
        secretQuestion: "What is your first school name?",
        secretAnswer: `school${suffix}`,
      },
      duplicatePhoneCheck: {
        phoneSameAsWorkerAlternateFormat: workerPhone.replace(/^0/, "+92"),
        expected: "Second worker registration should be blocked after phone ownership migration is applied.",
      },
    },
    customer: {
      route: "/register/customer",
      expectedRedirectOrStatus: "Customer success state",
      fields: {
        fullName: `Admin Test Customer Lahore ${suffix}`,
        phone: customerPhone,
        city: "Lahore",
        area: "Model Town",
      },
    },
    requirement: {
      route: "/send-requirement?category=Nurses&city=Lahore&source=qa-live",
      expectedRedirectOrStatus: "Requirement submitted success state",
      fields: {
        service: "Nurses",
        city: "Lahore",
        area: "Model Town",
        availability: "Full Time",
        budget: "5000",
        urgency: "Today",
        phone: requirementPhone,
        whatsapp: "3005314191",
        details: `Admin Test Requirement Nurse Lahore ${suffix}. Need home nurse today for patient care in Model Town.`,
      },
    },
    company: {
      route: "/register/company",
      expectedRedirect: "/companies/[id]/packages",
      fields: {
        companyName: `Admin Test Company Lahore ${suffix}`,
        category: "Nursing Agency",
        city: "Lahore",
        area: "Gulberg",
        contactPerson: `Admin Test Manager ${suffix}`,
        phone: companyPhone,
        whatsapp: "3005314191",
        licenseNumber: `QA-${suffix}`,
        description: `Admin Test Company Lahore ${suffix}. Adds multiple verified staff profiles according to package limits.`,
      },
    },
    companyStaff: {
      route: "/companies/[id]/listings/new",
      expectedRedirectOrStatus: "Staff profile saved/published for review or public listing according to package status",
      fields: {
        title: `Admin Test Staff Nurse Lahore ${suffix}`,
        serviceGroup: "Healthcare",
        category: "Nurses",
        city: "Lahore",
        area: "Model Town",
        tagline: "Reliable home nurse",
        gender: "Female",
        age: "31",
        availability: "Full Time",
        yearsExperience: "6",
        hourlyRate: "950",
        monthlyRate: "65000",
        phone: companyPhone,
        whatsapp: "3005314191",
        description: `Admin Test Staff Nurse Lahore ${suffix}. Company-managed nurse available for home patient support.`,
      },
    },
    browserHelper: {
      command:
        "Load scripts/qa/browser-form-fill-snippet.js in the Codex browser session, then call kamkerSetFields(<fields object>) on each route.",
    },
  };
}
