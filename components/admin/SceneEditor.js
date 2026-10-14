"use client";

import { DndContext, KeyboardSensor, PointerSensor, TouchSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { saveEpisodeData } from "@/app/admin/actions";
import Stage from "@/components/Stage";
import { BG_EFFECTS, CHAR_EFFECTS, MAX_CHARS, SCENE_TYPES, compileEpisode, newId, newScene, parseEpisodeMarkdown, speakerColor } from "@/lib/episode";

const enc = encodeURIComponent;
const stem = (name) => name.replace(/\.[^.]+$/, "");
const bgUrl = (name) => `/media/bg/${enc(name)}`;
const faceUrl = (chr, face) => `/media/chr/${enc(chr)}/${enc(face)}`;

function summary(s) {
  if (s.type === "title") return [s.title, s.subtitle].filter(Boolean).join(" · ") || "타이틀";
  if (s.type === "place") return s.name || "장소";
  const line = s.text.split("\n")[0];
  return line || (s.chars.length ? "(대사 없음)" : "(빈 장면)");
}

/* ---------- 장면 목록 한 줄 ---------- */

function SceneRow({ scene, index, active, onSelect, rowRef, color }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: scene.id });
  return (
    <li
      ref={(el) => {
        setNodeRef(el);
        rowRef(el);
      }}
      className={`se-row ${active ? "active" : ""} ${isDragging ? "dragging" : ""}`}
      style={{ transform: CSS.Translate.toString(transform), transition }}
    >
      <button type="button" className="handle" ref={setActivatorNodeRef} {...attributes} {...listeners} aria-label="끌어서 순서 바꾸기">
        <span />
      </button>
      <button type="button" className="se-row-main" onClick={onSelect}>
        <span className="se-no">{index + 1}</span>
        <span className="se-thumb" style={scene.bg ? { backgroundImage: `url("${bgUrl(scene.bg)}")` } : undefined}>
          {scene.chars.slice(0, 2).map((c, i) => (
            <img key={i} src={faceUrl(c.chr, c.face)} alt="" />
          ))}
        </span>
        <span className="se-sum">
          {scene.type === "dialogue" ? (
            scene.name && <small style={color ? { color } : undefined}>{scene.name}</small>
          ) : (
            <small className="se-type">{scene.type === "title" ? "타이틀" : "장소"}</small>
          )}
          <span>{summary(scene)}</span>
        </span>
      </button>
    </li>
  );
}

/* ---------- 썸네일 고르기 줄 ---------- */

function Strip({ items, value, onChange, none, tall }) {
  return (
    <div className={`strip ${tall ? "tall" : ""}`}>
      {none && (
        <button type="button" aria-pressed={!value} onClick={() => onChange("")} className="strip-none">
          {none}
        </button>
      )}
      {items.map((it) => (
        <button type="button" key={it.value} aria-pressed={value === it.value} onClick={() => onChange(it.value)} title={it.label}>
          <img src={it.src} alt="" loading="lazy" />
          <span>{it.label}</span>
        </button>
      ))}
    </div>
  );
}

/* ---------- 소리 선택 ---------- */

function SoundSelect({ label, kind, value, files, onChange, player }) {
  const src = value ? `/media/${kind}/${enc(value)}` : null;
  const playing = player.current === src && src;
  return (
    <label className="field">
      <span>{label}</span>
      <div className="sound-row">
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">없음</option>
          {files.map((f) => (
            <option key={f} value={f}>
              {stem(f)}
            </option>
          ))}
          {value && !files.includes(value) && <option value={value}>{value} (파일 없음)</option>}
        </select>
        <button type="button" className="btn ghost small" disabled={!src} onClick={() => player.toggle(src)}>
          {playing ? "■ 정지" : "▶ 듣기"}
        </button>
      </div>
    </label>
  );
}

/* ---------- 장면 편집 칸 ---------- */

