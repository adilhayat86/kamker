"use client";

import { createContext, useContext, useState, type ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

const PhotoContext = createContext<{ busy: boolean; setBusy: (value: boolean) => void }>({ busy: false, setBusy: () => {} });
export function usePhotoUpload() { return useContext(PhotoContext); }

export function PhotoForm({ children, ...props }: ComponentProps<"form">) {
  const [busy, setBusy] = useState(false);
  return <PhotoContext.Provider value={{ busy, setBusy }}>
    <form {...props} onSubmit={event => { if (busy) event.preventDefault(); }}>{children}</form>
  </PhotoContext.Provider>;
}

export function PhotoSaveButton({ children = "Save photo", disabled, ...props }: ComponentProps<typeof Button>) {
  const { busy } = usePhotoUpload();
  const { pending } = useFormStatus();
  return <Button {...props} type="submit" disabled={disabled || busy || pending} aria-busy={pending || busy}>
    {pending ? "Saving..." : busy ? "Wait for photo upload..." : children}
  </Button>;
}
