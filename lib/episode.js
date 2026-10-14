// 에피소드 데이터 모델과 변환기. 서버·클라이언트(장면 편집기) 양쪽에서 쓰는 순수 함수만 둔다.
//
// 저장 형식 (episodes/<id>.json)
//   { theme: "#7174F6", scenes: [Scene] }
//   Scene = { id, type: "dialogue" | "title" | "place",
//             title, subtitle,          // type=title
//             name, text,               // type=dialogue (name만 쓰면 type=place의 장소 이름)
//             speaker,                  // 이름표 색을 가져올 캐릭터 폴더 (비우면 이름으로 자동 매칭)
//             bg, effect, bgm, sound,   // 미디어 파일 이름 (확장자 포함), 비우면 없음
//             chars: [{ chr, face, effect }] }
// 장면마다 값을 모두 가지고 있으므로 "이전 장면 유지" 같은 상속 규칙이 없다.

export const SCENE_TYPES = [
  ["dialogue", "대사"],
  ["title", "타이틀"],
  ["place", "장소"],
];

export const BG_EFFECTS = [
  ["", "효과 없음"],
  ["gray", "흑백"],
  ["sepia", "세피아"],
  ["blur", "흐림"],
];

export const CHAR_EFFECTS = [
  ["none", "효과 없음"],
  ["jump", "점프"],
  ["moveToCenter", "가운데로 이동"],
  ["moveToLeft", "왼쪽으로 퇴장"],
  ["moveToRight", "오른쪽으로 퇴장"],
  ["passToLeft", "오른쪽 → 왼쪽 지나가기"],
  ["passToRight", "왼쪽 → 오른쪽 지나가기"],
];

export const MAX_CHARS = 4;

const NAME_RE = /^[\p{L}\p{N}_-][\p{L}\p{N}_.-]*$/u;
const okName = (s) => typeof s === "string" && s.length <= 128 && NAME_RE.test(s) && !s.includes("..");
const str = (v, max) => (typeof v === "string" ? v.slice(0, max) : "");
const has = (list, v) => list.some(([k]) => k === v);

export function newId() {
  return Math.random().toString(36).slice(2, 10);
}

// 새 장면은 기준 장면의 배경·음악·캐릭터를 이어받는다 (움직임 효과는 초기화)
export function newScene(type = "dialogue", base) {
  return {
    id: newId(),
    type,
    title: "",
    subtitle: "",
    name: type === "dialogue" ? base?.name || "" : "",
    speaker: type === "dialogue" ? base?.speaker || "" : "",
    text: "",
    bg: base?.bg || "",
    effect: base?.effect || "",
    bgm: base?.bgm || "",
    sound: "",
    chars: type === "dialogue" ? (base?.chars || []).map((c) => ({ ...c, effect: "none" })) : [],
  };
}

export function normalizeEpisode(data) {
  const scenes = Array.isArray(data?.scenes) ? data.scenes : [];
  return {
    theme: /^#[0-9a-f]{6}$/i.test(data?.theme) ? data.theme : "",
    scenes: scenes.slice(0, 2000).map((s) => ({
      id: str(s?.id, 32) || newId(),
      type: has(SCENE_TYPES, s?.type) ? s.type : "dialogue",
      title: str(s?.title, 200),
      subtitle: str(s?.subtitle, 200),
      name: str(s?.name, 100),
      text: str(s?.text, 2000),
      bg: okName(s?.bg) ? s.bg : "",
      effect: has(BG_EFFECTS, s?.effect) ? s.effect : "",
      bgm: okName(s?.bgm) ? s.bgm : "",
      sound: okName(s?.sound) ? s.sound : "",
      speaker: okName(s?.speaker) ? s.speaker : "",
      chars: (Array.isArray(s?.chars) ? s.chars : [])
        .filter((c) => okName(c?.chr) && okName(c?.face))
        .slice(0, MAX_CHARS)
        .map((c) => ({ chr: c.chr, face: c.face, effect: has(CHAR_EFFECTS, c.effect) ? c.effect : "none" })),
    })),
  };
}

