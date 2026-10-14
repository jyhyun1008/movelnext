"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import Stage from "./Stage";

const TYPE_SPEED = 45; // ms / 글자

function preload(scene) {
  if (!scene) return;
  for (const src of [scene.bg, ...scene.chars.map((c) => c.src)]) {
    if (src) new Image().src = src;
  }
}

export default function Player({ epid, scenes, theme, next }) {
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState({ index: 0, n: 0 });
  const [muted, setMuted] = useState(false);
  const [ended, setEnded] = useState(false);
  const bgmRef = useRef(null);

  const scene = scenes[index];
  const text = scene?.lines.join("\n") ?? "";
  const typed = progress.index === index ? progress.n : 0;
  const typing = typed < text.length;
  const last = scenes.length - 1;

  // 타이핑 효과
  useEffect(() => {
    if (!text) return;
    const timer = setInterval(() => {
      setProgress((p) => {
        const n = (p.index === index ? p.n : 0) + 1;
        if (n >= text.length) clearInterval(timer);
        return { index, n };
      });
    }, TYPE_SPEED);
    return () => clearInterval(timer);
  }, [index, text]);

  useEffect(() => preload(scenes[index + 1]), [index, scenes]);

  // 배경음악: 장면이 바뀌어도 같은 곡이면 이어서 재생
  useEffect(() => {
    const audio = (bgmRef.current ??= Object.assign(new Audio(), { loop: true }));
    const src = scene?.bgm;
    if (!src) {
      audio.pause();
      audio.removeAttribute("src");
      audio.dataset.src = "";
      return;
    }
    if (audio.dataset.src !== src) {
      audio.dataset.src = src;
      audio.src = src;
    }
    if (muted) audio.pause();
    else if (audio.paused) audio.play().catch(() => {});
  }, [scene?.bgm, muted]);

  useEffect(() => {
    if (scene?.sound && !muted) new Audio(scene.sound).play().catch(() => {});
    // 효과음은 장면 진입 시 한 번만
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  // 페이지를 벗어나면 소리 정지
  useEffect(() => () => bgmRef.current?.pause(), []);

  const advance = useCallback(() => {
    if (ended) return;
    if (typing) setProgress({ index, n: text.length });
    else if (index < last) setIndex(index + 1);
    else setEnded(true);
  }, [ended, typing, text, index, last]);

  const back = useCallback(() => {
    setEnded(false);
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  const restart = () => {
    setEnded(false);
    setIndex(0);
  };

  useEffect(() => {
    function onKey(e) {
      if (e.altKey || e.ctrlKey || e.metaKey || e.target.closest?.("input, textarea")) return;
      if (["ArrowRight", "ArrowDown", "Enter", " "].includes(e.key)) {
        e.preventDefault();
        advance();
      } else if (["ArrowLeft", "ArrowUp"].includes(e.key)) {
        e.preventDefault();
        back();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, back]);

  if (!scene) {
    return (
      <div className="wrap">
        <p className="empty">이 에피소드에는 아직 장면이 없습니다.</p>
      </div>
    );
  }

  const stop = (e) => e.stopPropagation();

  return (
    <Stage scene={scene} sceneKey={index} text={text.slice(0, typed)} showNext={!typing} theme={theme} onClick={advance}>
      <div className="stage-controls" onClick={stop}>
        <span className="count">
          {index + 1} / {scenes.length}
        </span>
        <button type="button" className="ctl" onClick={back} disabled={index === 0}>
          이전
        </button>
        <button type="button" className="ctl" onClick={() => setMuted((m) => !m)} aria-pressed={muted}>
          {muted ? "소리 켜기" : "소리 끄기"}
        </button>
        <Link className="ctl" href={`/raw/${epid}`}>
          대본
        </Link>
      </div>

      {ended && (
        <div className="stage-end" onClick={stop}>
          <p>끝</p>
          <div>
            <button type="button" className="ctl" onClick={restart}>
              처음부터
            </button>
            {next ? (
              <Link className="ctl primary" href={`/ep/${next}`}>
                다음 에피소드
              </Link>
            ) : (
              <Link className="ctl primary" href="/">
                목록으로
              </Link>
            )}
          </div>
        </div>
      )}
    </Stage>
  );
}
