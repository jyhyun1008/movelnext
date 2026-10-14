import Player from "@/components/Player";
import { loadEpisode } from "@/lib/published";
import { getSettings } from "@/lib/storage";

export async function generateMetadata({ params }) {
  const ep = await loadEpisode((await params).epid);
  return { title: ep.subtitle || ep.title || ep.id };
}

export default async function EpisodePage({ params }) {
  const { epid } = await params;
  const [ep, settings] = await Promise.all([loadEpisode(epid), getSettings()]);
  return <Player key={epid} epid={epid} scenes={ep.scenes} theme={ep.theme || settings.theme} next={ep.next} />;
}
