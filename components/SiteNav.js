"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SiteNav({ menus }) {
  const pathname = usePathname();
  return (
    <nav className="site-nav" aria-label="메뉴">
      {menus.map((m) => (
        <Link key={m.slug} href={`/${m.slug}`} aria-current={pathname === `/${m.slug}` ? "page" : undefined}>
          {m.label}
        </Link>
      ))}
    </nav>
  );
}
