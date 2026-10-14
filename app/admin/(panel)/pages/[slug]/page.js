import { notFound } from "next/navigation";
import PageBuilder from "@/components/admin/PageBuilder";
import { listEpisodesWithTitles } from "@/lib/content";
import { getPage, getSettings, listMedia } from "@/lib/storage";

const enc = (p) => p.split("/").map(encodeURIComponent).join("/");
const stem = (name) => name.replace(/\.[^.]+$/, "");
const items = (base, files) => files.map((f) => ({ name: stem(f.name), src: `/media/${enc(`${base}/${f.name}`)}` }));

export default async function EditPage({ params }) {
  const { slug } = await params;
  const { menus, headingMark } = await getSettings();
  const label = slug === "index" ? "홈 하단" : menus.find((m) => m.slug === slug)?.label;
  if (!label) notFound();
  const [page, media, episodes] = await Promise.all([getPage(slug), listMedia(), listEpisodesWithTitles({ includeDrafts: true })]);

  const mediaGroups = [
    { label: "썸네일", items: items("thumb", media.thumb) },
    { label: "배경", items: items("bg", media.bg) },
    { label: "캐릭터", items: media.chr.flatMap((c) => items(`chr/${c.name}`, c.files).map((it) => ({ ...it, name: `${c.name}/${it.name}` }))) },
  ];

  return (
    <>
      <h1>{label}</h1>
      <PageBuilder
        key={slug}
        slug={slug}
        initial={page ?? { layout: "list", cards: [] }}
        mediaGroups={mediaGroups}
        episodes={episodes.map((e) => ({ id: e.id, label: e.subtitle || e.title || e.id }))}
        mark={headingMark}
        viewHref={slug === "index" ? "/" : `/${slug}`}
      />
    </>
  );
}
