export const cities = ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Peshawar"];

export const categories = [
  { name: "Nurses", icon: "heart", count: "2,451" },
  { name: "Maids", icon: "home", count: "1,892" },
  { name: "Drivers", icon: "car", count: "3,210" },
  { name: "Teachers", icon: "graduation", count: "2,870" },
  { name: "School Teachers", icon: "graduation", count: "1,146" },
  { name: "Online Tutors", icon: "laptop", count: "1,325" },
  { name: "Electricians", icon: "plug", count: "1,342" },
  { name: "Plumbers", icon: "wrench", count: "1,118" },
  { name: "Security Guards", icon: "shield", count: "968" },
  { name: "Beauticians", icon: "scissors", count: "1,537" },
  { name: "Handwriting Teachers", icon: "paintbrush", count: "412" },
  { name: "Tutors", icon: "graduation", count: "2,690" },
  { name: "Home Tutors", icon: "home", count: "1,884" },
  { name: "Quran Teachers", icon: "graduation", count: "1,260" },
  { name: "Cooks", icon: "chef", count: "1,438" },
  { name: "Office Boys", icon: "briefcase", count: "721" },
  { name: "Peons", icon: "userCheck", count: "604" },
  { name: "Admin Assistants", icon: "clipboard", count: "488" },
  { name: "Gardeners", icon: "leaf", count: "539" },
  { name: "Carpenters", icon: "hammer", count: "826" },
  { name: "AC Technicians", icon: "drill", count: "1,176" },
  { name: "AC Maintenance", icon: "drill", count: "918" },
  { name: "Mechanics", icon: "wrench", count: "934" },
  { name: "Painters", icon: "palette", count: "745" },
  { name: "Welders", icon: "drill", count: "383" },
  { name: "Tailors", icon: "scissors", count: "1,024" },
  { name: "Babysitters", icon: "users", count: "692" },
  { name: "Caregivers", icon: "stethoscope", count: "864" },
  { name: "Physiotherapists", icon: "heart", count: "298" },
  { name: "Lab Technicians", icon: "stethoscope", count: "344" },
  { name: "Artists", icon: "palette", count: "571" },
  { name: "Graphic Designers", icon: "pencil", count: "783" },
  { name: "Content Writers", icon: "fileText", count: "526" },
  { name: "Photographers", icon: "image", count: "649" },
  { name: "Event Staff", icon: "contact", count: "902" },
  { name: "Delivery Riders", icon: "bike", count: "1,715" },
  { name: "Data Entry", icon: "keyboard", count: "642" },
  { name: "Accountants", icon: "calculator", count: "571" },
  { name: "Computer Operators", icon: "monitor", count: "704" },
];

export type MarketplaceCategory = (typeof categories)[number];

export type ServiceGroup = {
  name: string;
  icon: string;
  description: string;
  subcategories: string[];
};

