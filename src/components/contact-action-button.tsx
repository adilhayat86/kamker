"use client";

import { useState } from "react";
import { MessageCircle, Phone } from "lucide-react";

import { Button } from "@/components/ui/button";

type ContactActionButtonProps = {
  href: string | null | undefined;
  displayValue: string | null | undefined;
  type: "call" | "whatsapp";
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  disabledLabel?: string;
};

export function ContactActionButton({
  href,
  displayValue,
  type,
  className,
  variant = "outline",
  disabledLabel,
}: ContactActionButtonProps) {
  const [copied, setCopied] = useState(false);
  const Icon = type === "call" ? Phone : MessageCircle;
  const mobileLabel = type === "call" ? "Call" : "WhatsApp";
  const desktopLabel = type === "call" ? "Call" : "WhatsApp";
  const copyLabel = copied
    ? "Copied"
    : displayValue
      ? `${desktopLabel}: ${displayValue}`
      : disabledLabel ?? mobileLabel;
  const canUse = Boolean(href && displayValue);

  async function copyNumber() {
    if (!displayValue) {
      return;
    }

    try {
      await navigator.clipboard.writeText(displayValue);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      window.prompt("Copy this number", displayValue);
    }
  }

  return (
    <>
      <Button
        asChild={canUse}
        variant={variant}
        className={`${className ?? ""} sm:hidden`}
        disabled={!canUse}
      >
        {canUse ? (
          <a href={href ?? undefined}>
            <Icon aria-hidden="true" />
            {mobileLabel}
          </a>
        ) : (
          <span>
            <Icon aria-hidden="true" />
            {disabledLabel ?? mobileLabel}
          </span>
        )}
      </Button>
      <Button
        type="button"
        variant={variant}
        className={`${className ?? ""} hidden sm:inline-flex`}
        disabled={!displayValue}
        onClick={copyNumber}
        title={displayValue ? `Click to copy ${displayValue}` : undefined}
      >
        <Icon aria-hidden="true" />
        <span className="max-w-[13rem] truncate">
          {copyLabel}
        </span>
      </Button>
    </>
  );
}