export function episodeTitle(data) {
  const first = data?.scenes?.find((s) => s.type === "title");
  return { title: first?.title || "", subtitle: first?.subtitle || "" };
}

/* ---------- 데이터 → 플레이어용 장면 ---------- */

const POS = { left: -30, center: 50, right: 130 };
const SLOTS = { 1: [50], 2: [28, 72], 3: [20, 50, 80] };
const slotsFor = (n) => SLOTS[n] || Array.from({ length: n }, (_, i) => ((i + 1) * 100) / (n + 1));
const enc = encodeURIComponent;
const url = (kind, name) => (name ? `/media/${kind}/${enc(name)}` : null);

// 배경색 위 글자가 읽히도록 밝은 색이면 어두운 글자를 쓴다
export function readableOn(hex) {
  const n = parseInt(hex.slice(1), 16);
  const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.45 ? "#16181d" : "#ffffff";
}

// 이름표 색: 지정한 캐릭터 → 이름이 같은 캐릭터 → 없음(에피소드 색)
export function speakerColor(scene, characters = {}) {
  const byId = scene.speaker && characters[scene.speaker];
  if (byId?.color) return byId.color;
  if (!scene.name) return null;
  const match = Object.values(characters).find((c) => c.name && c.name === scene.name.trim());
  return match?.color || null;
}

export function compileEpisode(data, characters = {}) {
  const scenes = [];
  let prev = null;
  let prevOut = null;

  for (const s of data?.scenes || []) {
    const chars = s.type === "dialogue" ? s.chars : [];
    const slots = slotsFor(chars.length);
    const out = {
      type: s.type,
      title: s.type === "title" ? s.title : "",
      subtitle: s.type === "title" ? s.subtitle : "",
      name: s.type === "title" ? "" : s.name,
      lines: s.type === "dialogue" && s.text ? s.text.split("\n") : [],
      nameColor: s.type === "dialogue" ? speakerColor(s, characters) : null,
      bg: url("bg", s.bg),
      effect: s.effect || null,
      bgm: url("bgm", s.bgm),
      sound: url("sound", s.sound),
      chars: chars.map((c, i) => {
        let from = slots[i];
        let to = slots[i];
        // 같은 인원 구성이 이어지면 이전 장면에서 멈춘 위치에 그대로 둔다
        const before = prevOut?.chars[i];
        if (prev && prev.type === "dialogue" && prev.chars.length === chars.length && prev.chars[i]?.chr === c.chr && before) {
          if (before.to >= 0 && before.to <= 100) from = to = before.to;
        }
        if (c.effect === "moveToCenter") to = POS.center;
        else if (c.effect === "moveToLeft") to = POS.left;
        else if (c.effect === "moveToRight") to = POS.right;
        else if (c.effect === "passToLeft") [from, to] = [POS.right, POS.left];
        else if (c.effect === "passToRight") [from, to] = [POS.left, POS.right];
        return { id: c.chr, src: `/media/chr/${enc(c.chr)}/${enc(c.face)}`, from, to, jump: c.effect === "jump" };
      }),
    };
    scenes.push(out);
    prev = s;
    prevOut = out;
  }

  return { ...episodeTitle(data), theme: data?.theme || null, scenes };
}

/* ---------- 예전 마크다운 대본 → 데이터 ---------- */
//   ```{ 옵션 객체 }```   ---   # 제목  ## 부제  ### 이름  > 대사
//   `bg=별칭` `bgm=별칭` `sound=별칭` `eff=별칭`  `캐릭터; 표정; 효과`
//   <!--bg--> <!--bgm--> <!--eff--> <!--chr-->  // 주석

