import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import ThemeToggle from "@/components/ThemeToggle";
import { getSettings } from "@/lib/storage";

export default async function SiteLayout({ children }) {
  const { title, author, menus } = await getSettings();
  return (
    <>
      <header className="site-header">
        <div className="wrap">
          <Link href="/" className="wordmark">
            {title}
          </Link>
          <SiteNav menus={menus} />
          <ThemeToggle />
        </div>
      </header>
      <main className="site-main">{children}</main>
      <footer className="site-footer">
        <div className="wrap">
          <span>
            © {new Date().getFullYear()} {author || title}
          </span>
          <span>{title}</span>
        </div>
      </footer>
    </>
  );
}
