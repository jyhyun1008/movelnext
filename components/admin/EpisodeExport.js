"use client";

import { zipSync } from "fflate";
import { useEffect, useMemo, useRef, useState } from "react";
import { readableOn } from "@/lib/episode";

const SIZES = {
  portrait: { w: 1080, h: 1350, label: "세로 4:5 (1080×1350)" },
  square: { w: 1080, h: 1080, label: "정사각형 1:1 (1080×1080)" },
};
const POST_LIMIT = 20; // 인스타그램 캐러셀 한 게시물 최대 장수
const FILTERS = { gray: "grayscale(0.9)", sepia: "sepia(0.8)", blur: "blur(6px)" };
const FONT = '"Pretendard Variable", Pretendard, -apple-system, "Apple SD Gothic Neo", sans-serif';

/* ---------- 그리기 ---------- */

const imageCache = new Map();
function loadImage(src) {
  if (!imageCache.has(src)) {
    imageCache.set(
      src,
      new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
      }),
    );
  }
  return imageCache.get(src);
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}

// 공백 기준으로 줄바꿈하고, 한 단어가 너무 길면 글자 단위로 자른다
function wrap(ctx, text, maxWidth) {
  const out = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const word of para.split(/(\s+)/)) {
      const next = line + word;
      if (ctx.measureText(next).width <= maxWidth) {
        line = next;
        continue;
      }
      if (line.trim()) out.push(line.trimEnd());
      line = word.trimStart();
      while (ctx.measureText(line).width > maxWidth) {
        let i = line.length;
        while (i > 1 && ctx.measureText(line.slice(0, i)).width > maxWidth) i--;
        out.push(line.slice(0, i));
        line = line.slice(i);
      }
    }
    out.push(line.trimEnd());
  }
  return out;
}

function pill(ctx, text, x, y, { size, bg, color, padX, weight = 700 }) {
  ctx.font = `${weight} ${size}px ${FONT}`;
  const h = size * 1.9;
  const w = ctx.measureText(text).width + padX * 2;
  ctx.fillStyle = bg;
  roundRect(ctx, x, y, w, h, h / 2);
  ctx.fillStyle = color;
  ctx.textBaseline = "middle";
  ctx.fillText(text, x + padX, y + h / 2 + size * 0.04);
  return { w, h };
}

