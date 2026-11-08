import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionProfessional } from "@/lib/auth";
import { getRegistrationConversion } from "@/lib/registration-conversion";
import { RegistrationConversion } from "@/components/registration-conversion";
import { PhotoUploadField } from "@/components/photo-upload-field";
import { PhotoForm, PhotoSaveButton } from "@/components/photo-form";
import { saveAccountPhoto } from "./actions";

export const metadata = { title: "Add your photo | Kamker", robots: { index: false, follow: false } };

export default async function AddPhotoPage({ searchParams }: { searchParams?: Promise<{ status?: string }> }) {
  const worker = await getSessionProfessional();
  if (!worker) redirect("/login");
  const status = (await searchParams)?.status;
  const conversion = status === "registered" ? await getRegistrationConversion(worker.id) : null;
  const errors: Record<string, string> = {
    "choose-photo": "Choose and upload a photo, or skip for now.",
    "photo-error": "The photo could not be checked. Choose it again to retry. Your existing photo is unchanged.",
    "save-error": "Your profile could not be saved. Your existing photo is unchanged. Please try again.",
  };
  return <main className="min-h-screen bg-background px-4 py-10">
    {conversion ? <RegistrationConversion eventId={conversion} /> : null}
    <section className="mx-auto max-w-lg rounded-xl border bg-white p-6 shadow-sm">
      {status === "registered" ? <p className="mb-3 text-sm font-medium text-emerald-800">You are registered and logged in.</p> : null}
      <h1 className="text-3xl font-bold">Add your photo</h1>
      <p className="my-4 text-sm leading-6 text-muted-foreground">Help customers recognise you. Choose a clear photo of yourself. You can add or change it later from your profile.</p>
      {status && errors[status] ? <p role="alert" className="mb-4 rounded border border-amber-200 bg-amber-50 p-3 text-sm">{errors[status]}</p> : null}
      <PhotoForm action={saveAccountPhoto} className="grid gap-4">
        <PhotoUploadField helpText="JPEG, PNG, WebP and iPhone HEIC/HEIF photos are accepted. The final upload must be under 10MB." />
        <PhotoSaveButton />
      </PhotoForm>
      <Link href="/account?status=registered" className="mt-5 block rounded-md border px-4 py-3 text-center text-sm font-semibold">Skip for now</Link>
    </section>
  </main>;
}
