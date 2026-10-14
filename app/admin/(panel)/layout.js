import Link from "next/link";
import AdminNav from "@/components/admin/AdminNav";
import ThemeToggle from "@/components/ThemeToggle";
import { requireAdmin } from "@/lib/auth";
import { logout } from "../actions";

export const metadata = { title: "관리자", robots: { index: false } };

export default async function AdminLayout({ children }) {
  await requireAdmin();
  return (
    <div className="admin">
      <header className="admin-bar">
        <strong>관리자</strong>
        <AdminNav />
        <div className="admin-bar-end">
          <ThemeToggle />
          <Link href="/" target="_blank">
            사이트 보기
          </Link>
          <form action={logout}>
            <button className="linklike">로그아웃</button>
          </form>
        </div>
      </header>
      <main className="admin-main">{children}</main>
    </div>
  );
}