async function drawScene(canvas, scene, opts) {
  const { w: W, h: H } = SIZES[opts.size];
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  const u = W / 1080; // 기준 단위
  ctx.textAlign = "left";

  // 배경
  ctx.fillStyle = "#0d0e11";
  ctx.fillRect(0, 0, W, H);
  const bg = scene.bg && (await loadImage(scene.bg));
  if (bg) {
    const scale = Math.max(W / bg.width, H / bg.height);
    const bw = bg.width * scale;
    const bh = bg.height * scale;
    ctx.filter = FILTERS[scene.effect] || "none";
    ctx.drawImage(bg, (W - bw) / 2, (H - bh) / 2, bw, bh);
    ctx.filter = "none";
  }

  // 캐릭터
  if (scene.type === "dialogue") {
    for (const c of scene.chars) {
      if (c.to < 0 || c.to > 100) continue;
      const img = await loadImage(c.src);
      if (!img) continue;
      const ch = H * 0.86;
      const cw = img.width * (ch / img.height);
      ctx.drawImage(img, (W * c.to) / 100 - cw / 2, H - ch, cw, ch);
    }
  }

  // 타이틀
  if (scene.type === "title") {
    ctx.fillStyle = "rgba(0,0,0,0.38)";
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.fillStyle = "#fff";
    const size = 84 * u;
    ctx.font = `800 ${size}px ${FONT}`;
    const lines = wrap(ctx, scene.title || "", W - 160 * u);
    const top = H / 2 - ((lines.length - 1) * size * 1.15) / 2;
    lines.forEach((l, i) => ctx.fillText(l, W / 2, top + i * size * 1.15));
    if (scene.subtitle) {
      ctx.font = `600 ${34 * u}px ${FONT}`;
      const sw = ctx.measureText(scene.subtitle).width + 48 * u;
      const sy = top + (lines.length - 1) * size * 1.15 + 50 * u;
      ctx.fillStyle = "rgba(255,255,255,0.16)";
      roundRect(ctx, W / 2 - sw / 2, sy, sw, 64 * u, 32 * u);
      ctx.fillStyle = "#fff";
      ctx.textBaseline = "middle";
      ctx.fillText(scene.subtitle, W / 2, sy + 33 * u);
    }
    ctx.textAlign = "left";
  }

  // 장소
  if (scene.type === "place" && scene.name) {
    ctx.font = `700 ${36 * u}px ${FONT}`;
    const pw = ctx.measureText(scene.name).width + 64 * u;
    pill(ctx, scene.name, W / 2 - pw / 2, H * 0.16, { size: 36 * u, bg: "rgba(13,14,17,0.62)", color: "#fff", padX: 32 * u });
  }

  // 대사창: 이름표 + 3줄 고정 높이 (넘치면 위로 늘어난다)
  if (scene.type === "dialogue" && scene.lines.length) {
    const dark = opts.box === "dark";
    const pad = 40 * u;
    const inner = 36 * u;
    const fs = 40 * u;
    const lh = fs * 1.62;
    const nameSize = 30 * u;
    const nameH = nameSize * 1.9;
    const boxW = W - pad * 2;
    ctx.font = `500 ${fs}px ${FONT}`;
    const lines = wrap(ctx, scene.lines.join("\n"), boxW - inner * 2);
    const boxH = inner * 2 + nameH + 18 * u + Math.max(3, lines.length) * lh;
    const y = H - pad - boxH;

    ctx.shadowColor = "rgba(0,0,0,0.25)";
    ctx.shadowBlur = 40 * u;
    ctx.shadowOffsetY = 10 * u;
    ctx.fillStyle = dark ? "rgba(23,26,32,0.94)" : "rgba(255,255,255,0.96)";
    roundRect(ctx, pad, y, boxW, boxH, 32 * u);
    ctx.shadowColor = "transparent";

    if (scene.name) {
      const nameBg = scene.nameColor || opts.theme;
      pill(ctx, scene.name, pad + inner, y + inner, { size: nameSize, bg: nameBg, color: readableOn(nameBg), padX: 22 * u });
    }

    ctx.font = `500 ${fs}px ${FONT}`;
    ctx.fillStyle = dark ? "#e7e9ee" : "#16181d";
    ctx.textBaseline = "middle";
    const textTop = y + inner + nameH + 18 * u;
    lines.forEach((l, i) => ctx.fillText(l, pad + inner, textTop + i * lh + lh / 2));
  }

  // 사이트 이름 · 장 번호
  if (opts.watermark) {
    pill(ctx, opts.watermark, 32 * u, 32 * u, { size: 24 * u, bg: "rgba(13,14,17,0.5)", color: "#fff", padX: 18 * u, weight: 600 });
  }
}

const toBlob = (canvas) => new Promise((r) => canvas.toBlob(r, "image/png"));

/* ---------- 화면 ---------- */

