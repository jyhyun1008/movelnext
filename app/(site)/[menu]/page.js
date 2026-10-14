import { notFound } from "next/navigation";
import Cards from "@/components/Cards";
import { getPage, getSettings } from "@/lib/storage";

async function load(params) {
  const { menu } = await params;
  const settings = await getSettings();
  const item = settings.menus.find((m) => m.slug === menu);
  if (!item) notFound();
  return { settings, item, page: await getPage(menu) };
}

export async function generateMetadata({ params }) {
  const { item } = await load(params);
  return { title: item.label };
}

export default async function MenuPage({ params }) {
  const { settings, item, page } = await load(params);
  return (
    <div className="wrap">
      <header className="page-title">
        <h1>{item.label}</h1>
      </header>
      <Cards page={page} mark={settings.headingMark} />
    </div>
  );
}
