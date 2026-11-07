"use client";

import Link from "next/link";
import { useState, type ComponentProps } from "react";

type NavigationLinkProps = Omit<ComponentProps<typeof Link>, "prefetch">;

// Warm the route when a visitor intends to open it, rather than fetching every card.
export function NavigationLink({
  onPointerEnter,
  onFocus,
  onTouchStart,
  ...props
}: NavigationLinkProps) {
  const [intent, setIntent] = useState(false);

  return (
    <Link
      {...props}
      prefetch={intent ? null : false}
      onPointerEnter={(event) => {
        setIntent(true);
        onPointerEnter?.(event);
      }}
      onFocus={(event) => {
        setIntent(true);
        onFocus?.(event);
      }}
      onTouchStart={(event) => {
        setIntent(true);
        onTouchStart?.(event);
      }}
    />
  );
}
