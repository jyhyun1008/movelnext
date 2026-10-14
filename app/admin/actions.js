"use server";

import { redirect } from "next/navigation";
import { endSession, requireAdmin, startSession } from "@/lib/auth";
import { newScene } from "@/lib/episode";
import { checkPassword } from "@/lib/session";
import {
  MEDIA_KINDS,
  deleteEpisode,
  deleteMedia,
  getCharacters,
  getEpisode,
  getSettings,
  isValidId,
  isValidName,
  moveEpisode,
  saveCharacters,
  saveEpisode,
  saveMedia,
  savePage,
  saveSettings,
} from "@/lib/storage";

const RESERVED = new Set(["admin", "media", "ep", "raw", "api", "manifest.webmanifest", "favicon.ico", "logo.png", "index"]);

function back(path, params) {
  redirect(`${path}?${new URLSearchParams(params)}`);
}

/* ---------- auth ---------- */

export async function login(_prev, formData) {
  const ok = await checkPassword(formData.get("password"));
  if (!ok) {
    await new Promise((r) => setTimeout(r, 800));
    return { error: "비밀번호가 맞지 않습니다." };
  }
  await startSession();
  const next = String(formData.get("next") || "");
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export async function logout() {
  await endSession();
  redirect("/admin/login");
}

/* ---------- settings ---------- */

export async function updateSettings(formData) {
  await requireAdmin();
  const current = await getSettings();

  const slugs = formData.getAll("menuSlug").map((s) => String(s).trim());
  const labels = formData.getAll("menuLabel").map((s) => String(s).trim());
  const menus = [];
  for (let i = 0; i < slugs.length; i++) {
    if (!slugs[i] && !labels[i]) continue;
    if (!isValidId(slugs[i]) || RESERVED.has(slugs[i])) {
      back("/admin/settings", { error: `메뉴 주소 '${slugs[i]}'는 쓸 수 없습니다. 영문, 숫자, -, _ 만 가능합니다.` });
    }
    menus.push({ slug: slugs[i], label: labels[i] || slugs[i] });
  }

  const theme = String(formData.get("theme") || current.theme);
  await saveSettings({
    ...current,
    title: String(formData.get("title") || "").trim() || current.title,
    description: String(formData.get("description") || "").trim(),
    author: String(formData.get("author") || "").trim(),
    headingMark: String(formData.get("headingMark") || "").trim(),
    heroImage: isValidName(String(formData.get("heroImage") || "")) ? String(formData.get("heroImage")) : "",
    theme: /^#[0-9a-f]{6}$/i.test(theme) ? theme : current.theme,
    menus,
  });
  back("/admin/settings", { saved: "1" });
}

/* ---------- pages ---------- */

// 카드 편집기에서 직접 호출 (리다이렉트 없이 결과만 돌려준다)
export async function savePageCards(slug, page) {
  await requireAdmin();
  const settings = await getSettings();
  if (slug !== "index" && !settings.menus.some((m) => m.slug === slug)) return { error: "없는 페이지입니다." };
  try {
    await savePage(slug, page);
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}

// 카드 썸네일 바로 업로드
export async function uploadThumb(formData) {
  await requireAdmin();
  const file = formData.get("file");
  if (!file || typeof file !== "object" || !file.size) return { error: "파일을 선택하세요." };
  if (!/^image\//.test(file.type)) return { error: "이미지 파일만 올릴 수 있습니다." };
  const name = file.name.normalize("NFC").replace(/\s+/g, "_");
  try {
    await saveMedia(["thumb", name], Buffer.from(await file.arrayBuffer()));
  } catch (e) {
    return { error: e.message };
  }
  return { ok: true, name, src: `/media/thumb/${encodeURIComponent(name)}` };
}

/* ---------- episodes ---------- */

export async function createEpisode(formData) {
  await requireAdmin();
  const id = String(formData.get("id") || "").trim();
  if (!isValidId(id)) back("/admin/episodes", { error: "에피소드 ID는 영문, 숫자, -, _ 만 쓸 수 있습니다." });
  if (await getEpisode(id)) back("/admin/episodes", { error: `'${id}'는 이미 있는 ID입니다.` });
  const title = { ...newScene("title"), title: "제목", subtitle: id };
  await saveEpisode(id, { data: { theme: "", scenes: [title, newScene("dialogue")] }, published: false });
  redirect(`/admin/episodes/${id}`);
}

// 장면 편집기에서 직접 호출 (리다이렉트 없이 결과만 돌려준다)
export async function saveEpisodeData(id, data, published) {
  await requireAdmin();
  if (!(await getEpisode(id))) return { error: "없는 에피소드입니다." };
  try {
    await saveEpisode(id, { data, published: Boolean(published) });
    return { ok: true };
  } catch (e) {
    return { error: e.message };
  }
}

export async function removeEpisode(formData) {
  await requireAdmin();
  await deleteEpisode(String(formData.get("id")));
  back("/admin/episodes", { deleted: "1" });
}

export async function reorderEpisode(formData) {
  await requireAdmin();
  await moveEpisode(String(formData.get("id")), Number(formData.get("delta")));
  redirect("/admin/episodes");
}

/* ---------- characters ---------- */

export async function updateCharacters(formData) {
  await requireAdmin();
  const ids = formData.getAll("id").map(String);
  const names = formData.getAll("name").map(String);
  const colors = formData.getAll("color").map(String);
  // 미디어에서 지운 폴더의 설정도 남겨 둔다 (다시 올리면 그대로 쓰도록)
  const map = await getCharacters();
  ids.forEach((id, i) => {
    map[id] = { name: names[i], color: formData.get(`useColor:${id}`) === "on" ? colors[i] : "" };
  });
  await saveCharacters(map);
  back("/admin/characters", { saved: "1" });
}

/* ---------- media ---------- */

export async function uploadMedia(formData) {
  await requireAdmin();
  const kind = String(formData.get("kind"));
  const character = String(formData.get("character") || "").trim();
  if (!MEDIA_KINDS.includes(kind)) back("/admin/media", { error: "잘못된 분류입니다." });
  if (kind === "chr" && !isValidName(character)) back("/admin/media", { error: "캐릭터 폴더 이름을 입력하세요." });

  const files = formData.getAll("files").filter((f) => typeof f === "object" && f.size > 0);
  if (!files.length) back("/admin/media", { error: "업로드할 파일을 선택하세요." });

  for (const file of files) {
    const name = file.name.normalize("NFC").replace(/\s+/g, "_");
    const segments = kind === "chr" ? [kind, character, name] : [kind, name];
    try {
      await saveMedia(segments, Buffer.from(await file.arrayBuffer()));
    } catch (e) {
      back("/admin/media", { error: `${file.name}: ${e.message}` });
    }
  }
  back("/admin/media", { saved: String(files.length) });
}

export async function removeMedia(formData) {
  await requireAdmin();
  await deleteMedia(String(formData.get("path")).split("/"));
  back("/admin/media", { deleted: "1" });
}
