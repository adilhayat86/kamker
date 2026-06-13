"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ProfilePhotoViewerProps = {
  src: string;
  alt: string;
  priority?: boolean;
  width?: number;
  height?: number;
  buttonClassName?: string;
  imageClassName?: string;
  overlayLabel?: string;
};

export function ProfilePhotoViewer({
  src,
  alt,
  priority = false,
  width = 128,
  height = 128,
  buttonClassName,
  imageClassName,
  overlayLabel = "View photo",
}: ProfilePhotoViewerProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "group relative shrink-0 overflow-hidden rounded-full bg-accent ring-2 ring-transparent transition hover:ring-primary focus:outline-none focus:ring-2 focus:ring-primary",
          buttonClassName ?? "size-28",
        )}
        aria-label="Open full profile photo"
      >
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          priority={priority}
          className={cn(
            "object-cover transition group-hover:scale-105",
            imageClassName ?? "size-28",
          )}
        />
        <span className="absolute inset-x-0 bottom-0 bg-black/55 px-2 py-1 text-[10px] font-semibold text-white opacity-0 transition group-hover:opacity-100 group-focus:opacity-100">
          {overlayLabel}
        </span>
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Full profile photo"
          onClick={() => setOpen(false)}
        >
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="absolute right-4 top-4 z-10 bg-white text-foreground hover:bg-white"
            onClick={(event) => {
              event.stopPropagation();
              setOpen(false);
            }}
            aria-label="Close profile photo"
          >
            <X className="size-5" aria-hidden="true" />
          </Button>
          <div className="relative max-h-[88vh] w-full max-w-3xl" onClick={(event) => event.stopPropagation()}>
            <Image
              src={src}
              alt={alt}
              width={1200}
              height={1200}
              className="mx-auto max-h-[88vh] w-auto rounded-xl object-contain shadow-2xl"
              sizes="100vw"
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
