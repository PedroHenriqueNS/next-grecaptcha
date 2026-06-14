"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/checkbox", label: "Checkbox" },
  { href: "/invisible", label: "Invisible" },
  { href: "/v3", label: "v3" },
  { href: "/server-action", label: "Server Action" },
];

export function SiteNav() {
  const pathname = usePathname();
  return (
    <nav className="nav">
      <Link href="/" className="nav__brand">▸ next-grecaptcha</Link>
      <div className="nav__links">
        {LINKS.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="nav__link"
            aria-current={pathname === href ? "page" : undefined}
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