function parseLooseObject(src) {
  const json = src
    .replace(/^\s*\/\/.*$/gm, "")
    .replace(/'([^'\\\n]*)'/g, '"$1"')
    .replace(/([{,]\s*)([^\s"'{}[\],:]+)\s*:/g, '$1"$2":')
    .replace(/,(\s*[}\]])/g, "$1");
  return JSON.parse(json);
}

const withExt = (name, ext) => (/\.[a-z0-9]{2,4}$/i.test(name) ? name : `${name}.${ext}`);

export function parseEpisodeMarkdown(source = "") {
  const warnings = [];
  let options = {};

  const text = source.replace(/\r\n?/g, "\n").replace(/^```[a-z]*\n([\s\S]*?)\n```\s*$/m, (_, body) => {
    try {
      options = parseLooseObject(body) || {};
    } catch (e) {
      warnings.push(`옵션 블록을 해석하지 못했습니다: ${e.message}`);
    }
    return "";
  });

  function lookup(group, key, no) {
    const value = options[group]?.[key];
    if (value != null) return String(value);
    warnings.push(`${no}번 장면: 옵션 '${group}'에 '${key}' 항목이 없어 그대로 파일 이름으로 씁니다.`);
    return key;
  }

  const scenes = [];
  let prev = newScene();

  for (const chunk of text.split(/^\s*-{3,}\s*$/m)) {
    const no = scenes.length + 1;
    const s = { ...newScene(), bg: "", bgm: "", effect: "", chars: [] };
    const lines = [];
    const keep = new Set();
    const charSpecs = [];

    for (const raw of chunk.split("\n")) {
      const line = raw.trim();
      if (!line || line.startsWith("//")) continue;
      let m;
      if ((m = line.match(/^###\s*(.*)$/))) s.name = m[1].trim();
      else if ((m = line.match(/^##\s*(.*)$/))) s.subtitle = m[1].trim();
      else if ((m = line.match(/^#\s*(.*)$/))) s.title = m[1].trim();
      else if ((m = line.match(/^>\s?(.*)$/))) lines.push(m[1].trimEnd());
      else {
        for (const [, tag] of line.matchAll(/<!--\s*(\w+)\s*-->/g)) keep.add(tag);
        for (const [, token] of line.matchAll(/`([^`]+)`/g)) {
          if (token.includes(";")) {
            charSpecs.push(token.split(";").map((x) => x.trim()));
            continue;
          }
          const [key, value] = token.split("=").map((x) => x.trim());
          if (!value) continue;
          if (key === "bg") s.bg = withExt(lookup("bg", value, no), "png");
          else if (key === "bgm") s.bgm = withExt(lookup("bgm", value, no), "mp3");
          else if (key === "sound") s.sound = withExt(lookup("sound", value, no), "mp3");
          else if (key === "eff") s.effect = lookup("effect", value, no);
        }
      }
    }

    if (!s.bg && keep.has("bg")) s.bg = prev.bg;
    if (!s.bgm && keep.has("bgm")) s.bgm = prev.bgm;
    if (!s.effect && keep.has("eff")) s.effect = prev.effect;
    if (charSpecs.length) {
      s.chars = charSpecs.map(([who, face = "", eff = ""]) => ({
        chr: lookup("chr", who, no),
        face: withExt(face ? lookup("chr_facial", face, no) : "none", "png"),
        effect: eff ? lookup("chr_effect", eff, no) : "none",
      }));
    } else if (keep.has("chr")) {
      s.chars = prev.chars.map((c) => ({ ...c, effect: "none" }));
    }

    s.text = lines.join("\n");
    s.type = s.title || s.subtitle ? "title" : s.name && !lines.length && !s.chars.length ? "place" : "dialogue";
    if (s.type === "title") s.name = "";

    const empty = !s.title && !s.subtitle && !s.name && !s.text && !s.chars.length && !s.bg;
    if (empty) continue;
    scenes.push(s);
    prev = s;
  }

  return {
    data: normalizeEpisode({ theme: typeof options.theme === "string" ? options.theme : "", scenes }),
    warnings: [...new Set(warnings)],
  };
}
