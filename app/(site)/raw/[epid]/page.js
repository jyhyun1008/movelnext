import Link from "next/link";
import { loadEpisode } from "@/lib/published";

export async function generateMetadata({ params }) {
  const ep = await loadEpisode((await params).epid);
  return { title: `${ep.subtitle || ep.title || ep.id} 대본` };
}

export default async function ScriptPage({ params }) {
  const { epid } = await params;
  const ep = await loadEpisode(epid);
  return (
    <div className="wrap">
      <header className="page-title">
        <h1>{ep.subtitle || ep.title || ep.id}</h1>
        <p>
          대본 · <Link href={`/ep/${epid}`}>플레이어로 보기</Link>
        </p>
      </header>
      <div className="script">
        {ep.scenes.map((s, i) => {
          if (s.type === "title")
            return (
              <div className="act" key={i}>
                <strong>{s.title}</strong>
                {s.subtitle && <span>{s.subtitle}</span>}
              </div>
            );
          if (s.type === "place")
            return (
              <p className="place" key={i}>
                {s.name}
              </p>
            );
          if (!s.lines.length) return null;
          return (
            <div className="line" key={i}>
              <span className="who" style={s.nameColor ? { color: s.nameColor } : undefined}>
                {s.name}
              </span>
              <span>
                {s.lines.map((l, j) => (
                  <span key={j}>
                    {j > 0 && <br />}
                    {l}
                  </span>
                ))}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
