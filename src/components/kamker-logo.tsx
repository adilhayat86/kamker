import Link from "next/link";

type KamkerLogoProps = {
  href?: string;
  label?: string;
  className?: string;
};

export function KamkerLogo({
  href = "/",
  label = "Kamker home",
  className = "",
}: KamkerLogoProps) {
  return (
    <Link
      href={href}
      className={`group flex items-center gap-2.5 font-semibold ${className}`}
      aria-label={label}
    >
      <span className="relative flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary text-base font-black tracking-normal text-primary-foreground shadow-sm ring-1 ring-primary/15 transition-transform group-hover:scale-[1.02]">
        <span className="absolute -left-2 top-1 size-5 rounded-full bg-[#f97316]" />
        <span className="absolute -right-1 -top-2 size-5 rounded-full bg-[#7c3aed]" />
        <span className="relative">K</span>
      </span>
      <span className="text-xl font-black tracking-normal text-slate-950">
        Kamker
      </span>
    </Link>
  );
}
