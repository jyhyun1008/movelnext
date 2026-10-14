"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  ["/admin", "개요"],
  ["/admin/episodes", "에피소드"],
  ["/admin/characters", "캐릭터"],
  ["/admin/pages", "페이지"],
  ["/admin/media", "미디어"],
  ["/admin/settings", "사이트 설정"],
];

export default function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="admin-nav">
      {ITEMS.map(([href, label]) => {
        const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <Link key={href} href={href} aria-current={active ? "page" : undefined}>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