export function categorySlug(name: string) {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function categoryCountValue(count: string) {
  return Number(count.replace(/,/g, "")) || 0;
}

function categoryByName(name: string) {
  return categories.find((category) => category.name === name);
}

function groupCountValue(subcategories: string[]) {
  return subcategories.reduce((total, subcategory) => {
    const category = categoryByName(subcategory);

    return total + (category ? categoryCountValue(category.count) : 0);
  }, 0);
}

export function formatCount(value: number) {
  return value.toLocaleString("en-US");
}

export const serviceGroups: ServiceGroup[] = [
  {
    name: "Healthcare",
    icon: "stethoscope",
    description: "Nurses, caregivers, physiotherapists, lab technicians, and home health support.",
    subcategories: ["Nurses", "Caregivers", "Physiotherapists", "Lab Technicians"],
  },
  {
    name: "Domestic Help",
    icon: "home",
    description: "Maids, cooks, babysitters, gardeners, and daily home support staff.",
    subcategories: ["Maids", "Cooks", "Babysitters", "Gardeners"],
  },
  {
    name: "Education",
    icon: "graduation",
    description: "School teachers, online tutors, Quran teachers, home tutors, and handwriting teachers.",
    subcategories: ["Teachers", "School Teachers", "Tutors", "Online Tutors", "Home Tutors", "Quran Teachers", "Handwriting Teachers"],
  },
  {
    name: "Home Repairs",
    icon: "wrench",
    description: "Electricians, plumbers, AC maintenance, carpenters, painters, welders, and mechanics.",
    subcategories: ["Electricians", "Plumbers", "AC Technicians", "AC Maintenance", "Carpenters", "Painters", "Welders", "Mechanics"],
  },
  {
    name: "Transport & Security",
    icon: "car",
    description: "Drivers, delivery riders, guards, office boys, peons, and admin assistants.",
    subcategories: ["Drivers", "Delivery Riders", "Security Guards", "Office Boys", "Peons", "Admin Assistants"],
  },
  {
    name: "Beauty & Creative",
    icon: "palette",
    description: "Beauticians, artists, graphic designers, content writers, photographers, event staff, and tailors.",
    subcategories: ["Beauticians", "Artists", "Graphic Designers", "Content Writers", "Photographers", "Event Staff", "Tailors"],
  },
  {
    name: "Office & Digital",
    icon: "monitor",
    description: "Data entry, accountants, computer operators, content writers, and admin support.",
    subcategories: ["Data Entry", "Accountants", "Computer Operators", "Admin Assistants", "Content Writers", "Graphic Designers"],
  },
];

export const parentCategories = serviceGroups.map((group) => ({
  name: group.name,
  icon: group.icon,
  count: formatCount(groupCountValue(group.subcategories)),
  description: group.description,
}));

export function findCategoryBySlug(slug: string) {
  return categories.find((category) => categorySlug(category.name) === slug);
}

export function findServiceGroupBySlug(slug: string) {
  return serviceGroups.find((group) => categorySlug(group.name) === slug);
}

export function findServiceGroupForCategory(categoryName: string) {
  return serviceGroups.find((group) => group.subcategories.includes(categoryName));
}

export function getGroupSubcategoryCards(group: ServiceGroup) {
  return group.subcategories
    .map((subcategoryName) => categoryByName(subcategoryName))
    .filter((category): category is MarketplaceCategory => Boolean(category));
}

export type Professional = {
  id: string;
  name: string;
  role: string;
  city: string;
  area: string;
  gender: string;
  availability: string;
  rating: string;
  ratingCount: string;
  experience: string;
  rate: string;
  tagline: string;
  bio: string;
  responseTime: string;
  image: string;
  is_featured: boolean;
  featured_until: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  profileHref?: string;
  is_company_managed?: boolean;
  company_name?: string | null;
  company_verified?: boolean;
};

const curatedProfessionals: Professional[] = [
  {
    id: "maryam-safdar",
    name: "Maryam Safdar",
    role: "Beautician",
    city: "Rawalpindi",
    area: "Saddar",
    gender: "Female",
    availability: "Full Time",
    rating: "4.9",
    ratingCount: "184 reviews",
    experience: "5 years experience",
    rate: "From Rs. 3,500/session",
    tagline: "Elegant event makeup",
    bio: "Home and event beautician for makeup, hair styling, and party looks.",
    responseTime: "Replies in 12 min",
    image: "/avatars/pro-1.svg",
    is_featured: true,
    featured_until: "2030-12-31",
  },
  {
    id: "bilal-ahmed",
    name: "Bilal Ahmed",
    role: "Driver",
    city: "Karachi",
    area: "Gulshan-e-Iqbal",
    gender: "Male",
    availability: "Full Time",
    rating: "4.8",
    ratingCount: "231 reviews",
    experience: "8 years experience",
    rate: "From Rs. 2,000/day",
    tagline: "Reliable city driver",
    bio: "Experienced city and intercity driver with clean vehicle handling record.",
    responseTime: "Replies in 8 min",
    image: "/avatars/pro-2.svg",
    is_featured: true,
    featured_until: "2030-12-31",
  },
  {
    id: "hafsa-rehman",
    name: "Hafsa Rehman",
    role: "Quran Teacher",
    city: "Lahore",
    area: "Johar Town",
    gender: "Female",
    availability: "Part Time Evening",
    rating: "5.0",
    ratingCount: "96 reviews",
    experience: "6 years experience",
    rate: "From Rs. 8,000/month",
    tagline: "Patient Quran teacher",
    bio: "Quran teacher for children and women with tajweed and basic Islamic studies.",
    responseTime: "Replies in 20 min",
    image: "/avatars/pro-3.svg",
    is_featured: true,
    featured_until: "2030-12-31",
  },
  {
    id: "ayesha-noor",
    name: "Ayesha Noor",
    role: "Home Nurse",
    city: "Islamabad",
    area: "G-10",
    gender: "Female",
    availability: "Full Time",
    rating: "4.9",
    ratingCount: "143 reviews",
    experience: "7 years experience",
    rate: "From Rs. 2,500/day",
    tagline: "Trusted elderly caregiver",
    bio: "Home nurse for elderly care, medication support, and post-operative care.",
    responseTime: "Replies in 15 min",
    image: "/avatars/pro-4.svg",
    is_featured: true,
    featured_until: "2030-12-31",
  },
  {
    id: "rashid-khan",
    name: "Rashid Khan",
    role: "Electrician",
    city: "Peshawar",
    area: "University Road",
    gender: "Male",
    availability: "Full Time",
    rating: "4.7",
    ratingCount: "118 reviews",
    experience: "10 years experience",
    rate: "From Rs. 1,200/visit",
    tagline: "Emergency wiring expert",
    bio: "Electrician for wiring, switchboards, fans, lights, and emergency repairs.",
    responseTime: "Replies in 10 min",
    image: "/avatars/pro-5.svg",
    is_featured: true,
    featured_until: "2030-12-31",
  },
  {
    id: "sana-tariq",
    name: "Sana Tariq",
    role: "Home Tutor",
    city: "Faisalabad",
    area: "Madina Town",
    gender: "Female",
    availability: "Part Time Evening",
    rating: "4.9",
    ratingCount: "205 reviews",
    experience: "4 years experience",
    rate: "From Rs. 12,000/month",
    tagline: "Focused home tutor",
    bio: "Home tutor for primary and middle school students, focused on Maths and English.",
    responseTime: "Replies in 18 min",
    image: "/avatars/pro-6.svg",
    is_featured: true,
    featured_until: "2030-12-31",
  },
  {
    id: "imran-shah",
    name: "Imran Shah",
    role: "Plumber",
    city: "Karachi",
    area: "North Nazimabad",
    gender: "Male",
    availability: "Full Time",
    rating: "4.6",
    ratingCount: "87 reviews",
    experience: "9 years experience",
    rate: "From Rs. 1,500/visit",
    tagline: "Fast leakage repairs",
    bio: "Plumbing repairs for kitchens, bathrooms, water lines, and urgent leakage issues.",
    responseTime: "Replies in 25 min",
    image: "/avatars/pro-2.svg",
    is_featured: false,
    featured_until: null,
  },
  {
    id: "nadia-farooq",
    name: "Nadia Farooq",
    role: "Caregiver",
    city: "Lahore",
    area: "Model Town",
    gender: "Female",
    availability: "Part Time Morning",
    rating: "4.8",
    ratingCount: "74 reviews",
    experience: "6 years experience",
    rate: "From Rs. 2,800/day",
    tagline: "Kind home caregiver",
    bio: "Caregiver for elderly support, personal assistance, and daytime home care.",
    responseTime: "Replies in 22 min",
    image: "/avatars/pro-4.svg",
    is_featured: false,
    featured_until: null,
  },
  {
    id: "farzana-bibi",
    name: "Farzana Bibi",
    role: "Nurse",
    city: "Peshawar",
    area: "Hayatabad",
    gender: "Female",
    availability: "Full Time",
    rating: "4.8",
    ratingCount: "67 reviews",
    experience: "6 years experience",
    rate: "From Rs. 2,200/day",
    tagline: "Elderly care nurse",
    bio: "Home nurse for elderly support, injections, medicine reminders, and patient care.",
    responseTime: "Replies in 14 min",
    image: "/avatars/pro-4.svg",
    is_featured: false,
    featured_until: null,
  },
  {
    id: "shazia-rafiq",
    name: "Shazia Rafiq",
    role: "Nurse",
    city: "Lahore",
    area: "DHA",
    gender: "Female",
    availability: "Part Time Morning",
    rating: "4.7",
    ratingCount: "82 reviews",
    experience: "5 years experience",
    rate: "From Rs. 2,000/day",
    tagline: "Patient home care",
    bio: "Home nursing support for routine care, vitals checking, and post-treatment assistance.",
    responseTime: "Replies in 18 min",
    image: "/avatars/pro-3.svg",
    is_featured: false,
    featured_until: null,
  },
  {
    id: "asma-khan",
    name: "Asma Khan",
    role: "Nurse",
    city: "Karachi",
    area: "Gulistan-e-Johar",
    gender: "Female",
    availability: "Full Time",
    rating: "4.9",
    ratingCount: "104 reviews",
    experience: "8 years experience",
    rate: "From Rs. 2,500/day",
    tagline: "Trusted patient care",
    bio: "Experienced home nurse for elderly care, recovery support, and daily patient assistance.",
    responseTime: "Replies in 11 min",
    image: "/avatars/pro-1.svg",
    is_featured: false,
    featured_until: null,
  },
  {
    id: "rubina-akhtar",
    name: "Rubina Akhtar",
    role: "Nurse",
    city: "Rawalpindi",
    area: "Satellite Town",
    gender: "Female",
    availability: "Part Time Evening",
    rating: "4.6",
    ratingCount: "58 reviews",
    experience: "4 years experience",
    rate: "From Rs. 1,800/day",
    tagline: "Gentle nursing care",
    bio: "Part-time nurse for basic patient care, medicine reminders, and family support.",
    responseTime: "Replies in 24 min",
    image: "/avatars/pro-6.svg",
    is_featured: false,
    featured_until: null,
  },
];

const mockFirstNames = [
  "Amina",
  "Bilal",
  "Sadia",
  "Usman",
  "Nadia",
  "Farhan",
  "Hina",
  "Tariq",
  "Rabia",
  "Kashif",
];

const mockLastNames = [
  "Ahmed",
  "Khan",
  "Raza",
  "Malik",
  "Sheikh",
  "Ali",
  "Iqbal",
  "Hussain",
  "Yousaf",
  "Akhtar",
];

const mockAreasByCity: Record<string, string[]> = {
  Karachi: ["Gulshan-e-Iqbal", "North Nazimabad", "DHA"],
  Lahore: ["Johar Town", "Model Town", "DHA"],
  Islamabad: ["G-10", "F-8", "I-8"],
  Rawalpindi: ["Saddar", "Satellite Town", "Bahria Town"],
  Peshawar: ["Hayatabad", "University Road", "Saddar"],
};

function mockRateForCategory(categoryName: string, index: number) {
  const lowerName = categoryName.toLowerCase();

  if (lowerName.includes("teacher") || lowerName.includes("tutor")) {
    return `From Rs. ${(8000 + index * 500).toLocaleString("en-PK")}/month`;
  }

  if (lowerName.includes("nurse") || lowerName.includes("caregiver") || lowerName.includes("babysitter")) {
    return `From Rs. ${(1800 + index * 100).toLocaleString("en-PK")}/day`;
  }

  if (lowerName.includes("beautician") || lowerName.includes("artist") || lowerName.includes("photographer")) {
    return `From Rs. ${(2500 + index * 150).toLocaleString("en-PK")}/session`;
  }

  return `Rs ${(450 + index * 25).toLocaleString("en-PK")}/hour`;
}

const categoryCoverageProfessionals: Professional[] = categories.map((category, index) => {
  const city = cities[index % cities.length];
  const cityAreas = mockAreasByCity[city] ?? ["Central Area"];
  const years = 2 + (index % 9);
  const name = `${mockFirstNames[index % mockFirstNames.length]} ${mockLastNames[(index + 3) % mockLastNames.length]}`;
  const isFeatured = index % 4 === 0;

  return {
    id: `mock-${categorySlug(category.name)}`,
    name,
    role: category.name,
    city,
    area: cityAreas[index % cityAreas.length],
    gender: index % 3 === 0 ? "Female" : "Male",
    availability: index % 2 === 0 ? "Full Time" : "Part Time Evening",
    rating: (4.5 + (index % 5) / 10).toFixed(1),
    ratingCount: `${40 + index * 7} reviews`,
    experience: `${years} years experience`,
    rate: mockRateForCategory(category.name, index),
    tagline: `Trusted ${category.name.toLowerCase()}`.slice(0, 30),
    bio: `Mock ${category.name.toLowerCase()} profile for Kamker demo browsing, city/category testing, and marketplace layout review.`,
    responseTime: `Replies in ${10 + (index % 9) * 3} min`,
    image: `/avatars/pro-${(index % 6) + 1}.svg`,
    is_featured: isFeatured,
    featured_until: isFeatured ? "2030-12-31" : null,
    phone: `03${String(100000000 + index * 13791).slice(0, 9)}`,
    whatsapp: `923${String(100000000 + index * 13791).slice(0, 9)}`,
  };
});

export const recentProfessionals: Professional[] = [
  ...curatedProfessionals,
  ...categoryCoverageProfessionals,
];

export function isActiveFeaturedProfessional(
  professional: Professional,
  now = new Date(),
) {
  return (
    professional.is_featured &&
    Boolean(professional.featured_until) &&
    new Date(professional.featured_until as string) > now
  );
}

export function getActiveFeaturedProfessionals(limit?: number) {
  const featured = recentProfessionals.filter((professional) =>
    isActiveFeaturedProfessional(professional),
  );

  return typeof limit === "number" ? featured.slice(0, limit) : featured;
}
