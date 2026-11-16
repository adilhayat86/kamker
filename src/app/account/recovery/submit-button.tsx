"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function RecoverySubmitButton() {
  const { pending } = useFormStatus();
  return <Button type="submit" className="h-12" disabled={pending} aria-busy={pending}>{pending ? "Saving recovery..." : "Save recovery phrase"}</Button>;
}
