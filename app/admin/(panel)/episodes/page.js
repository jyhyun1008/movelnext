import Link from "next/link";
import ConfirmButton from "@/components/admin/ConfirmButton";
import Notice from "@/components/admin/Notice";
import { listEpisodesWithTitles } from "@/lib/content";
import { createEpisode, removeEpisode, reorderEpisode } from "../../actions";

export default async function EpisodesAdmin({ searchParams }) {
  const [episodes, params] = await Promise.all([listEpisodesWithTitles({ includeDrafts: true }), searchParams]);
  return (
    <>
      <h1>에피소드</h1>
      <Notice params={params} />
      <form action={createEpisode} className="inline-form">
        <input type="text" name="id" placeholder="새 에피소드 ID (예: ep002)" pattern="[A-Za-z0-9_\-]+" required />
        <button className="btn">만들기</button>
      </form>
      {episodes.length === 0 ? (
        <p className="hint">아직 에피소드가 없습니다.</p>
      ) : (
        <table className="table">
          <thead>
            <tr>
              <th>순서</th>
              <th>ID</th>
              <th>제목</th>
              <th>상태</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {episodes.map((ep, i) => (
              <tr key={ep.id}>
                <td className="order">
                  <form action={reorderEpisode}>
                    <input type="hidden" name="id" value={ep.id} />
                    <button className="linklike" name="delta" value="-1" disabled={i === 0} aria-label="위로">
                      ↑
                    </button>
                    <button className="linklike" name="delta" value="1" disabled={i === episodes.length - 1} aria-label="아래로">
                      ↓
                    </button>
                  </form>
                </td>
                <td className="mono">{ep.id}</td>
                <td>
                  <Link href={`/admin/episodes/${ep.id}`}>{ep.subtitle || ep.title || "(제목 없음)"}</Link>
                </td>
                <td>{ep.published ? <span className="badge on">공개</span> : <span className="badge">비공개</span>}</td>
                <td className="right nowrap">
                  <Link href={`/ep/${ep.id}`} target="_blank">
                    보기
                  </Link>
                  <form action={removeEpisode} className="inline">
                    <input type="hidden" name="id" value={ep.id} />
                    <ConfirmButton message={`'${ep.id}' 에피소드를 삭제할까요? 되돌릴 수 없습니다.`}>삭제</ConfirmButton>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <p className="hint">공개된 에피소드는 이 순서대로 홈에 표시되고, 끝까지 보면 다음 에피소드로 이어집니다.</p>
    </>
  );
}
