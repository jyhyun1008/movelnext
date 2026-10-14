import { renderBody } from "@/lib/cards";

const isExternal = (href) => /^https?:\/\//i.test(href);

function CardList({ section, mark }) {
  return (
    <div className={`cards ${section.layout}`}>
      {section.cards.map((c, i) => (
        <article key={c.id} className="card-item">
          {c.image && <img className="card-cover" src={c.image} alt="" loading={i > 2 ? "lazy" : undefined} />}
          <div className="card-body">
            {c.title && (
              <h3 className="card-title">
                {mark && <span className="card-mark">{mark}</span>}
                {c.title}
              </h3>
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

// 페이지 = 섹션(소제목 + 카드 목록) 여러 개
export default function Cards({ page, mark, sectionClass = "page-section" }) {
  const sections = page?.sections.filter((s) => s.title || s.cards.length) ?? [];
  if (!sections.length) return <p className="empty">아직 내용이 없습니다.</p>;
  return sections.map((s) => (
    <section key={s.id} className={sectionClass}>
      {s.title && (
        <div className="block-head">
          <h2>{s.title}</h2>
        </div>
      )}
      {s.cards.length > 0 && <CardList section={s} mark={mark} />}
    </section>
  ));
}
