import Link from "next/link";

export default function EpisodeList({ episodes }) {
  return (
    <ol className="episodes">
      {episodes.map((ep, i) => (
        <li key={ep.id}>
          <span className="no">{String(i + 1).padStart(2, "0")}</span>
          <span>
            <Link className="title" href={`/ep/${ep.id}`}>
              {ep.subtitle || ep.title || ep.id}
            </Link>
            {ep.subtitle && ep.title && <span className="sub">{ep.title}</span>}
          </span>
          <span className="links">
            <Link href={`/ep/${ep.id}`}>보기</Link>
            <Link href={`/raw/${ep.id}`}>대본</Link>
          </span>
        </li>
      ))}
    </ol>
  );
}
