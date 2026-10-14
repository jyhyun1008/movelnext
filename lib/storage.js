import fs from "node:fs/promises";
import path from "node:path";
import { markdownToPage, normalizePage } from "./cards";
import { normalizeEpisode, parseEpisodeMarkdown } from "./episode";

const DATA_DIR = path.resolve(process.env.DATA_DIR || "data");
const SEED_DIR = path.resolve("seed");

export const MEDIA_KINDS = ["bg", "chr", "thumb", "bgm", "sound"];

const NAME_RE = /^[\p{L}\p{N}_-][\p{L}\p{N}_.-]*$/u;
const ID_RE = /^[a-z0-9_-]{1,64}$/i;

export function isValidName(name) {
  return typeof name === "string" && name.length <= 128 && NAME_RE.test(name) && !name.includes("..");
}

export function isValidId(id) {
  return typeof id === "string" && ID_RE.test(id);
}

// 서버 실행 중에 data 폴더를 지워도 다음 요청에서 다시 채워지도록 매번 확인한다
let seeding = null;
async function ensureData() {
  try {
    await fs.access(path.join(DATA_DIR, "settings.json"));
  } catch {
    seeding ??= (async () => {
      await fs.mkdir(DATA_DIR, { recursive: true });
      await fs.cp(SEED_DIR, DATA_DIR, { recursive: true, force: false, errorOnExist: false });
    })().finally(() => (seeding = null));
    await seeding;
  }
}

async function dataPath(...parts) {
  await ensureData();
  return path.join(DATA_DIR, ...parts);
}

async function readText(file, fallback = null) {
  try {
    return await fs.readFile(file, "utf8");
  } catch (e) {
    if (e.code === "ENOENT") return fallback;
    throw e;
  }
}

// 쓰기 도중 프로세스가 죽어도 파일이 깨지지 않도록 임시 파일 후 rename
async function writeText(file, text) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(tmp, text, "utf8");
  await fs.rename(tmp, file);
}

async function readJson(file, fallback) {
  const text = await readText(file);
  return text == null ? fallback : JSON.parse(text);
}

const writeJson = (file, value) => writeText(file, JSON.stringify(value, null, 2) + "\n");

/* ---------- settings ---------- */

const DEFAULT_SETTINGS = {
  title: "MOVEL",
  description: "",
  author: "",
  theme: "#611FDA",
  headingMark: "",
  heroImage: "",
  menus: [],
};

export async function getSettings() {
  const saved = await readJson(await dataPath("settings.json"), {});
  return { ...DEFAULT_SETTINGS, ...saved };
}

export async function saveSettings(settings) {
  await writeJson(await dataPath("settings.json"), settings);
}

/* ---------- characters ---------- */

// { [캐릭터 폴더]: { name: "표시 이름", color: "#rrggbb" | "" } }
export async function getCharacters() {
  return readJson(await dataPath("characters.json"), {});
}

export async function saveCharacters(map) {
  const clean = {};
  for (const [id, c] of Object.entries(map)) {
    if (!isValidName(id)) continue;
    clean[id] = {
      name: String(c?.name || "").trim().slice(0, 50),
      color: /^#[0-9a-f]{6}$/i.test(c?.color) ? c.color.toLowerCase() : "",
    };
  }
  await writeJson(await dataPath("characters.json"), clean);
}

/* ---------- pages (cards) ---------- */

// pages/<slug>.json 이 없으면 예전 마크다운(<slug>.md)을 카드로 변환해서 돌려준다
export async function getPage(slug) {
  if (!isValidId(slug)) return null;
  const json = await readJson(await dataPath("pages", `${slug}.json`), null);
  if (json) return normalizePage(json);
  const md = await readText(await dataPath("pages", `${slug}.md`));
  return md == null ? null : markdownToPage(md);
}

export async function savePage(slug, page) {
  if (!isValidId(slug)) throw new Error("잘못된 페이지 주소입니다.");
  await writeJson(await dataPath("pages", `${slug}.json`), normalizePage(page));
  await fs.rm(await dataPath("pages", `${slug}.md`), { force: true });
}