function SceneFields({ scene, onChange, media, names, player, characters }) {
  const set = (patch) => onChange({ ...scene, ...patch });
  const setChar = (i, patch) => set({ chars: scene.chars.map((c, j) => (j === i ? { ...c, ...patch } : c)) });
  const filesOf = (chr) => media.chr.find((c) => c.name === chr)?.files || [];
  const defaultFace = (chr) => {
    const files = filesOf(chr);
    return files.find((f) => stem(f) === "none") || files[0] || "none.png";
  };

  function addChar() {
    const used = new Set(scene.chars.map((c) => c.chr));
    const chr = media.chr.find((c) => !used.has(c.name))?.name || media.chr[0]?.name;
    if (!chr) return;
    set({ chars: [...scene.chars, { chr, face: defaultFace(chr), effect: "none" }] });
  }

  return (
    <div className="se-fields">
      <div className="segmented" role="group" aria-label="장면 종류">
        {SCENE_TYPES.map(([k, label]) => (
          <button type="button" key={k} aria-pressed={scene.type === k} onClick={() => set({ type: k })}>
            {label}
          </button>
        ))}
      </div>

      {scene.type === "title" && (
        <div className="field-grid">
          <label className="field">
            <span>제목</span>
            <input type="text" value={scene.title} onChange={(e) => set({ title: e.target.value })} />
          </label>
          <label className="field">
            <span>부제</span>
            <input type="text" value={scene.subtitle} onChange={(e) => set({ subtitle: e.target.value })} />
          </label>
        </div>
      )}

      {scene.type === "place" && (
        <label className="field">
          <span>장소 이름</span>
          <input type="text" value={scene.name} onChange={(e) => set({ name: e.target.value })} placeholder="예: 2학년 3반 교실" />
        </label>
      )}

      {scene.type === "dialogue" && (
        <>
          <label className="field">
            <span>말하는 사람</span>
            <input type="text" list="speaker-names" value={scene.name} onChange={(e) => set({ name: e.target.value })} placeholder="비우면 내레이션" />
          </label>
          <SpeakerPicker scene={scene} characters={characters} onChange={set} />
          <label className="field">
            <span>대사</span>
            <textarea rows={3} value={scene.text} onChange={(e) => set({ text: e.target.value })} placeholder="줄바꿈한 그대로 표시됩니다." />
          </label>
          <datalist id="speaker-names">
            {names.map((n) => (
              <option key={n} value={n} />
            ))}
          </datalist>
        </>
      )}

      <fieldset className="se-group">
        <legend>배경</legend>
        <Strip
          items={media.bg.map((f) => ({ value: f, label: stem(f), src: bgUrl(f) }))}
          value={scene.bg}
          onChange={(bg) => set({ bg })}
          none="없음"
        />
        <label className="field inline-field">
          <span>배경 효과</span>
          <select value={scene.effect} onChange={(e) => set({ effect: e.target.value })}>
            {BG_EFFECTS.map(([k, label]) => (
              <option key={k} value={k}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </fieldset>

      {scene.type === "dialogue" && (
        <fieldset className="se-group">
          <legend>캐릭터</legend>
          {scene.chars.length === 0 && <p className="hint">화면에 나오는 캐릭터가 없습니다.</p>}
          {scene.chars.map((c, i) => (
            <div className="se-char" key={i}>
              <div className="se-char-head">
                <select value={c.chr} onChange={(e) => setChar(i, { chr: e.target.value, face: defaultFace(e.target.value) })}>
                  {media.chr.map((m) => (
                    <option key={m.name} value={m.name}>
                      {m.name}
                    </option>
                  ))}
                  {!media.chr.some((m) => m.name === c.chr) && <option value={c.chr}>{c.chr} (폴더 없음)</option>}
                </select>
                <select value={c.effect} onChange={(e) => setChar(i, { effect: e.target.value })}>
                  {CHAR_EFFECTS.map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
                <div className="row-tools">
                  <button
                    type="button"
                    className="linklike"
                    disabled={i === 0}
                    onClick={() => set({ chars: arrayMove(scene.chars, i, i - 1) })}
                    aria-label="왼쪽으로"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    className="linklike"
                    disabled={i === scene.chars.length - 1}
                    onClick={() => set({ chars: arrayMove(scene.chars, i, i + 1) })}
                    aria-label="오른쪽으로"
                  >
                    →
                  </button>
                  <button type="button" className="linklike danger-text" onClick={() => set({ chars: scene.chars.filter((_, j) => j !== i) })}>
                    빼기
                  </button>
                </div>
              </div>
              <Strip
                tall
                items={filesOf(c.chr).map((f) => ({ value: f, label: stem(f), src: faceUrl(c.chr, f) }))}
                value={c.face}
                onChange={(face) => setChar(i, { face })}
              />
            </div>
          ))}
          <button type="button" className="btn ghost small" onClick={addChar} disabled={scene.chars.length >= MAX_CHARS || !media.chr.length}>
            + 캐릭터 추가
          </button>
        </fieldset>
      )}

      <fieldset className="se-group">
        <legend>소리</legend>
        <div className="field-grid">
          <SoundSelect label="배경음악" kind="bgm" value={scene.bgm} files={media.bgm} onChange={(bgm) => set({ bgm })} player={player} />
          <SoundSelect label="효과음" kind="sound" value={scene.sound} files={media.sound} onChange={(sound) => set({ sound })} player={player} />
        </div>
        <p className="hint">배경음악은 다음 장면에서도 같은 곡이면 끊기지 않고 이어집니다.</p>
      </fieldset>
    </div>
  );
}

/* ---------- 이름표 색 ---------- */

function SpeakerPicker({ scene, characters, onChange }) {
  const list = Object.entries(characters).filter(([, c]) => c.color);
  if (!list.length) return null;
  const auto = speakerColor({ ...scene, speaker: "" }, characters);
  return (
    <div className="speaker-row" role="group" aria-label="이름표 색">
      <span>이름표 색</span>
      <button type="button" className="speaker-chip" aria-pressed={!scene.speaker} style={{ "--c": auto || undefined }} onClick={() => onChange({ speaker: "" })}>
        <i />
        자동{auto ? "" : " (기본색)"}
      </button>
      {list.map(([id, c]) => (
        <button
          type="button"
          key={id}
          className="speaker-chip"
          aria-pressed={scene.speaker === id}
          style={{ "--c": c.color }}
          onClick={() => onChange({ speaker: id, ...(scene.name ? {} : { name: c.name || id }) })}
        >
          <i />
          {c.name || id}
        </button>
      ))}
    </div>
  );
}

/* ---------- 텍스트로 가져오기 ---------- */

function ImportDialog({ onClose, onImport }) {
  const [text, setText] = useState("");
  const parsed = useMemo(() => (text.trim() ? parseEpisodeMarkdown(text) : null), [text]);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="텍스트로 가져오기">
        <h2>텍스트로 가져오기</h2>
        <p className="hint">
          긴 대본은 예전 마크다운 문법으로 한꺼번에 붙여 넣은 뒤 편집기에서 다듬을 수 있습니다. 장면은 <code>---</code>로 나누고, <code>### 이름</code>{" "}
          다음 줄에 <code>&gt; 대사</code>를 씁니다.
        </p>
        <textarea
          className="code"
          rows={12}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"### 파이\n> 안녕!\n---\n### 이나\n> 반가워.\n> 잘 부탁해."}
          autoFocus
        />
        {parsed && (
          <p className="hint">
            장면 {parsed.data.scenes.length}개를 찾았습니다.
            {parsed.warnings.length > 0 && <span className="danger-text"> 경고 {parsed.warnings.length}건: {parsed.warnings[0]}</span>}
          </p>
        )}
        <div className="actions">
          <button type="button" className="btn ghost" onClick={onClose}>
            취소
          </button>
          <button type="button" className="btn" disabled={!parsed?.data.scenes.length} onClick={() => onImport(parsed.data)}>
            선택한 장면 뒤에 추가
          </button>
        </div>
      </div>
    </div>
  );
}

/* ---------- 편집기 ---------- */

function useAudioPreview() {
  const audio = useRef(null);
  const [current, setCurrent] = useState(null);
  useEffect(() => () => audio.current?.pause(), []);
  return {
    current,
    toggle(src) {
      audio.current ??= new Audio();
      const a = audio.current;
      if (current === src) {
        a.pause();
        setCurrent(null);
        return;
      }
      a.src = src;
      a.onended = () => setCurrent(null);
      a.play().catch(() => setCurrent(null));
      setCurrent(src);
    },
  };
}

export default function SceneEditor({ id, initial, media, siteTheme, characters }) {
  const [data, setData] = useState(initial.data);
  const [published, setPublished] = useState(initial.published);
  const [saved, setSaved] = useState({ data: initial.data, published: initial.published });
  const [selectedId, setSelectedId] = useState(initial.data.scenes[0]?.id ?? null);
  const [status, setStatus] = useState(null);
  const [importing, setImporting] = useState(false);
  const [saving, startSaving] = useTransition();
  const rows = useRef(new Map());
  const player = useAudioPreview();
  const dirty = data !== saved.data || published !== saved.published;

  const compiled = useMemo(() => compileEpisode(data, characters), [data, characters]);
  const index = Math.max(0, data.scenes.findIndex((s) => s.id === selectedId));
  const scene = data.scenes[index];
  const names = useMemo(() => [...new Set(data.scenes.map((s) => s.type === "dialogue" && s.name).filter(Boolean))], [data]);
  const theme = data.theme || siteTheme;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useEffect(() => {
    if (!dirty) return;
    const warn = (e) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  useEffect(() => {
    rows.current.get(selectedId)?.scrollIntoView({ block: "nearest" });
  }, [selectedId]);

  const setScenes = (fn) => setData((d) => ({ ...d, scenes: fn(d.scenes) }));
  const updateScene = (s) => setScenes((ss) => ss.map((x) => (x.id === s.id ? s : x)));

  function insertAfter(newScenes) {
    setScenes((ss) => {
      const at = ss.findIndex((s) => s.id === selectedId) + 1;
      return [...ss.slice(0, at), ...newScenes, ...ss.slice(at)];
    });
    setSelectedId(newScenes[0].id);
  }

  function removeScene() {
    if (!scene || !window.confirm(`${index + 1}번 장면을 삭제할까요?`)) return;
    const next = data.scenes[index + 1] || data.scenes[index - 1];
    setScenes((ss) => ss.filter((s) => s.id !== scene.id));
    setSelectedId(next?.id ?? null);
  }

  function onDragEnd({ active, over }) {
    if (!over || active.id === over.id) return;
    setScenes((ss) => arrayMove(ss, ss.findIndex((s) => s.id === active.id), ss.findIndex((s) => s.id === over.id)));
  }

  function save() {
    setStatus(null);
    const snapshot = { data, published };
    startSaving(async () => {
      const res = await saveEpisodeData(id, snapshot.data, snapshot.published);
      if (res?.error) return setStatus({ error: res.error });
      setSaved(snapshot);
      setStatus({ ok: true });
    });
  }

  useEffect(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (dirty && !saving) save();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  return (
    <div className="scene-editor">
      <div className="builder-toolbar">
        <label className="check">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} /> 공개
        </label>
        <label className="check" title="이 에피소드의 이름표·버튼 색">
          <input type="color" value={theme} onChange={(e) => setData((d) => ({ ...d, theme: e.target.value }))} />
          {data.theme ? (
            <button type="button" className="linklike" onClick={() => setData((d) => ({ ...d, theme: "" }))}>
              사이트 색으로
            </button>
          ) : (
            <span className="muted">사이트 색</span>
          )}
        </label>
        <button type="button" className="btn ghost small" onClick={() => setImporting(true)}>
          텍스트로 가져오기
        </button>
        <span className="toolbar-status">
          {status?.error ? (
            <span className="danger-text">{status.error}</span>
          ) : dirty ? (
            "저장하지 않은 변경 사항이 있습니다"
          ) : status?.ok ? (
            <>
              저장했습니다 · <a href={`/ep/${id}`} target="_blank">미리보기</a>
            </>
          ) : null}
        </span>
        <button type="button" className="btn" onClick={save} disabled={saving || !dirty}>
          {saving ? "저장 중…" : "저장"}
        </button>
      </div>

      <div className="se-layout">
        <aside className="se-list">
          <div className="se-list-head">
            <strong>장면 {data.scenes.length}개</strong>
          </div>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={data.scenes.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              <ol className="se-rows">
                {data.scenes.map((s, i) => (
                  <SceneRow
                    key={s.id}
                    scene={s}
                    index={i}
                    active={s.id === scene?.id}
                    color={compiled.scenes[i]?.nameColor}
                    onSelect={() => setSelectedId(s.id)}
                    rowRef={(el) => (el ? rows.current.set(s.id, el) : rows.current.delete(s.id))}
                  />
                ))}
              </ol>
            </SortableContext>
          </DndContext>
          <div className="se-add">
            {SCENE_TYPES.map(([k, label]) => (
              <button type="button" key={k} className="btn ghost small" onClick={() => insertAfter([newScene(k, scene)])}>
                + {label}
              </button>
            ))}
          </div>
        </aside>

        <section className="se-detail">
          {scene ? (
            <>
              <Stage
                className="preview-stage"
                scene={compiled.scenes[index]}
                sceneKey={scene.id}
                text={compiled.scenes[index].lines.join("\n")}
                theme={theme}
              />
              <div className="se-nav">
                <button type="button" className="btn ghost small" disabled={index === 0} onClick={() => setSelectedId(data.scenes[index - 1].id)}>
                  ← 이전
                </button>
                <span className="muted">
                  {index + 1} / {data.scenes.length}
                </span>
                <button
                  type="button"
                  className="btn ghost small"
                  disabled={index === data.scenes.length - 1}
                  onClick={() => setSelectedId(data.scenes[index + 1].id)}
                >
                  다음 →
                </button>
                <span className="se-nav-gap" />
                <button type="button" className="btn ghost small" onClick={() => insertAfter([{ ...scene, id: newId(), chars: scene.chars.map((c) => ({ ...c })) }])}>
                  복제
                </button>
                <button type="button" className="btn danger small" onClick={removeScene}>
                  삭제
                </button>
              </div>
              <SceneFields scene={scene} onChange={updateScene} media={media} names={names} player={player} characters={characters} />
            </>
          ) : (
            <div className="se-empty">
              <p>장면이 없습니다. 왼쪽에서 장면을 추가하세요.</p>
            </div>
          )}
        </section>
      </div>

      {importing && (
        <ImportDialog
          onClose={() => setImporting(false)}
          onImport={(imported) => {
            if (!data.theme && imported.theme) setData((d) => ({ ...d, theme: imported.theme }));
            if (data.scenes.length) insertAfter(imported.scenes);
            else {
              setScenes(() => imported.scenes);
              setSelectedId(imported.scenes[0].id);
            }
            setImporting(false);
          }}
        />
      )}
    </div>
  );
}
