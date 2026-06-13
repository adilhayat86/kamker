import Link from "next/link";
import {
  Bike,
  BriefcaseBusiness,
  Calculator,
  Car,
  ChefHat,
  ClipboardList,
  Contact,
  Drill,
  FileText,
  GraduationCap,
  Hammer,
  HeartPulse,
  Home,
  Image as ImageIcon,
  Keyboard,
  Leaf,
  Monitor,
  Paintbrush,
  Palette,
  PencilRuler,
  PlugZap,
  Scissors,
  ShieldCheck,
  Stethoscope,
  UserCheck,
  Users,
  Wrench,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { categorySlug } from "@/lib/marketplace-data";

type Category = {
  name: string;
  count: string;
  icon: string;
};

type CategoryGridProps = {
  categories: Category[];
  city?: string;
  area?: string;
};

const categoryIcons = {
  bike: Bike,
  briefcase: BriefcaseBusiness,
  calculator: Calculator,
  car: Car,
  chef: ChefHat,
  clipboard: ClipboardList,
  contact: Contact,
  drill: Drill,
  fileText: FileText,
  graduation: GraduationCap,
  hammer: Hammer,
  heart: HeartPulse,
  home: Home,
  image: ImageIcon,
  keyboard: Keyboard,
  leaf: Leaf,
  laptop: Monitor,
  monitor: Monitor,
  paintbrush: Paintbrush,
  palette: Palette,
  pencil: PencilRuler,
  plug: PlugZap,
  scissors: Scissors,
  shield: ShieldCheck,
  stethoscope: Stethoscope,
  userCheck: UserCheck,
  users: Users,
  wrench: Wrench,
};

function categoryHref(categoryName: string, city?: string, area?: string) {
  const params = new URLSearchParams();

  if (city) {
    params.set("city", city);
  }

  if (area) {
    params.set("area", area);
  }

  const query = params.toString();

  return `/categories/${categorySlug(categoryName)}${query ? `?${query}` : ""}`;
}

function categoryCountText(count: string) {
  const value = count.trim();

  if (!value || value === "0") {
    return "Browse professionals";
  }

  return `${value} available`;
}

export function CategoryGrid({ categories, city, area }: CategoryGridProps) {
  return (
    <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-7 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {categories.map((category) => {
        const Icon =
          categoryIcons[category.icon as keyof typeof categoryIcons] ?? Wrench;

        return (
          <Link
            key={category.name}
            href={categoryHref(category.name, city, area)}
            className="block h-full"
          >
            <Card className="h-full border-sky-100 bg-white shadow-sm transition-colors hover:border-primary/50 hover:bg-sky-50/40">
              <CardContent className="flex min-h-32 flex-col justify-between p-3.5 sm:min-h-40 sm:p-5">
                <div>
                  <div className="flex size-11 items-center justify-center rounded-md bg-accent text-primary shadow-sm sm:size-14">
                    <Icon className="size-6 sm:size-7" aria-hidden="true" />
                  </div>
                  <h3 className="mt-3 min-h-9 text-sm font-semibold leading-tight sm:mt-4 sm:text-base">
                    {category.name}
                  </h3>
                </div>
                <p className="mt-2 text-xs text-muted-foreground sm:mt-3 sm:text-sm">
                  {categoryCountText(category.count)}
                </p>
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
