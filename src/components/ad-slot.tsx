import { Megaphone } from "lucide-react";

import { cn } from "@/lib/utils";

type AdSlotProps = {
  label: string;
  className?: string;
};

export function AdSlot({ label, className }: AdSlotProps) {
  return (
    <aside
      className={cn(
        "flex min-h-24 items-center justify-center rounded-lg border border-dashed bg-white/70 px-4 py-5 text-center text-sm text-muted-foreground",
        className,
      )}
      aria-label={label}
    >
      <div className="flex items-center gap-2">
        <Megaphone className="size-4" aria-hidden="true" />
        <span>{label}</span>
      </div>
    </aside>
  );
}
