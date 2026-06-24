export const cities = ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Peshawar"];

export const categories = [
  { name: "Nurses", icon: "heart", count: "0" },
  { name: "Doctors", icon: "stethoscope", count: "0" },
  { name: "Caregivers", icon: "stethoscope", count: "0" },
  { name: "Physiotherapists", icon: "heart", count: "0" },
  { name: "Lab Technicians", icon: "stethoscope", count: "0" },
  { name: "Maids", icon: "home", count: "0" },
  { name: "Housekeepers", icon: "home", count: "0" },
  { name: "Cleaners", icon: "sparkles", count: "0" },
  { name: "Cooks", icon: "chef", count: "0" },
  { name: "Babysitters", icon: "users", count: "0" },
  { name: "Gardeners", icon: "leaf", count: "0" },
  { name: "School Teachers", icon: "graduation", count: "0" },
  { name: "Home Tutors", icon: "home", count: "0" },
  { name: "Online Tutors", icon: "laptop", count: "0" },
  { name: "Quran Teachers", icon: "graduation", count: "0" },
  { name: "Handwriting Teachers", icon: "paintbrush", count: "0" },
  { name: "Training Instructors", icon: "graduation", count: "0" },
  { name: "Electricians", icon: "plug", count: "0" },
  { name: "Plumbers", icon: "wrench", count: "0" },
  { name: "AC Technicians", icon: "drill", count: "0" },
  { name: "Carpenters", icon: "hammer", count: "0" },
  { name: "Painters", icon: "palette", count: "0" },
  { name: "Welders", icon: "drill", count: "0" },
  { name: "Masons", icon: "hammer", count: "0" },
  { name: "Tile Setters", icon: "wrench", count: "0" },
  { name: "Construction Labor", icon: "users", count: "0" },
  { name: "Architects", icon: "pencil", count: "0" },
  { name: "Drivers", icon: "car", count: "0" },
  { name: "Delivery Riders", icon: "bike", count: "0" },
  { name: "Truck Drivers", icon: "car", count: "0" },
  { name: "Bus Drivers", icon: "car", count: "0" },
  { name: "Forklift/Crane Operators", icon: "wrench", count: "0" },
  { name: "Security Guards", icon: "shield", count: "0" },
  { name: "Bodyguards", icon: "shield", count: "0" },
  { name: "Beauticians", icon: "scissors", count: "0" },
  { name: "Barbers", icon: "scissors", count: "0" },
  { name: "Makeup Artists", icon: "palette", count: "0" },
  { name: "Skin Care Specialists", icon: "heart", count: "0" },
  { name: "Fitness Trainers", icon: "users", count: "0" },
  { name: "Chefs", icon: "chef", count: "0" },
  { name: "Bakers", icon: "chef", count: "0" },
  { name: "Waiters", icon: "contact", count: "0" },
  { name: "Catering Staff", icon: "contact", count: "0" },
  { name: "Event Organizers", icon: "contact", count: "0" },
  { name: "Event Staff", icon: "contact", count: "0" },
  { name: "Accountants", icon: "calculator", count: "0" },
  { name: "Bookkeepers/Munshi", icon: "calculator", count: "0" },
  { name: "Data Entry Operators", icon: "keyboard", count: "0" },
  { name: "Computer Operators", icon: "monitor", count: "0" },
  { name: "Admin Assistants", icon: "clipboard", count: "0" },
  { name: "Office Boys", icon: "briefcase", count: "0" },
  { name: "Customer Service Staff", icon: "contact", count: "0" },
  { name: "HR Staff", icon: "users", count: "0" },
  { name: "Sales Staff", icon: "briefcase", count: "0" },
  { name: "Web Developers", icon: "monitor", count: "0" },
  { name: "App Developers", icon: "monitor", count: "0" },
  { name: "Network Technicians", icon: "wrench", count: "0" },
  { name: "IT Support", icon: "monitor", count: "0" },
  { name: "Graphic Designers", icon: "pencil", count: "0" },
  { name: "Content Writers", icon: "fileText", count: "0" },
  { name: "Photographers", icon: "image", count: "0" },
  { name: "Videographers", icon: "image", count: "0" },
  { name: "Actors/Models", icon: "users", count: "0" },
  { name: "Musicians/Singers", icon: "contact", count: "0" },
  { name: "Editors/Journalists", icon: "fileText", count: "0" },
  { name: "Sound/Lighting Technicians", icon: "wrench", count: "0" },
  { name: "Car Mechanics", icon: "wrench", count: "0" },
  { name: "Auto Electricians", icon: "plug", count: "0" },
  { name: "Auto AC Mechanics", icon: "drill", count: "0" },
  { name: "Car Painters/Denters", icon: "palette", count: "0" },
  { name: "Car Wash/Detailing", icon: "sparkles", count: "0" },
  { name: "Tailors", icon: "scissors", count: "0" },
  { name: "Fashion Designers", icon: "scissors", count: "0" },
  { name: "Religious Scholars", icon: "graduation", count: "0" },
  { name: "Nikah Khawan/Qari", icon: "graduation", count: "0" },
  { name: "Lawyers/Legal Consultants", icon: "briefcase", count: "0" },
  { name: "Tax Consultants", icon: "calculator", count: "0" },
  { name: "Education Consultants", icon: "graduation", count: "0" },
  { name: "Medical Consultants", icon: "stethoscope", count: "0" },
];

