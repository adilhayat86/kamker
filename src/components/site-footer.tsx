import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t bg-white px-4 pb-24 pt-6 text-sm text-muted-foreground sm:px-6 md:pb-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p>© {new Date().getFullYear()} Kamker. All rights reserved.</p>
        <nav aria-label="Resources, legal and support" className="flex flex-wrap gap-x-5 gap-y-3">
          <Link href="/worker-guides" className="hover:text-foreground">Worker Guides</Link>
          <Link href="/about" className="hover:text-foreground">About</Link>
          <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
          <Link href="/contact" className="hover:text-foreground">Contact Us</Link>
        </nav>
      </div>
    </footer>
  );
}
