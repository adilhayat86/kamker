import Link from "next/link";
import { redirect } from "next/navigation";
import { getSessionProfessional } from "@/lib/auth";
import { getRegistrationConversion } from "@/lib/registration-conversion";
import { RegistrationConversion } from "@/components/registration-conversion";
import { RECOVERY_PHRASE_MAX_LENGTH, RECOVERY_PHRASE_MIN_LENGTH } from "@/lib/worker-recovery";
import { getWorkerRecoveryStatus } from "@/lib/worker-recovery-server";
import { PageNavigation } from "@/components/page-navigation";
import { saveWorkerRecovery } from "./actions";
import { RecoverySubmitButton } from "./submit-button";

export const metadata = { title: "Set up password recovery | Kamker", robots: { index: false, follow: false } };

const errors: Record<string, string> = {
  "phrase-length": "Use a recovery phrase between 12 and 128 characters long.",
  "phrase-mismatch": "The two recovery phrases do not match. Enter them again.",
  "phrase-password": "Choose a recovery phrase different from your login password.",
  "password-invalid": "Your current password was not accepted. Check it and try again.",
  "save-error": "Recovery could not be saved. Your existing recovery details are unchanged. Please try again.",
};

const inputClass = "h-12 w-full rounded-md border border-input bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default async function WorkerRecoveryPage({ searchParams }: { searchParams?: Promise<{ status?: string }> }) {
  const worker = await getSessionProfessional();
  if (!worker) redirect("/login?next=/account/recovery");
  const status = (await searchParams)?.status;
  const configured = await getWorkerRecoveryStatus(worker.id);
  const registrationEventId = await getRegistrationConversion(worker.id);
  const accountHref = status === "photo-saved" ? "/account?status=photo-saved" : status === "registered" ? "/account?status=registered" : "/account";

  return <main className="min-h-screen bg-background px-4 py-8 sm:px-6">
    {registrationEventId ? <RegistrationConversion eventId={registrationEventId} /> : null}
    <section className="mx-auto max-w-lg">
      <PageNavigation backHref="/account" backLabel="My account" />
      <div className="mt-6 rounded-xl border bg-white p-5 shadow-sm sm:p-6">
        {status === "photo-saved" ? <p role="status" className="mb-4 rounded-lg bg-emerald-50 p-3 text-sm font-semibold text-emerald-900">Photo uploaded and profile saved successfully.</p> : null}
        {status === "registered" ? <p className="mb-3 text-sm font-medium text-emerald-800">You are registered and logged in.</p> : null}
        <h1 className="text-3xl font-bold">{configured ? "Update password recovery" : "Set up password recovery"}</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">If you forget your password, you can use a private recovery phrase to reset it. Set it up now while you know your password.</p>
        {configured === true ? <p className="mt-3 text-sm leading-6 text-muted-foreground">Recovery is already set up. Saving here replaces your previous recovery question and answer.</p> : configured === false ? <p className="mt-3 text-sm font-semibold text-amber-900">Without recovery details, you cannot use the current self-service password reset.</p> : <p role="alert" className="mt-3 text-sm text-amber-900">We could not check your current recovery status. You can try saving your recovery phrase or return to your account.</p>}
        {status && errors[status] ? <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-900">{errors[status]}</p> : null}
        <form action={saveWorkerRecovery} className="mt-5 grid gap-4">
          <label className="grid gap-2 text-sm font-medium">
            Private recovery phrase
            <input className={inputClass} name="recoveryPhrase" type="password" required minLength={RECOVERY_PHRASE_MIN_LENGTH} maxLength={RECOVERY_PHRASE_MAX_LENGTH} autoComplete="off" aria-describedby="recovery-phrase-help" />
            <span id="recovery-phrase-help" className="text-xs font-normal leading-5 text-muted-foreground">Use several words, at least 12 characters. Choose something only you know, different from your password. Avoid your name, phone number and public profile details. Letter case does not matter.</span>
          </label>
          <label className="grid gap-2 text-sm font-medium">Repeat recovery phrase<input className={inputClass} name="confirmRecoveryPhrase" type="password" required minLength={RECOVERY_PHRASE_MIN_LENGTH} maxLength={RECOVERY_PHRASE_MAX_LENGTH} autoComplete="off" /></label>
          <label className="grid gap-2 text-sm font-medium">Current password<input className={inputClass} name="currentPassword" type="password" required autoComplete="current-password" /></label>
          <p className="text-xs leading-5 text-muted-foreground">Keep your phrase somewhere private. It will not appear on your public profile. We never show your saved phrase back to you.</p>
          <RecoverySubmitButton />
        </form>
        <Link href={accountHref} className="mt-3 block rounded-md border px-4 py-3 text-center text-sm font-semibold">{configured ? "Back to my account" : "Do this later"}</Link>
      </div>
    </section>
  </main>;
}