export const categoryAliases: Record<string, string[]> = {
  Doctors: ["doctor", "physician", "general physician", "mbbs doctor", "clinic doctor", "medical doctor"],
  "Quran Teachers": ["qari", "hafiz", "tajweed teacher", "quran tutor"],
  "Religious Scholars": ["imam", "muezzin", "mullah", "mufti", "alim", "khateeb", "dawah", "preacher"],
  "Nikah Khawan/Qari": ["nikah khawan", "qari", "marriage officiant"],
  Drivers: ["taxi driver", "cab driver", "van driver", "car driver", "chauffeur", "driving instructor"],
  "Truck Drivers": ["truck driver", "dump truck driver", "tractor trailer driver", "tractor-trailer truck driver", "delivery service truck", "tractor operator"],
  "Bus Drivers": ["bus driver", "ticket taker"],
  "Forklift/Crane Operators": ["forklift driver", "fork lift driver", "crane operator", "tractor-crane operator", "equipment operator", "order picker"],
  "Delivery Riders": [
    "casual courier",
    "courier boy",
    "delivery boy",
    "parcel delivery",
    "rider",
    "postman",
    "dakia",
    "bicycle messenger",
    "pizza delivery",
    "milk man",
    "mail carrier",
    "dabba walla",
    "delivery service",
    "dispatcher",
    "cargo agent",
    "drayman",
    "porter",
    "baggage handler",
  ],
  Cooks: ["desi cook", "daigh cook", "tandoor wala", "private cook", "house cook", "chappati maker", "nan maker"],
  Chefs: ["chef", "executive chef", "head chef", "pizza chef", "specialist chef"],
  Bakers: ["baker", "cake designer", "bread baker", "pastry chef"],
  Maids: [
    "domestic worker",
    "maid",
    "home maid",
    "kaam wali",
    "kaam wali bai",
    "kaam wala",
    "kaam waly",
    "kaam wale",
    "kam wali",
    "kam wala",
    "ghar ka kaam",
    "house help",
    "home help",
    "masi",
    "maasi",
  ],
  Housekeepers: ["house keeper", "housekeeping attendant", "kaam wali", "kaam waly", "home help", "ghar ka kaam"],
  Cleaners: ["floor cleaner", "window cleaner", "sofa cleaner", "carpet cleaner", "tank cleaner", "dry cleaner", "safai wali", "safai wala", "cleaning lady"],
  Babysitters: ["nanny", "nannies", "baby sitter", "child care", "childcare", "aya", "ayah", "aaya", "child minder"],
  "Security Guards": ["atm guard", "gate security", "night guard", "night watchman", "gatekeeper", "crossing guard"],
  Bodyguards: ["body guard", "personal security"],
  Beauticians: ["female beautician", "male beautician", "beauty salon", "facial specialist", "skin care"],
  "Makeup Artists": ["make up artist", "makeup artist", "bridal makeup", "event makeup"],
  Barbers: ["hair stylist", "hair styling", "hair design"],
  "Fitness Trainers": ["gym trainer", "yoga trainer", "aerobics trainer"],
  "Graphic Designers": ["graphic artist", "illustrator", "multimedia artist", "cartoonist"],
  "Content Writers": ["creative writer", "script writer", "technical writer", "proof reader", "editor"],
  Photographers: ["wedding photographer", "fashion photographer", "freelance photographer", "camera man", "camera operator"],
  Videographers: ["cinematographer", "film maker", "video editor"],
  "Actors/Models": ["actor", "fashion model", "model", "dancer", "entertainer", "comedian", "magician"],
  "Musicians/Singers": ["musician", "guitarist", "pianist", "drummer", "singer", "violin player", "naat khawan"],
  "Editors/Journalists": ["journalist", "news editor", "print journalist", "online editor", "news analyst"],
  "Sound/Lighting Technicians": ["sound engineer", "sound technician", "lighting designer"],
  "Car Mechanics": ["auto mechanic", "automotive mechanic", "car mechanic", "motor mechanic", "motorcycle repairer", "brake specialist", "alignment technician"],
  "Auto Electricians": ["automotive electrician", "auto electrical", "tune up technician"],
  "Auto AC Mechanics": ["automotive air conditioning mechanic", "auto ac mechanic"],
  "Car Painters/Denters": ["car painter", "car denter", "denter", "paint sprayer"],
  "Car Wash/Detailing": ["car cleaner", "car detailing", "car polishing"],
  Accountants: ["accountant", "accounting manager", "accounting assistant", "auditor"],
  "Bookkeepers/Munshi": ["bookkeeper", "munshi", "accounting clerk"],
  "Data Entry Operators": ["data entry", "typist", "word processing", "transcriptionist"],
  "Computer Operators": ["computer operator", "computer worker"],
  "Customer Service Staff": ["csr", "call center", "call center operator", "inbound caller", "outbound caller"],
  "Office Boys": ["office boy", "peon", "qasid", "naib qasid"],
  "HR Staff": ["hr officer", "hr consultant", "recruiter", "staff trainer"],
  "Sales Staff": ["salesman", "sales clerk", "cashier", "telemarketer", "telephone sales"],
  "Web Developers": ["web developer", "web programmer", "php developer", "webmaster", "web administrator"],
  "App Developers": ["app developer", "android developer", "application developer", "software developer"],
  "Network Technicians": ["network administrator", "network engineer", "data center support"],
  "IT Support": ["support specialist", "it support", "computer support"],
  Plumbers: ["plumber", "pipe fitter"],
  Masons: ["mistri", "brick layer", "brick mason", "concrete finisher"],
  "Tile Setters": ["tile setter", "floor layer"],
  "Construction Labor": ["mazdur", "labourer", "laborer", "trades helper"],
  Architects: ["architect", "architectural designer", "architectural technician"],
  Painters: ["painter", "home painter", "painter and decorator"],
  Welders: ["welder", "black smith", "metal worker", "ironworker"],
  "AC Technicians": ["ac maintenance", "refrigeration technician", "air conditioning technician"],
  Tailors: ["tailor man", "tailor woman", "abaya tailor", "alterations"],
  "Fashion Designers": ["fashion designer", "fashion illustrator"],
  "Event Organizers": ["event organizer", "party organizer", "exhibition organizer", "event coordinator"],
  "Event Staff": ["event staff", "front of house", "kitchen staff", "banquet staff"],
  Waiters: ["waiter", "host", "hostess", "food server"],
  "Catering Staff": ["caterer", "corporate caterer", "event caterer", "hotel caterer"],
  "Lawyers/Legal Consultants": ["lawyer", "lawyers", "legal consultant", "legal consultants", "legal advisor", "advocate", "attorney"],
  "Tax Consultants": ["tax advisor", "tax accountant"],
  "Education Consultants": ["educational consultant", "theatre consultant"],
  "Medical Consultants": ["medical consultant"],
};

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

