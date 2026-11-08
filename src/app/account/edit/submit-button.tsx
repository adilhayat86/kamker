"use client";

import { Loader2, Save } from "lucide-react";
import { usePhotoUpload } from "@/components/photo-form";
import { useFormStatus } from "react-dom";

import { Button } from "@/components/ui/button";

export function CompleteProfileSubmitButton({
  disabled = false,
}: {
  disabled?: boolean;
}) {
  const { pending } = useFormStatus();
  const { busy } = usePhotoUpload();
  const isDisabled = disabled || pending || busy;

  return (
    <Button
      type="submit"
      className="h-12"
      disabled={isDisabled}
      aria-busy={pending}
    >
      {pending ? (
        <Loader2 className="animate-spin" aria-hidden="true" />
      ) : (
        <Save aria-hidden="true" />
      )}
      {pending ? "Saving profile..." : busy ? "Wait for photo upload..." : "Save Profile"}
    </Button>
  );
}