export default function EpisodeExport({ id, scenes, theme, siteTitle, episodeTitle }) {
  const [size, setSize] = useState("portrait");
  const [box, setBox] = useState("light");
  const [mark, setMark] = useState(true);
  const [selected, setSelected] = useState(() => new Set(scenes.map((_, i) => i)));
  const [images, setImages] = useState([]); // [{ index, url, blob }]
  const [progress, setProgress] = useState(0);
  const [busy, setBusy] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const run = useRef(0);

  const picked = useMemo(() => scenes.map((_, i) => i).filter((i) => selected.has(i)), [scenes, selected]);
  const posts = useMemo(() => {
    const out = [];
    for (let i = 0; i < images.length; i += POST_LIMIT) out.push(images.slice(i, i + POST_LIMIT));
    return out;
  }, [images]);

  useEffect(() => {
    try {
      const f = new File([""], "a.png", { type: "image/png" });
      setCanShare(Boolean(navigator.canShare?.({ files: [f] })));
    } catch {}
  }, []);

  // 옵션이나 선택이 바뀌면 다시 그린다
  useEffect(() => {
    const token = ++run.current;
    const timer = setTimeout(async () => {
      setBusy(true);
      setProgress(0);
      await Promise.all(
        ["500", "600", "700", "800"].map((w) => document.fonts?.load(`${w} 40px "Pretendard Variable"`).catch(() => {})),
      );
      const canvas = document.createElement("canvas");
      const out = [];
      for (const [n, i] of picked.entries()) {
        if (run.current !== token) return out.forEach((o) => URL.revokeObjectURL(o.url));
        await drawScene(canvas, scenes[i], {
          size,
          box,
          theme,
          watermark: mark ? `${siteTitle}${episodeTitle ? ` · ${episodeTitle}` : ""}` : "",
        });
        const blob = await toBlob(canvas);
        out.push({ index: i, blob, url: URL.createObjectURL(blob) });
        setProgress((n + 1) / picked.length);
      }
      if (run.current !== token) return out.forEach((o) => URL.revokeObjectURL(o.url));
      setImages((prev) => {
        prev.forEach((o) => URL.revokeObjectURL(o.url));
        return out;
      });
      setBusy(false);
    }, 250);
    return () => clearTimeout(timer);
  }, [picked, scenes, size, box, mark, theme, siteTitle, episodeTitle]);

  const fileName = (n) => `${id}-${String(n + 1).padStart(2, "0")}.png`;

  async function downloadZip() {
    const files = {};
    for (const [p, post] of posts.entries()) {
      for (const [n, img] of post.entries()) {
        const folder = posts.length > 1 ? `post-${p + 1}/` : "";
        files[`${folder}${fileName(p * POST_LIMIT + n)}`] = new Uint8Array(await img.blob.arrayBuffer());
      }
    }
    const zip = zipSync(files, { level: 0 }); // PNG는 이미 압축돼 있다
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([zip], { type: "application/zip" }));
    a.download = `${id}-instagram.zip`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }

  async function share(post, p) {
    const files = post.map((img, n) => new File([img.blob], fileName(p * POST_LIMIT + n), { type: "image/png" }));
    try {
      await navigator.share({ files, title: episodeTitle || id });
    } catch {}
  }

  const toggle = (i) =>
    setSelected((s) => {
      const next = new Set(s);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  return (
    <div className="export">
      <div className="export-options">
        <div className="segmented" role="group" aria-label="크기">
          {Object.entries(SIZES).map(([k, v]) => (
            <button type="button" key={k} aria-pressed={size === k} onClick={() => setSize(k)}>
              {v.label}
            </button>
          ))}
        </div>
        <div className="segmented" role="group" aria-label="대사창">
          <button type="button" aria-pressed={box === "light"} onClick={() => setBox("light")}>
            밝은 대사창
          </button>
          <button type="button" aria-pressed={box === "dark"} onClick={() => setBox("dark")}>
            어두운 대사창
          </button>
        </div>
        <label className="check">
          <input type="checkbox" checked={mark} onChange={(e) => setMark(e.target.checked)} /> 사이트 이름 표시
        </label>
      </div>

      <details className="export-pick">
        <summary>
          포함할 장면 <strong>{picked.length}</strong> / {scenes.length}
        </summary>
        <div className="export-pick-tools">
          <button type="button" className="btn ghost small" onClick={() => setSelected(new Set(scenes.map((_, i) => i)))}>
            전체 선택
          </button>
          <button type="button" className="btn ghost small" onClick={() => setSelected(new Set())}>
            전체 해제
          </button>
          <button
            type="button"
            className="btn ghost small"
            onClick={() => setSelected(new Set(scenes.map((s, i) => (s.type === "dialogue" && s.lines.length ? i : -1)).filter((i) => i >= 0)))}
          >
            대사 장면만
          </button>
        </div>
        <ol className="export-pick-list">
          {scenes.map((s, i) => (
            <li key={i}>
              <label className="check">
                <input type="checkbox" checked={selected.has(i)} onChange={() => toggle(i)} />
                <span className="muted">{i + 1}</span>
                {s.type === "title"
                  ? `【${[s.title, s.subtitle].filter(Boolean).join(" · ")}】`
                  : s.type === "place"
                    ? `〔${s.name}〕`
                    : `${s.name ? `${s.name}: ` : ""}${s.lines[0] || "(대사 없음)"}`}
              </label>
            </li>
          ))}
        </ol>
      </details>

      <div className="export-bar">
        <span className="muted">
          {busy
            ? `그리는 중… ${Math.round(progress * 100)}%`
            : `이미지 ${images.length}장 · 게시물 ${posts.length}개 (인스타그램은 게시물당 최대 ${POST_LIMIT}장)`}
        </span>
        <button type="button" className="btn" onClick={downloadZip} disabled={busy || !images.length}>
          ZIP으로 받기
        </button>
      </div>

      {posts.map((post, p) => (
        <section key={p} className="export-post">
          <div className="export-post-head">
            <h2>
              게시물 {p + 1} <span className="muted">{post.length}장</span>
            </h2>
            {canShare && (
              <button type="button" className="btn ghost small" onClick={() => share(post, p)} disabled={busy}>
                사진에 저장 · 공유
              </button>
            )}
          </div>
          <ul className={`export-grid ${size}`}>
            {post.map((img, n) => (
              <li key={img.url}>
                <a href={img.url} download={fileName(p * POST_LIMIT + n)} title="이 이미지만 받기">
                  <img src={img.url} alt={`${img.index + 1}번 장면`} />
                </a>
                <span>{p * POST_LIMIT + n + 1}</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
