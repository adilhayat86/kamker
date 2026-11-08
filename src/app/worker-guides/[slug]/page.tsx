import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageNavigation } from "@/components/page-navigation";
import { WorkerRegistrationCta } from "@/components/worker-registration-cta";
import { workerGuides } from "@/lib/worker-guides";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return workerGuides.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const guide = workerGuides.find((item) => item.slug === slug);
  if (!guide) return { title: "Guide not found | Kamker", robots: { index: false } };
  const title = `${guide.title} | Kamker`;
  const url = `/worker-guides/${guide.slug}`;
  return {
    title, description: guide.description,
    alternates: { canonical: url },
    openGraph: { title, description: guide.description, url, type: "article" },
    twitter: { card: "summary", title, description: guide.description },
  };
}

export default async function WorkerGuidePage({ params }: Props) {
  const { slug } = await params;
  const guide = workerGuides.find((item) => item.slug === slug);
  if (!guide) notFound();
  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <PageNavigation backHref="/worker-guides" backLabel="Worker guides" />
        <article className="mt-8">
          <p className="text-sm font-semibold text-primary">Kamker worker guide</p>
          <h1 className="mt-2 text-3xl font-bold leading-tight sm:text-4xl">{guide.title}</h1>
          <p className="mt-5 leading-7 text-muted-foreground">{guide.intro}</p>
          <nav aria-label="In this guide" className="mt-6 rounded-xl border bg-white p-5">
            <p className="font-semibold">In this guide</p>
            <ol className="mt-3 grid gap-2">
              {guide.sections.map((section, index) => <li key={section.heading}><a href={`#step-${index + 1}`} className="text-sm text-primary underline underline-offset-4">{section.heading}</a></li>)}
            </ol>
          </nav>
          {guide.sections.map((section, index) => (
            <section key={section.heading} id={`step-${index + 1}`} className="mt-8 scroll-mt-6">
              <h2 className="text-xl font-semibold sm:text-2xl">{section.heading}</h2>
              {section.paragraphs?.map((paragraph) => <p key={paragraph} className="mt-4 leading-7 text-muted-foreground">{paragraph}</p>)}
              {section.items ? <ul className="mt-4 list-disc space-y-2 pl-5 leading-7 text-muted-foreground">{section.items.map((item) => <li key={item}>{item}</li>)}</ul> : null}
            </section>
          ))}
        </article>
        <WorkerRegistrationCta />
        <nav aria-label="More worker guides" className="mt-8 border-t pt-6">
          <h2 className="font-semibold">More worker guides</h2>
          <ul className="mt-3 grid gap-3">{workerGuides.filter((item) => item.slug !== slug).map((item) => <li key={item.slug}><Link href={`/worker-guides/${item.slug}`} className="text-sm font-semibold text-primary underline underline-offset-4">{item.title}</Link></li>)}</ul>
        </nav>
      </div>
    </main>
  );
}
