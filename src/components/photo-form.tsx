"use client";

import { createContext, useContext, useState, type ComponentProps, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const PhotoContext = createContext<{
  busy: boolean;
  setBusy: (value: boolean) => void;
  hasPendingPhoto: boolean;
  setHasPendingPhoto: (value: boolean) => void;
}>({
  busy: false,
  setBusy: () => {},
  hasPendingPhoto: false,
  setHasPendingPhoto: () => {},
});
export function usePhotoUpload() {
  return useContext(PhotoContext);
}

export function PhotoForm({ children, onSubmit, ...props }: ComponentProps<"form">) {
  const [busy, setBusy] = useState(false);
  const [hasPendingPhoto, setHasPendingPhoto] = useState(false);
  return (
    <PhotoContext.Provider value={{ busy, setBusy, hasPendingPhoto, setHasPendingPhoto }}>
      <form {...props} onSubmit={event => {
        if (busy) event.preventDefault();
        else onSubmit?.(event);
      }}>
        {children}
      </form>
    </PhotoContext.Provider>
  );
}

export function PhotoSaveButton({ children = "Save photo", disabled, requirePhoto = false, ...props }: ComponentProps<typeof Button> & { requirePhoto?: boolean }) {
  const { busy, hasPendingPhoto } = usePhotoUpload();
  const { pending } = useFormStatus();
  return (
    <Button {...props} type="submit" disabled={disabled || busy || pending || (requirePhoto && !hasPendingPhoto)} aria-busy={pending || busy}>
      {pending ? "Saving..." : busy ? "Wait for photo upload..." : children}
    </Button>
  );
}

export function PhotoSkipLink({ href, children = "Skip for now" }: { href: string; children?: ReactNode }) {
  const { busy, hasPendingPhoto } = usePhotoUpload();
  const { pending } = useFormStatus();
  // A selected/uploaded photo must be saved before leaving this step.
  if (busy || pending || hasPendingPhoto) return null;
  return <Link href={href} className="block rounded-md border px-4 py-3 text-center text-sm font-semibold">{children}</Link>;
}
