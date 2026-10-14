export default function Notice({ params, saved = "저장했습니다." }) {
  if (params?.error) return <p className="notice error">{params.error}</p>;
  if (params?.saved) return <p className="notice">{saved}</p>;
  if (params?.deleted) return <p className="notice">삭제했습니다.</p>;
  return null;
}
