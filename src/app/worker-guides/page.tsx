import type { Metadata } from "next";
import Link from "next/link";

import { PageNavigation } from "@/components/page-navigation";
import { WorkerRegistrationCta } from "@/components/worker-registration-cta";
import { workerGuides } from "@/lib/worker-guides";

const title = "Worker Registration and Profile Guides | Kamker";
const description = "Practical guides for workers in Pakistan: register free on Kamker, complete your profile and understand how customers can contact you.";

export const metadata: Metadata = {
  title, description,
  alternates: { canonical: "/worker-guides" },
  openGraph: { title, description, url: "/worker-guides", type: "website" },
  twitter: { card: "summary", title, description },
};

export default function WorkerGuidesPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        <PageNavigation />
        <h1 className="mt-8 text-3xl font-bold sm:text-4xl">Guides for workers joining Kamker</h1>
        <p className="mt-4 max-w-2xl leading-7 text-muted-foreground">Learn how to register, describe your services and keep your profile useful for customers. These guides explain how Kamker works without promising jobs or earnings.</p>
        <div className="mt-8 grid gap-4">
          {workerGuides.map((guide, index) => (
            <article key={guide.slug} className="rounded-xl border bg-white p-5 sm:p-6">
              <p className="text-sm font-semibold text-primary">Guide {index + 1}</p>
              <h2 className="mt-2 text-xl font-semibold"><Link className="hover:text-primary underline underline-offset-4" href={`/worker-guides/${guide.slug}`}>{guide.title}</Link></h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{guide.description}</p>
            </article>
          ))}
        </div>
        <WorkerRegistrationCta />
        <p className="mt-5 text-sm text-muted-foreground">Registering a company or looking for a worker? <Link href="/register" className="font-semibold text-primary underline underline-offset-4">See company and customer registration</Link>.</p>
      </div>
    </main>
  );
}
