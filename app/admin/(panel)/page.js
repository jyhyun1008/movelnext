import Link from "next/link";
import { listEpisodes, listMedia, getSettings } from "@/lib/storage";

export default async function AdminHome() {
  const [settings, episodes, media] = await Promise.all([getSettings(), listEpisodes(), listMedia()]);
  const published = episodes.filter((e) => e.published).length;
  const rows = [
    ["에피소드", `${episodes.length}개 (공개 ${published})`, "/admin/episodes"],
    ["페이지", `홈 + 메뉴 ${settings.menus.length}개`, "/admin/pages"],
    ["배경", `${media.bg.length}개`, "/admin/media#bg"],
    ["캐릭터", `${media.chr.length}명`, "/admin/media#chr"],
    ["배경음악 · 효과음", `${media.bgm.length} · ${media.sound.length}개`, "/admin/media#bgm"],
  ];
  return (
    <>
      <h1>{settings.title}</h1>
      <table className="table">
        <tbody>
          {rows.map(([k, v, href]) => (
            <tr key={k}>
              <th>{k}</th>
              <td>{v}</td>
              <td className="right">
                <Link href={href}>관리</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
