import { Megaphone } from "lucide-react";

import { cn } from "@/lib/utils";

type AdBannerProps = {
  label: string;
  className?: string;
};

export function AdBanner({ label, className }: AdBannerProps) {
  return (
    <aside
      aria-label={label}
      className={cn(
        "kamker-ad-slot flex min-h-[100px] w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-sky-200 bg-sky-50/60 px-4 py-4 text-center text-xs text-sky-700/80 md:min-h-[120px]",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <Megaphone className="size-4" aria-hidden="true" />
        <span>{label}</span>
      </div>
    </aside>
  );
}
