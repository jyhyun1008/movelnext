"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useEffect, useRef, useState, useTransition } from "react";
import { savePageCards, uploadThumb } from "@/app/admin/actions";
import Cards from "@/components/Cards";
import { emptyCard, emptySection, newId } from "@/lib/cards";

/* ---------- 이미지 선택 ---------- */

function ImagePicker({ value, onChange, groups, onUploaded }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState(0);
  const [uploading, startUpload] = useTransition();
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  function upload(file) {
    if (!file) return;
    setError("");
    const fd = new FormData();
    fd.set("file", file);
    startUpload(async () => {
      const res = await uploadThumb(fd);
      if (res.error) return setError(res.error);
      onUploaded(res);
      onChange(res.src);
      setOpen(false);
    });
  }

  return (
    <div className="picker">
      <div className="picker-current">
        {value ? <img src={value} alt="" /> : <span className="picker-empty">이미지 없음</span>}
        <div className="picker-buttons">
          <button type="button" className="btn ghost small" onClick={() => setOpen((o) => !o)}>
            {open ? "닫기" : value ? "바꾸기" : "이미지 고르기"}
          </button>
          <button type="button" className="btn ghost small" onClick={() => fileRef.current?.click()} disabled={uploading}>
            {uploading ? "올리는 중…" : "새로 올리기"}
          </button>
          {value && (
            <button type="button" className="btn danger small" onClick={() => onChange("")}>
              빼기
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} />
        </div>
      </div>
      {error && <p className="notice error">{error}</p>}
      {open && (
        <div className="picker-panel">
          <div className="segmented">
            {groups.map((g, i) => (
              <button type="button" key={g.label} aria-pressed={tab === i} onClick={() => setTab(i)}>
                {g.label} <span className="muted">{g.items.length}</span>
              </button>
            ))}
          </div>
          {groups[tab].items.length === 0 ? (
            <p className="hint">아직 이미지가 없습니다. ‘새로 올리기’로 추가하세요.</p>
          ) : (
            <ul className="picker-grid">
              {groups[tab].items.map((it) => (
                <li key={it.src}>
                  <button
                    type="button"
                    aria-pressed={value === it.src}
                    onClick={() => {
                      onChange(it.src);
                      setOpen(false);
                    }}
                  >
                    <img src={it.src} alt="" loading="lazy" />
                    <span>{it.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- 링크 목록 ---------- */

function LinksEditor({ links, onChange, episodes }) {
  const update = (i, patch) => onChange(links.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const move = (i, d) => onChange(arrayMove(links, i, i + d));
  return (
    <div className="links-editor">
      {links.map((l, i) => (
        <div className="link-row" key={i}>
          <input type="text" value={l.label} placeholder="버튼 이름" onChange={(e) => update(i, { label: e.target.value })} />
          <input type="text" value={l.href} placeholder="/ep/ep001 또는 https://…" onChange={(e) => update(i, { href: e.target.value })} />
          <div className="row-tools">
            <button type="button" className="linklike" onClick={() => move(i, -1)} disabled={i === 0} aria-label="위로">
              ↑
            </button>
            <button type="button" className="linklike" onClick={() => move(i, 1)} disabled={i === links.length - 1} aria-label="아래로">
              ↓
            </button>
            <button type="button" className="linklike danger-text" onClick={() => onChange(links.filter((_, j) => j !== i))} aria-label="삭제">
              ✕
            </button>
          </div>
        </div>
      ))}
      <div className="link-add">
        <select
          value=""
          onChange={(e) => {
            const ep = episodes.find((x) => x.id === e.target.value);
            if (ep) onChange([...links, { label: ep.label, href: `/ep/${ep.id}` }]);
          }}
        >
          <option value="">+ 에피소드 연결</option>
          {episodes.map((ep) => (
            <option key={ep.id} value={ep.id}>
              {ep.label} ({ep.id})
            </option>
          ))}
        </select>
        <button type="button" className="btn ghost small" onClick={() => onChange([...links, { label: "", href: "" }])}>
          + 직접 입력
        </button>
      </div>
    </div>
  );
}

/* ---------- 카드 하나 ---------- */

function CardEditor({ card, open, onToggle, onChange, onRemove, onDuplicate, groups, episodes, onUploaded }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });
  const set = (patch) => onChange({ ...card, ...patch });
  return (
    <li
      ref={setNodeRef}
      className={`builder-card ${open ? "open" : ""} ${isDragging ? "dragging" : ""}`}
      style={{ transform: CSS.Translate.toString(transform), transition }}
    >
      <div className="builder-head">
        <button type="button" className="handle" ref={setActivatorNodeRef} {...attributes} {...listeners} aria-label="끌어서 순서 바꾸기">
          <span />
        </button>
        <button type="button" className="builder-summary" onClick={onToggle}>
          {card.image ? <img src={card.image} alt="" /> : <span className="noimg" />}
          <span className="builder-title">
            <strong>{card.title || "제목 없음"}</strong>
            {card.subtitle && <small>{card.subtitle}</small>}
          </span>
        </button>
        <div className="row-tools">
          <button type="button" className="linklike" onClick={onToggle}>
            {open ? "접기" : "편집"}
          </button>
          <button type="button" className="linklike" onClick={onDuplicate}>
            복제
          </button>
          <button
            type="button"
            className="linklike danger-text"
            onClick={() => window.confirm(`‘${card.title || "제목 없음"}’ 카드를 삭제할까요?`) && onRemove()}
          >
            삭제
          </button>
        </div>
      </div>

      {open && (
        <div className="builder-fields">
          <label className="field">
            <span>제목</span>
            <input type="text" value={card.title} onChange={(e) => set({ title: e.target.value })} placeholder="챕터 1 ‘결성’" />
          </label>
          <label className="field">
            <span>부제</span>
            <input type="text" value={card.subtitle} onChange={(e) => set({ subtitle: e.target.value })} placeholder="선택" />
          </label>
          <div className="field">
            <span className="field-label">썸네일</span>
            <ImagePicker value={card.image} onChange={(image) => set({ image })} groups={groups} onUploaded={onUploaded} />
          </div>
          <label className="field">
            <span>설명</span>
            <textarea rows={4} value={card.body} onChange={(e) => set({ body: e.target.value })} placeholder="**굵게**, [링크](주소) 정도의 간단한 마크다운을 쓸 수 있습니다." />
          </label>
          <div className="field">
            <span className="field-label">링크 버튼</span>
            <LinksEditor links={card.links} onChange={(links) => set({ links })} episodes={episodes} />
          </div>
        </div>
      )}
    </li>
  );
}

/* ---------- 섹션 하나의 카드 목록 ---------- */

function LayoutToggle({ value, onChange }) {
  return (
    <div className="segmented" role="group" aria-label="배치">
      <button type="button" aria-pressed={value === "list"} onClick={() => onChange("list")}>
        목록형
      </button>
      <button type="button" aria-pressed={value === "grid"} onClick={() => onChange("grid")}>
        그리드형
      </button>
    </div>
  );
}

function SectionCards({ section, onChange, openId, setOpenId, sensors, groups, episodes, onUploaded }) {
  const setCards = (fn) => onChange((s) => ({ ...s, cards: fn(s.cards) }));

  function addCard() {
    const card = emptyCard();
    setCards((cs) => [...cs, card]);
    setOpenId(card.id);
  }

  function onDragEnd({ active, over }) {
    if (!over || active.id === over.id) return;
    setCards((cs) => arrayMove(cs, cs.findIndex((c) => c.id === active.id), cs.findIndex((c) => c.id === over.id)));
  }

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={section.cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
          <ul className="builder-list">
            {section.cards.map((card) => (
              <CardEditor
                key={card.id}
                card={card}
                open={openId === card.id}
                onToggle={() => setOpenId((id) => (id === card.id ? null : card.id))}
                onChange={(next) => setCards((cs) => cs.map((c) => (c.id === next.id ? next : c)))}
                onRemove={() => setCards((cs) => cs.filter((c) => c.id !== card.id))}
                onDuplicate={() =>
                  setCards((cs) => {
                    const i = cs.findIndex((c) => c.id === card.id);
                    const copy = { ...card, id: newId(), links: card.links.map((l) => ({ ...l })) };
                    return [...cs.slice(0, i + 1), copy, ...cs.slice(i + 1)];
                  })
                }
                groups={groups}
                episodes={episodes}
                onUploaded={onUploaded}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
      <button type="button" className="add-card" onClick={addCard}>
        + 카드 추가
      </button>
    </>
  );
}

/* ---------- 편집기 ---------- */

export default function PageBuilder({ slug, initial, mediaGroups, episodes, mark, viewHref, multiSection }) {
  const [page, setPage] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [openId, setOpenId] = useState(null);
  const [groups, setGroups] = useState(mediaGroups);
  const [status, setStatus] = useState(null);
  const [saving, startSaving] = useTransition();
  const dirty = page !== saved;

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

  const updateSection = (id, fn) => setPage((p) => ({ ...p, sections: p.sections.map((s) => (s.id === id ? fn(s) : s)) }));

  function addSection() {
    const section = emptySection();
    setPage((p) => ({ ...p, sections: [...p.sections, section] }));
  }

  function moveSection(i, d) {
    setPage((p) => ({ ...p, sections: arrayMove(p.sections, i, i + d) }));
  }

  function removeSection(section) {
    if (section.cards.length && !window.confirm(`‘${section.title || "제목 없는 섹션"}’과 안의 카드 ${section.cards.length}장을 삭제할까요?`)) return;
    setPage((p) => ({ ...p, sections: p.sections.filter((s) => s.id !== section.id) }));
  }

  function onUploaded({ name, src }) {
    setGroups((gs) => gs.map((g, i) => (i === 0 && !g.items.some((it) => it.src === src) ? { ...g, items: [...g.items, { name, src }] } : g)));
  }

  function save() {
    setStatus(null);
    const snapshot = page;
    startSaving(async () => {
      const res = await savePageCards(slug, snapshot);
      if (res?.error) return setStatus({ error: res.error });
      setSaved(snapshot);
      setStatus({ ok: true });
    });
  }

  const single = !multiSection;
  const first = page.sections[0];
  const sectionProps = { openId, setOpenId, sensors, groups, episodes, onUploaded };

  return (
    <div className="builder">
      <div className="builder-toolbar">
        {single && first && (
          <LayoutToggle value={first.layout} onChange={(layout) => updateSection(first.id, (s) => ({ ...s, layout }))} />
        )}
        <span className="toolbar-status">
          {status?.error ? (
            <span className="danger-text">{status.error}</span>
          ) : dirty ? (
            "저장하지 않은 변경 사항이 있습니다"
          ) : status?.ok ? (
            <>
              저장했습니다 · <a href={viewHref} target="_blank">사이트에서 보기</a>
            </>
          ) : null}
        </span>
        <button type="button" className="btn" onClick={save} disabled={saving || !dirty}>
          {saving ? "저장 중…" : "저장"}
        </button>
      </div>

      <div className="split">
        <div>
          {single ? (
            first && <SectionCards section={first} onChange={(fn) => updateSection(first.id, fn)} {...sectionProps} />
          ) : (
            <>
              {page.sections.length === 0 && <p className="hint">섹션을 추가해 소제목과 카드 목록을 만들어 보세요.</p>}
              {page.sections.map((section, i) => (
                <div className="builder-section" key={section.id}>
                  <div className="builder-section-head">
                    <input
                      type="text"
                      value={section.title}
                      placeholder="소제목 (예: 공지, 굿즈, 활동)"
                      onChange={(e) => updateSection(section.id, (s) => ({ ...s, title: e.target.value }))}
                    />
                    <LayoutToggle value={section.layout} onChange={(layout) => updateSection(section.id, (s) => ({ ...s, layout }))} />
                    <div className="row-tools">
                      <button type="button" className="linklike" disabled={i === 0} onClick={() => moveSection(i, -1)} aria-label="섹션 위로">
                        ↑
                      </button>
                      <button
                        type="button"
                        className="linklike"
                        disabled={i === page.sections.length - 1}
                        onClick={() => moveSection(i, 1)}
                        aria-label="섹션 아래로"
                      >
                        ↓
                      </button>
                      <button type="button" className="linklike danger-text" onClick={() => removeSection(section)}>
                        섹션 삭제
                      </button>
                    </div>
                  </div>
                  <SectionCards section={section} onChange={(fn) => updateSection(section.id, fn)} {...sectionProps} />
                </div>
              ))}
              <button type="button" className="add-card add-section" onClick={addSection}>
                + 섹션 추가
              </button>
            </>
          )}
        </div>
        <div className="preview page-preview">
          <Cards page={page} mark={mark} />
        </div>
      </div>
    </div>
  );
}
