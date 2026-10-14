"use client";

import { useLayoutEffect, useRef } from "react";
import { readableOn } from "@/lib/episode";

const EFFECTS = new Set(["gray", "sepia", "blur"]);

function Character({ chr }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el?.animate) return;
    if (chr.from !== chr.to) {
      const passing = Math.abs(chr.to - chr.from) > 100;
      el.animate([{ left: `${chr.from}%` }, { left: `${chr.to}%` }], {
        duration: passing ? 1000 : 500,
        easing: "ease-in-out",
      });
    }
    if (chr.jump) {
      el.animate(
        [{ translate: "0 0" }, { translate: "0 -6%", offset: 0.35 }, { translate: "0 0", offset: 0.7 }, { translate: "0 -2%" }, { translate: "0 0" }],
        { duration: 600, easing: "ease-out" },
      );
    }
    // 움직임 값이 바뀔 때만 다시 재생 (편집 중 글자 입력으로 반복되지 않도록)
  }, [chr.from, chr.to, chr.jump]);
  return (
    <div ref={ref} className="chr" style={{ left: `${chr.to}%` }}>
      <img src={chr.src} alt="" draggable={false} />
    </div>
  );
}

// 플레이어와 장면 편집기 미리보기가 함께 쓰는 무대
export default function Stage({ scene, sceneKey, text, showNext, theme, className = "", onClick, children }) {
  const isTitle = scene.type === "title";
  const isPlace = scene.type === "place";
  return (
    <div className={`stage ${className}`} style={{ "--accent-ep": theme }} onClick={onClick}>
      {scene.bg && (
        <div
          key={scene.bg}
          className={`stage-bg ${EFFECTS.has(scene.effect) ? scene.effect : ""}`}
          style={{ backgroundImage: `url("${scene.bg}")` }}
        />
      )}

      {!isTitle && (
        <div className="stage-chars">
          {scene.chars.map((c, i) => (
            <Character key={`${sceneKey}-${i}`} chr={c} />
          ))}
        </div>
      )}

      {isTitle && (
        <div className="stage-title" key={`t${sceneKey}`}>
          <strong>{scene.title}</strong>
          {scene.subtitle && <span>{scene.subtitle}</span>}
        </div>
      )}

      {isPlace && scene.name && (
        <div className="stage-place" key={`p${sceneKey}`}>
          {scene.name}
        </div>
      )}

      {scene.type === "dialogue" && scene.lines.length > 0 && (
        <div className="dialogue">
          <div
            className={`dialogue-name ${scene.name ? "" : "empty"}`}
            style={scene.nameColor ? { background: scene.nameColor, color: readableOn(scene.nameColor) } : undefined}
          >
            {scene.name || "\u00a0"}
          </div>
          <div className="dialogue-text" aria-live="polite">
            {text}
          </div>
          {showNext && <span className="dialogue-next" aria-hidden />}
        </div>
      )}

      {children}
    </div>
  );
}
