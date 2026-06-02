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
    <div className="mt-4 grid grid-cols-2 gap-3 sm:mt-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {categories.map((category) => {
        const Icon =
          categoryIcons[category.icon as keyof typeof categoryIcons] ?? Wrench;

        return (
          <Card key={category.name} className="bg-white/90 shadow-sm">
            <CardContent className="p-4 sm:p-5">
              <div className="flex size-14 items-center justify-center rounded-md bg-accent text-accent-foreground">
                <Icon className="size-7" aria-hidden="true" />
              </div>
              <h3 className="mt-4 text-base font-semibold">{category.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {category.count} available
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
