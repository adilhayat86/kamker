import Image from "next/image";
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
      className={`group flex items-center font-semibold ${className}`}
      aria-label={label}
    >
      <Image
        src="/kamker-logo-old-wordmark.png"
        alt="Kamker"
        width={205}
        height={41}
        priority
        className="h-9 w-auto object-contain transition-transform group-hover:scale-[1.01] sm:h-10"
      />
    </Link>
  );
}
