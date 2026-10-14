import Link from "next/link";
import { getSettings } from "@/lib/storage";

export default async function PagesList() {
  const { menus } = await getSettings();
  const pages = [{ slug: "index", label: "홈 하단", path: "/" }, ...menus.map((m) => ({ ...m, path: `/${m.slug}` }))];
  return (
    <>
      <h1>페이지</h1>
      <p className="hint">
        메뉴 추가·삭제는 <Link href="/admin/settings">사이트 설정</Link>에서 합니다.
      </p>
      <table className="table">
        <tbody>
          {pages.map((p) => (
            <tr key={p.slug}>
              <th>{p.label}</th>
              <td className="muted">{p.path}</td>
              <td className="right">
                <Link href={`/admin/pages/${p.slug}`}>편집</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
