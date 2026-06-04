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
        "flex min-h-16 items-center justify-center rounded-lg border border-dashed border-border/70 bg-muted/30 px-4 py-4 text-center text-xs text-muted-foreground/80",
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
