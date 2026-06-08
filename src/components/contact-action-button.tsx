"use client";

import { useState } from "react";
import { ExternalLink, MessageCircle, Phone } from "lucide-react";

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
  const [revealed, setRevealed] = useState(false);
  const Icon = type === "call" ? Phone : MessageCircle;
  const mobileLabel = type === "call" ? "Call" : "WhatsApp";
  const desktopLabel = type === "call" ? "Show number" : "Show WhatsApp";
  const revealedLabel = type === "call" ? "Call number" : "WhatsApp number";
  const canUse = Boolean(href && displayValue);
  const directHref = unwrapTrackedHref(href);

  async function copyNumber() {
    if (!displayValue) {
      return;
    }

    setRevealed(true);

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
      <div className="hidden min-w-0 sm:flex sm:flex-col sm:gap-1.5">
        <Button
          type="button"
          variant={variant}
          className={`${className ?? ""} w-full`}
          disabled={!displayValue}
          onClick={copyNumber}
          title={displayValue ? `Show and copy ${displayValue}` : undefined}
        >
          <Icon aria-hidden="true" />
          <span className="max-w-[13rem] truncate">
            {copied ? "Copied" : revealed ? revealedLabel : desktopLabel}
          </span>
        </Button>
        {revealed && displayValue ? (
          <div className="rounded-md border bg-white p-2 text-xs leading-5 text-foreground shadow-sm">
            <p className="font-semibold">{displayValue}</p>
            <div className="mt-1 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
              <button
                type="button"
                className="font-medium text-primary hover:underline"
                onClick={copyNumber}
              >
                {copied ? "Copied" : "Copy"}
              </button>
              {type === "whatsapp" && directHref ? (
                <a
                  className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                  href={directHref}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open WhatsApp
                  <ExternalLink className="size-3" aria-hidden="true" />
                </a>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </>
  );
}

function unwrapTrackedHref(href: string | null | undefined) {
  if (!href) {
    return null;
  }

  if (href.startsWith("https://wa.me/")) {
    return href;
  }

  if (!href.startsWith("/api/analytics/contact")) {
    return href;
  }

  try {
    const url = new URL(href, "https://kamker.local");
    const destination = url.searchParams.get("href");

    return destination?.startsWith("https://wa.me/") ? destination : href;
  } catch {
    return href;
  }
}
