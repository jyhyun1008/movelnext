import { renderBody } from "@/lib/cards";

const isExternal = (href) => /^https?:\/\//i.test(href);

export default function Cards({ page, mark }) {
  if (!page?.cards.length) return <p className="empty">아직 내용이 없습니다.</p>;
  return (
    <div className={`cards ${page.layout}`}>
      {page.cards.map((c, i) => (
        <article key={c.id} className="card-item">
          {c.image && <img className="card-cover" src={c.image} alt="" loading={i > 2 ? "lazy" : undefined} />}
          <div className="card-body">
            {c.title && (
              <h2 className="card-title">
                {mark && <span className="card-mark">{mark}</span>}
                {c.title}
              </h2>
            )}
            {c.subtitle && <p className="card-subtitle">{c.subtitle}</p>}
            {c.body && <div className="card-text" dangerouslySetInnerHTML={{ __html: renderBody(c.body) }} />}
            {c.links.length > 0 && (
              <ul className="card-links">
                {c.links.map((l, j) => (
                  <li key={j}>
                    <a href={l.href} {...(isExternal(l.href) ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
                      <span>{l.label}</span>
                      <span aria-hidden>{isExternal(l.href) ? "↗" : "→"}</span>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}
