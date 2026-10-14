import Link from "next/link";
import { notFound } from "next/navigation";
import EpisodeExport from "@/components/admin/EpisodeExport";
import { compileEpisode } from "@/lib/episode";
import { getCharacters, getEpisode, getSettings } from "@/lib/storage";

export default async function ExportPage({ params }) {
  const { id } = await params;
  const [ep, settings, characters] = await Promise.all([getEpisode(id), getSettings(), getCharacters()]);
  if (!ep) notFound();
  const compiled = compileEpisode(ep.data, characters);
  const title = compiled.subtitle || compiled.title;
  return (
    <>
      <div className="title-row">
        <h1>
          인스타 이미지 <span className="muted mono id-chip">{id}</span>
        </h1>
        <Link href={`/admin/episodes/${id}`}>← 장면 편집으로</Link>
      </div>
      <p className="hint">장면마다 한 장씩 그립니다. 이미지를 누르면 그 장만 받을 수 있습니다. 저장하지 않은 편집 내용은 반영되지 않습니다.</p>
      <EpisodeExport id={id} scenes={compiled.scenes} theme={ep.data.theme || settings.theme} siteTitle={settings.title} episodeTitle={title} />
    </>
  );
}
