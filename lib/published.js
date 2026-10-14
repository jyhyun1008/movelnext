import { notFound } from "next/navigation";
import { isAdmin } from "./auth";
import { compileEpisode } from "./episode";
import { getCharacters, getEpisode, listEpisodes } from "./storage";

// 비공개 에피소드는 관리자에게만 보인다 (미리보기용)
export async function loadEpisode(id) {
  const ep = await getEpisode(id);
  if (!ep || (!ep.published && !(await isAdmin()))) notFound();
  const parsed = compileEpisode(ep.data, await getCharacters());
  const published = (await listEpisodes()).filter((e) => e.published);
  const idx = published.findIndex((e) => e.id === id);
  const next = idx >= 0 ? published[idx + 1]?.id : undefined;
  return { ...ep, ...parsed, next };
}
