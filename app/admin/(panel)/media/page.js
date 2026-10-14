import ConfirmButton from "@/components/admin/ConfirmButton";
import Notice from "@/components/admin/Notice";
import { listMedia } from "@/lib/storage";
import { removeMedia, uploadMedia } from "../../actions";

const enc = (p) => p.split("/").map(encodeURIComponent).join("/");
const size = (n) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)}MB` : `${Math.ceil(n / 1024)}KB`);
const stem = (name) => name.replace(/\.[^.]+$/, "");

function Delete({ path }) {
  return (
    <form action={removeMedia}>
      <input type="hidden" name="path" value={path} />
      <ConfirmButton message={`${path} 파일을 삭제할까요?`} className="btn danger small">
        삭제
      </ConfirmButton>
    </form>
  );
}

function Upload({ kind, accept, characters }) {
  return (
    <form action={uploadMedia} className="inline-form">
      <input type="hidden" name="kind" value={kind} />
      {characters && (
        <>
          <input type="text" name="character" placeholder="캐릭터 폴더 (예: Pie)" list="characters" required />
          <datalist id="characters">
            {characters.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </>
      )}
      <input type="file" name="files" accept={accept} multiple required />
      <button className="btn">업로드</button>
    </form>
  );
}

function Thumbs({ base, files }) {
  return (
    <ul className="thumbs">
      {files.map((f) => (
        <li key={f.name}>
          <img src={`/media/${enc(`${base}/${f.name}`)}`} alt="" loading="lazy" />
          <div>
            <code>{stem(f.name)}</code>
            <span className="muted">{size(f.size)}</span>
          </div>
          <div className="thumb-actions">
            <Delete path={`${base}/${f.name}`} />
          </div>
        </li>
      ))}
    </ul>
  );
}

function Tracks({ base, files }) {
  return (
    <table className="table">
      <tbody>
        {files.map((f) => (
          <tr key={f.name}>
            <td>
              <code>{stem(f.name)}</code>
            </td>
            <td>
              <audio controls preload="none" src={`/media/${enc(`${base}/${f.name}`)}`} />
            </td>
            <td className="muted">{size(f.size)}</td>
            <td className="right">
              <Delete path={`${base}/${f.name}`} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default async function MediaPage({ searchParams }) {
  const [media, params] = await Promise.all([listMedia(), searchParams]);
  return (
    <>
      <h1>미디어</h1>
      <Notice params={params} saved={`${params?.saved}개 파일을 올렸습니다.`} />
      <p className="hint">
        에피소드 옵션 블록에서 확장자 없이 파일 이름으로 연결합니다. 예: <code>bg: {"{ 교실: \"classroom\" }"}</code>. 같은
        이름으로 올리면 덮어씁니다.
      </p>

      <section id="bg" className="media-section">
        <h2>배경</h2>
        <Upload kind="bg" accept="image/*" />
        <Thumbs base="bg" files={media.bg} />
      </section>

      <section id="chr" className="media-section">
        <h2>캐릭터</h2>
        <p className="hint">
          캐릭터마다 폴더를 나누고, 표정별 이미지를 올립니다. 파일 이름이 <code>chr_facial</code> 값이 됩니다.
        </p>
        <Upload kind="chr" accept="image/*" characters={media.chr.map((c) => c.name)} />
        {media.chr.map((c) => (
          <div key={c.name} className="chr-group">
            <h3>{c.name}</h3>
            <Thumbs base={`chr/${c.name}`} files={c.files} />
          </div>
        ))}
      </section>

      <section id="thumb" className="media-section">
        <h2>썸네일</h2>
        <p className="hint">
          페이지 카드 위에 붙는 이미지입니다. <a href="/admin/pages">페이지</a> 편집기의 ‘이미지 고르기’에서 선택하거나 그
          자리에서 바로 올릴 수도 있습니다. 목록형은 가로 12:5, 그리드형은 세로 4:5 비율로 잘려 보입니다.
        </p>
        <Upload kind="thumb" accept="image/*" />
        <Thumbs base="thumb" files={media.thumb} />
      </section>

      <section id="bgm" className="media-section">
        <h2>배경음악</h2>
        <Upload kind="bgm" accept="audio/*" />
        <Tracks base="bgm" files={media.bgm} />
      </section>

      <section id="sound" className="media-section">
        <h2>효과음</h2>
        <Upload kind="sound" accept="audio/*" />
        <Tracks base="sound" files={media.sound} />
      </section>
    </>
  );
}
