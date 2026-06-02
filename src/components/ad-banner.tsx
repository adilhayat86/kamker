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
        "flex min-h-20 items-center justify-center rounded-lg border border-dashed bg-white/70 px-4 py-5 text-center text-sm text-muted-foreground shadow-sm",
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
