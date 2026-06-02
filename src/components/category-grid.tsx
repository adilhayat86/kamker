import {
  Bike,
  BriefcaseBusiness,
  Car,
  ChefHat,
  Contact,
  Drill,
  GraduationCap,
  Hammer,
  HeartPulse,
  Home,
  Image as ImageIcon,
  Leaf,
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

type Category = {
  name: string;
  count: string;
  icon: string;
};

type CategoryGridProps = {
  categories: Category[];
};

const categoryIcons = {
  bike: Bike,
  briefcase: BriefcaseBusiness,
  car: Car,
  chef: ChefHat,
  contact: Contact,
  drill: Drill,
  graduation: GraduationCap,
  hammer: Hammer,
  heart: HeartPulse,
  home: Home,
  image: ImageIcon,
  leaf: Leaf,
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

export function CategoryGrid({ categories }: CategoryGridProps) {
  return (
    <div className="mt-5 grid grid-cols-2 gap-3 sm:mt-7 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {categories.map((category) => {
        const Icon =
          categoryIcons[category.icon as keyof typeof categoryIcons] ?? Wrench;

        return (
          <Card key={category.name} className="h-full bg-white/95 shadow-sm">
            <CardContent className="flex min-h-36 flex-col justify-between p-4 sm:min-h-40 sm:p-5">
              <div>
                <div className="flex size-12 items-center justify-center rounded-md bg-accent text-accent-foreground sm:size-14">
                  <Icon className="size-6 sm:size-7" aria-hidden="true" />
                </div>
                <h3 className="mt-4 min-h-10 text-sm font-semibold leading-tight sm:text-base">
                  {category.name}
                </h3>
              </div>
              <p className="mt-3 text-xs text-muted-foreground sm:text-sm">
                {category.count} available
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
