import Link from "next/link";
import { notFound } from "next/navigation";
import SceneEditor from "@/components/admin/SceneEditor";
import { episodeTitle } from "@/lib/episode";
import { getCharacters, getEpisode, getSettings, listMedia } from "@/lib/storage";

export default async function EditEpisode({ params }) {
  const { id } = await params;
  const [ep, media, settings, characters] = await Promise.all([getEpisode(id), listMedia(), getSettings(), getCharacters()]);
  if (!ep) notFound();
  const { title, subtitle } = episodeTitle(ep.data);
  const names = (files) => files.map((f) => f.name);
  return (
    <>
      <div className="title-row">
        <h1>
          {subtitle || title || "제목 없음"} <span className="muted mono id-chip">{id}</span>
        </h1>
        <span>
          <Link href={`/ep/${id}`} target="_blank">
            미리보기
          </Link>
          {" · "}
          <Link href={`/raw/${id}`} target="_blank">
            대본
          </Link>
          {" · "}
          <Link href={`/admin/episodes/${id}/export`}>인스타 이미지</Link>
        </span>
      </div>
      <SceneEditor
        key={id}
        id={id}
        initial={{ data: ep.data, published: ep.published }}
        siteTheme={settings.theme}
        characters={characters}
        media={{
          bg: names(media.bg),
          bgm: names(media.bgm),
          sound: names(media.sound),
          chr: media.chr.map((c) => ({ name: c.name, files: names(c.files) })),
        }}
      />
    </>
  );
}
