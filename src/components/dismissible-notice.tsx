"use client";

import { useState, type ReactNode } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type DismissibleNoticeProps = {
  children: ReactNode;
  className?: string;
  contentClassName?: string;
  closeLabel?: string;
};

export function DismissibleNotice({
  children,
  className,
  contentClassName,
  closeLabel = "Close notice",
}: DismissibleNoticeProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return null;
  }

  return (
    <div className={cn("relative", className)}>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={closeLabel}
        className="absolute right-2 top-2 size-8 text-current opacity-70 hover:bg-black/5 hover:opacity-100"
        onClick={() => setIsVisible(false)}
      >
        <X className="size-4" aria-hidden="true" />
      </Button>
      <div className={cn("pr-9", contentClassName)}>{children}</div>
    </div>
  );
}

type DismissibleCardProps = DismissibleNoticeProps & {
  cardContentClassName?: string;
};

export function DismissibleCard({
  children,
  className,
  contentClassName,
  cardContentClassName,
  closeLabel = "Close notice",
}: DismissibleCardProps) {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) {
    return null;
  }

  return (
    <Card className={className}>
      <CardContent className={cn("relative", cardContentClassName)}>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={closeLabel}
          className="absolute right-2 top-2 size-8 text-current opacity-70 hover:bg-black/5 hover:opacity-100"
          onClick={() => setIsVisible(false)}
        >
          <X className="size-4" aria-hidden="true" />
        </Button>
        <div className={cn("pr-9", contentClassName)}>{children}</div>
      </CardContent>
    </Card>
  );
}
