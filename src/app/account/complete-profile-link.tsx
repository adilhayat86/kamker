"use client";

import Link from "next/link";
import { useState } from "react";
import { Edit, Loader2 } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CompleteProfileLinkProps = {
  label: string;
  className?: string;
  variant?: "default" | "secondary" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
};

export function CompleteProfileLink({
  label,
  className,
  variant = "default",
  size = "default",
}: CompleteProfileLinkProps) {
  const [pending, setPending] = useState(false);

  return (
    <Link
      href="/account/edit"
      aria-busy={pending}
      aria-disabled={pending}
      className={cn(
        buttonVariants({ variant, size, className }),
        pending ? "pointer-events-none opacity-80" : "",
      )}
      onClick={() => setPending(true)}
    >
      {pending ? (
        <Loader2 className="animate-spin" aria-hidden="true" />
      ) : (
        <Edit aria-hidden="true" />
      )}
      {pending ? "Opening profile..." : label}
    </Link>
  );
}
