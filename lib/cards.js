import { marked } from "marked";

// 페이지 = 카드 목록. 서버·클라이언트(편집기 미리보기) 양쪽에서 쓰는 순수 함수만 둔다.

export const LAYOUTS = ["list", "grid"];

export function newId() {
  return Math.random().toString(36).slice(2, 10);
}

export function emptyCard() {
  return { id: newId(), title: "", subtitle: "", image: "", body: "", links: [] };
}

const SAFE_HREF = /^(\/(?!\/)|#|https?:\/\/|mailto:)/i;

const str = (v, max = 5000) => (typeof v === "string" ? v.slice(0, max) : "");

export function normalizePage(data) {
  const cards = Array.isArray(data?.cards) ? data.cards : [];
  return {
    layout: LAYOUTS.includes(data?.layout) ? data.layout : "list",
    cards: cards.map((c) => ({
      id: str(c?.id, 32) || newId(),
      title: str(c?.title, 200),
      subtitle: str(c?.subtitle, 200),
      image: SAFE_HREF.test(str(c?.image)) ? str(c.image, 1000) : "",
      body: str(c?.body, 20000),
      links: (Array.isArray(c?.links) ? c.links : [])
        .map((l) => ({ label: str(l?.label, 200), href: str(l?.href, 1000).trim() }))
        .filter((l) => l.label && SAFE_HREF.test(l.href)),
    })),
  };
}

// 예전 마크다운 페이지 → 카드. # 제목마다 카드 하나, 제목 바로 아래 이미지는 썸네일.
export function markdownToPage(markdown = "") {
  const cards = [];
  let current = null;
  for (const token of marked.lexer(markdown)) {
    if (token.type === "heading" && token.depth === 1) {
      current = { ...emptyCard(), title: token.text, tokens: [] };
      cards.push(current);
      continue;
    }
    if (!current) {
      if (token.type === "space") continue;
      current = { ...emptyCard(), tokens: [] };
      cards.push(current);
    }
    const inline = token.type === "paragraph" ? token.tokens.filter((t) => !(t.type === "text" && !t.text.trim())) : [];
    if (!current.image && !current.tokens.some((t) => t.type !== "space") && inline.length === 1 && inline[0].type === "image") {
      current.image = inline[0].href;
    } else {
      current.tokens.push(token);
    }
  }
  return normalizePage({
    layout: "list",
    cards: cards
      .map(({ tokens, ...c }) => ({ ...c, body: tokens.map((t) => t.raw).join("").trim() }))
      .filter((c) => c.title || c.body || c.image),
  });
}

export function renderBody(body) {
  return body ? marked.parse(body) : "";
}