const serviceGroupSlugAliases: Record<string, string> = {
  education: "Education & Training",
  "home-repairs": "Home Repairs & Construction",
  "transport-security": "Transport & Delivery",
  "beauty-creative": "Beauty & Personal Care",
  "office-digital": "Office, Accounts & Support",
};

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
    description: "Doctors, nurses, caregivers, physiotherapists, lab technicians, and home health support.",
    subcategories: ["Doctors", "Nurses", "Caregivers", "Physiotherapists", "Lab Technicians"],
  },
  {
    name: "Domestic Help",
    icon: "home",
    description: "Maids, housekeepers, cleaners, cooks, babysitters, gardeners, and daily home support.",
    subcategories: ["Maids", "Housekeepers", "Cleaners", "Cooks", "Babysitters", "Gardeners"],
  },
  {
    name: "Education & Training",
    icon: "graduation",
    description: "School teachers, home tutors, online tutors, Quran teachers, handwriting teachers, and trainers.",
    subcategories: ["School Teachers", "Home Tutors", "Online Tutors", "Quran Teachers", "Handwriting Teachers", "Training Instructors"],
  },
  {
    name: "Home Repairs & Construction",
    icon: "wrench",
    description: "Electricians, plumbers, AC technicians, carpenters, painters, welders, masons, and construction support.",
    subcategories: ["Electricians", "Plumbers", "AC Technicians", "Carpenters", "Painters", "Welders", "Masons", "Tile Setters", "Construction Labor", "Architects"],
  },
  {
    name: "Transport & Delivery",
    icon: "car",
    description: "Drivers, delivery riders, truck drivers, bus drivers, and equipment operators.",
    subcategories: ["Drivers", "Delivery Riders", "Truck Drivers", "Bus Drivers", "Forklift/Crane Operators"],
  },
  {
    name: "Security",
    icon: "shield",
    description: "Security guards and bodyguards for homes, offices, events, and companies.",
    subcategories: ["Security Guards", "Bodyguards"],
  },
  {
    name: "Beauty & Personal Care",
    icon: "scissors",
    description: "Beauticians, barbers, makeup artists, skin care specialists, and fitness trainers.",
    subcategories: ["Beauticians", "Barbers", "Makeup Artists", "Skin Care Specialists", "Fitness Trainers"],
  },
  {
    name: "Food, Catering & Events",
    icon: "chef",
    description: "Chefs, bakers, waiters, catering staff, event organizers, and event staff.",
    subcategories: ["Chefs", "Bakers", "Waiters", "Catering Staff", "Event Organizers", "Event Staff"],
  },
  {
    name: "Office, Accounts & Support",
    icon: "briefcase",
    description: "Accounts, data entry, admin support, office staff, customer service, HR, and sales.",
    subcategories: ["Accountants", "Bookkeepers/Munshi", "Data Entry Operators", "Computer Operators", "Admin Assistants", "Office Boys", "Customer Service Staff", "HR Staff", "Sales Staff"],
  },
  {
    name: "IT & Digital",
    icon: "monitor",
    description: "Web developers, app developers, network technicians, IT support, designers, and writers.",
    subcategories: ["Web Developers", "App Developers", "Network Technicians", "IT Support", "Graphic Designers", "Content Writers"],
  },
  {
    name: "Arts & Media",
    icon: "palette",
    description: "Photographers, videographers, actors, models, musicians, singers, journalists, and media technicians.",
    subcategories: ["Photographers", "Videographers", "Actors/Models", "Musicians/Singers", "Editors/Journalists", "Sound/Lighting Technicians"],
  },
  {
    name: "Automobiles",
    icon: "car",
    description: "Car mechanics, auto electricians, auto AC mechanics, car painters, denters, and detailing workers.",
    subcategories: ["Car Mechanics", "Auto Electricians", "Auto AC Mechanics", "Car Painters/Denters", "Car Wash/Detailing"],
  },
  {
    name: "Clothing & Tailoring",
    icon: "scissors",
    description: "Tailors and fashion designers for alterations, stitched clothing, and design work.",
    subcategories: ["Tailors", "Fashion Designers"],
  },
  {
    name: "Religious Services",
    icon: "graduation",
    description: "Religious scholars, Quran support, and Nikah Khawan services.",
    subcategories: ["Religious Scholars", "Nikah Khawan/Qari"],
  },
  {
    name: "Consultants",
    icon: "briefcase",
    description: "Legal, tax, education, and medical consultants.",
    subcategories: ["Lawyers/Legal Consultants", "Tax Consultants", "Education Consultants", "Medical Consultants"],
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
  const aliasName = serviceGroupSlugAliases[slug];

  return serviceGroups.find(
    (group) => categorySlug(group.name) === slug || group.name === aliasName,
  );
}

export function findServiceGroupForCategory(categoryName: string) {
  return serviceGroups.find((group) => group.subcategories.includes(categoryName));
}

export function aliasesForCategory(categoryName: string) {
  return categoryAliases[categoryName] ?? [];
}

export function searchTermsForCategory(categoryName: string) {
  const group = findServiceGroupForCategory(categoryName);

  return [
    categoryName,
    categorySlug(categoryName),
    ...(group ? [group.name, categorySlug(group.name)] : []),
    ...aliasesForCategory(categoryName),
  ];
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
  age?: number | null;
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
  is_cnic_verified?: boolean;
  is_phone_verified?: boolean;
  profileHref?: string;
  is_company_managed?: boolean;
  company_id?: string | null;
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
    age: 29,
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
    age: 36,
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
    age: 31,
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
    age: 34,
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
    age: 42,
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
    age: 27,
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
    age: 39,
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
    age: 33,
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
    age: 32,
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
    age: 30,
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
    age: 35,
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
    age: 28,
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
    age: 22 + (index % 28),
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