/* ---------- episodes ---------- */

export async function listEpisodes() {
  return readJson(await dataPath("episodes.json"), []);
}

async function saveEpisodeIndex(list) {
  await writeJson(await dataPath("episodes.json"), list);
}

// episodes/<id>.json 이 없으면 예전 마크다운(<id>.md)을 변환해서 돌려준다
export async function getEpisode(id) {
  if (!isValidId(id)) return null;
  const meta = (await listEpisodes()).find((e) => e.id === id);
  if (!meta) return null;
  const json = await readJson(await dataPath("episodes", `${id}.json`), null);
  if (json) return { ...meta, data: normalizeEpisode(json) };
  const md = await readText(await dataPath("episodes", `${id}.md`), "");
  return { ...meta, data: parseEpisodeMarkdown(md).data };
}

export async function saveEpisode(id, { data, published }) {
  if (!isValidId(id)) throw new Error("에피소드 ID는 영문, 숫자, -, _ 만 쓸 수 있습니다.");
  const list = await listEpisodes();
  const existing = list.find((e) => e.id === id);
  if (existing) existing.published = published;
  else list.push({ id, published });
  await writeJson(await dataPath("episodes", `${id}.json`), normalizeEpisode(data));
  await fs.rm(await dataPath("episodes", `${id}.md`), { force: true });
  await saveEpisodeIndex(list);
}

export async function deleteEpisode(id) {
  const list = await listEpisodes();
  await saveEpisodeIndex(list.filter((e) => e.id !== id));
  if (!isValidId(id)) return;
  for (const ext of ["json", "md"]) await fs.rm(await dataPath("episodes", `${id}.${ext}`), { force: true });
}

export async function moveEpisode(id, delta) {
  const list = await listEpisodes();
  const from = list.findIndex((e) => e.id === id);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= list.length) return;
  [list[from], list[to]] = [list[to], list[from]];
  await saveEpisodeIndex(list);
}

/* ---------- media ---------- */

// segments: ["bg", "classroom.png"] 또는 ["chr", "Pie", "none.png"]
export async function mediaPath(segments) {
  if (!MEDIA_KINDS.includes(segments[0])) return null;
  if (!segments.slice(1).every(isValidName)) return null;
  const depth = segments[0] === "chr" ? 3 : 2;
  if (segments.length !== depth) return null;
  return dataPath("media", ...segments);
}

async function listFiles(dir) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
      entries
        .filter((e) => e.isFile() && !e.name.startsWith("."))
        .map(async (e) => {
          const stat = await fs.stat(path.join(dir, e.name));
          return { name: e.name, size: stat.size };
        }),
    );
    return files.sort((a, b) => a.name.localeCompare(b.name));
  } catch (e) {
    if (e.code === "ENOENT") return [];
    throw e;
  }
}

export async function listMedia() {
  const root = await dataPath("media");
  const result = {};
  for (const kind of ["bg", "thumb", "bgm", "sound"]) {
    result[kind] = await listFiles(path.join(root, kind));
  }
  const chrDir = path.join(root, "chr");
  let chars = [];
  try {
    chars = (await fs.readdir(chrDir, { withFileTypes: true })).filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {}
  result.chr = await Promise.all(
    chars.sort().map(async (name) => ({ name, files: await listFiles(path.join(chrDir, name)) })),
  );
  return result;
}

export async function saveMedia(segments, buffer) {
  const file = await mediaPath(segments);
  if (!file) throw new Error("파일 이름에 쓸 수 없는 문자가 있습니다.");
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, buffer);
}

export async function deleteMedia(segments) {
  const file = await mediaPath(segments);
  if (!file) return;
  await fs.rm(file, { force: true });
  if (segments[0] === "chr") {
    // 비어 있는 캐릭터 폴더 정리
    const dir = path.dirname(file);
    if ((await fs.readdir(dir)).length === 0) await fs.rmdir(dir);
  }
}
