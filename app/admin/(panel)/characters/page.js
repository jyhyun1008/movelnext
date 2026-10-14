import Link from "next/link";
import Notice from "@/components/admin/Notice";
import { getCharacters, listMedia } from "@/lib/storage";
import { updateCharacters } from "../../actions";

const enc = encodeURIComponent;

export default async function CharactersPage({ searchParams }) {
  const [media, characters, params] = await Promise.all([listMedia(), getCharacters(), searchParams]);
  return (
    <>
      <h1>캐릭터</h1>
      <Notice params={params} />
      <p className="hint">
        대사 이름표가 대표 색을 따라갑니다. 말하는 사람 이름이 표시 이름과 같으면 자동으로 연결되고, 다르면(예: ‘???’) 장면 편집기에서 직접 고를
        수 있습니다. 캐릭터 폴더와 표정 이미지는 <Link href="/admin/media#chr">미디어</Link>에서 올립니다.
      </p>
      {media.chr.length === 0 ? (
        <p className="hint">아직 캐릭터 폴더가 없습니다.</p>
      ) : (
        <form action={updateCharacters}>
          <ul className="char-admin">
            {media.chr.map(({ name: id, files }) => {
              const c = characters[id] || {};
              const face = files.find((f) => /^none\.\w+$/.test(f.name)) || files[0];
              return (
                <li key={id}>
                  <input type="hidden" name="id" value={id} />
                  <span className="char-admin-img" style={{ "--c": c.color || "var(--surface-2)" }}>
                    {face && <img src={`/media/chr/${enc(id)}/${enc(face.name)}`} alt="" />}
                  </span>
                  <div className="char-admin-fields">
                    <span className="mono muted">{id}</span>
                    <input type="text" name="name" defaultValue={c.name || ""} placeholder="표시 이름 (예: 파이)" />
                    <label className="check">
                      <input type="checkbox" name={`useColor:${id}`} defaultChecked={Boolean(c.color)} />
                      <input type="color" name="color" defaultValue={c.color || "#611fda"} />
                      대표 색
                    </label>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="actions">
            <button className="btn">저장</button>
          </div>
        </form>
      )}
    </>
  );
}
