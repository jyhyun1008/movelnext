import Link from "next/link";
import EpisodeList from "@/components/EpisodeList";
import Cards from "@/components/Cards";
import { listEpisodesWithTitles } from "@/lib/content";
import { getCharacters, getPage, getSettings, listMedia } from "@/lib/storage";

const enc = (s) => encodeURIComponent(s);

// 캐릭터 폴더마다 기본 표정(none) 이미지를 대표로 쓴다
function characterCards(chr, info) {
  return chr
    .map(({ name, files }) => {
      const file = files.find((f) => /^none\.\w+$/.test(f.name)) || files[0];
      return file && { name: info[name]?.name || name, color: info[name]?.color, src: `/media/chr/${enc(name)}/${enc(file.name)}` };
    })
    .filter(Boolean);
}

export default async function Home() {
  const [settings, page, episodes, media, info] = await Promise.all([
    getSettings(),
    getPage("index"),
    listEpisodesWithTitles(),
    listMedia(),
    getCharacters(),
  ]);
  const hero = settings.heroImage && media.bg.some((f) => f.name === settings.heroImage) ? `/media/bg/${enc(settings.heroImage)}` : null;
  const first = episodes[0];
  const latest = episodes.length > 1 ? episodes[episodes.length - 1] : null;
  const characters = characterCards(media.chr, info);

  return (
    <div className="landing">
      <section className={`hero ${hero ? "has-image" : ""}`} style={hero ? { backgroundImage: `url("${hero}")` } : undefined}>
        <div className="hero-body">
          <h1>{settings.title}</h1>
          {settings.description && <p>{settings.description}</p>}
          {first && (
            <div className="hero-actions">
              <Link className="btn large" href={`/ep/${first.id}`}>
                첫 화 보기
              </Link>
              {latest && (
                <Link className="btn large light" href={`/ep/${latest.id}`}>
                  최신화 · {latest.subtitle || latest.title || latest.id}
                </Link>
              )}
            </div>
          )}
        </div>
      </section>

      <div className="wrap wide">
        {episodes.length > 0 && (
          <section className="landing-block">
            <div className="block-head">
              <h2>에피소드</h2>
              <span>{episodes.length}화</span>
            </div>
            <EpisodeList episodes={episodes} />
          </section>
        )}

        {characters.length > 0 && (
          <section className="landing-block">
            <div className="block-head">
              <h2>등장인물</h2>
            </div>
            <ul className="cast">
              {characters.map((c) => (
                <li key={c.src} style={c.color ? { "--c": c.color } : undefined}>
                  <img src={c.src} alt="" loading="lazy" />
                  <span>{c.name}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {settings.menus.length > 0 && (
          <section className="landing-block">
            <div className="block-head">
              <h2>둘러보기</h2>
            </div>
            <ul className="shortcuts">
              {settings.menus.map((m) => (
                <li key={m.slug}>
                  <Link href={`/${m.slug}`}>
                    <strong>{m.label}</strong>
                    <span aria-hidden>→</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {page?.cards.length > 0 && (
          <section className="landing-block">
            <Cards page={page} mark={settings.headingMark} />
          </section>
        )}
      </div>
    </div>
  );
}
