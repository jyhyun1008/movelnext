import Notice from "@/components/admin/Notice";
import { getSettings, listMedia } from "@/lib/storage";
import { updateSettings } from "../../actions";

export default async function SettingsPage({ searchParams }) {
  const [settings, media, params] = await Promise.all([getSettings(), listMedia(), searchParams]);
  const rows = [...settings.menus, { slug: "", label: "" }, { slug: "", label: "" }];
  return (
    <>
      <h1>사이트 설정</h1>
      <Notice params={params} />
      <form action={updateSettings} className="narrow">
        <label className="field">
          <span>사이트 이름</span>
          <input type="text" name="title" defaultValue={settings.title} required />
        </label>
        <label className="field">
          <span>소개 문구</span>
          <input type="text" name="description" defaultValue={settings.description} />
          <small>홈 상단과 검색·공유 미리보기에 쓰입니다.</small>
        </label>
        <label className="field">
          <span>홈 대표 이미지</span>
          <select name="heroImage" defaultValue={settings.heroImage}>
            <option value="">사용 안 함</option>
            {media.bg.map((f) => (
              <option key={f.name} value={f.name}>
                {f.name}
              </option>
            ))}
          </select>
          <small>
            <a href="/admin/media#bg">미디어 → 배경</a>에 올린 이미지 중에서 고릅니다.
          </small>
        </label>
        <label className="field">
          <span>만든 사람</span>
          <input type="text" name="author" defaultValue={settings.author} />
        </label>
        <div className="field-row">
          <label className="field">
            <span>대표 색</span>
            <input type="color" name="theme" defaultValue={settings.theme} />
          </label>
          <label className="field">
            <span>제목 앞 기호</span>
            <input type="text" name="headingMark" defaultValue={settings.headingMark} maxLength={4} />
            <small>페이지 섹션 제목 앞에 붙습니다. 비워 두면 표시하지 않습니다.</small>
          </label>
        </div>

        <h2>메뉴</h2>
        <p className="hint">
          주소는 영문으로 적고, 페이지 내용은 <a href="/admin/pages">페이지</a>에서 편집합니다. 행을 비우면 삭제됩니다.
        </p>
        <table className="table menus">
          <thead>
            <tr>
              <th>주소</th>
              <th>표시 이름</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m, i) => (
              <tr key={i}>
                <td>
                  <input type="text" name="menuSlug" defaultValue={m.slug} placeholder="story" />
                </td>
                <td>
                  <input type="text" name="menuLabel" defaultValue={m.label} placeholder="스토리" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="btn">저장</button>
      </form>
    </>
  );
}
