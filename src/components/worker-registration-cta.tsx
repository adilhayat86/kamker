import Link from "next/link";

import { Button } from "@/components/ui/button";

export function WorkerRegistrationCta() {
  return (
    <aside aria-label="Join Kamker as a worker" className="mt-6 rounded-xl border border-sky-200 bg-sky-50 p-5">
      <h2 className="text-lg font-semibold text-slate-950">Do you offer a service?</h2>
      <p className="mt-2 text-sm leading-6 text-slate-700">
        Create your free worker profile so customers can find your skills and contact you.
        Kamker does not charge commission from workers. Work and earnings are not guaranteed.
      </p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-5">
        <Button asChild className="h-11"><Link href="/register/professional">Create your free worker profile</Link></Button>
        <Link href="/worker-guides" className="text-sm font-semibold text-primary underline underline-offset-4">Read the worker guides</Link>
      </div>
    </aside>
  );
}
