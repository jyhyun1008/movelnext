import { episodeTitle } from "./episode";
import { getEpisode, listEpisodes } from "./storage";

// 목록 표시용: 각 에피소드의 첫 타이틀 장면에서 제목/부제를 뽑아 붙인다
export async function listEpisodesWithTitles({ includeDrafts = false } = {}) {
  const list = (await listEpisodes()).filter((e) => includeDrafts || e.published);
  return Promise.all(
    list.map(async (meta) => {
      const ep = await getEpisode(meta.id);
      return { ...meta, ...episodeTitle(ep?.data), scenes: ep?.data.scenes.length ?? 0 };
    }),
  );
}
