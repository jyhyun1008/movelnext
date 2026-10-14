import LoginForm from "@/components/admin/LoginForm";

export const metadata = { title: "관리자 로그인", robots: { index: false } };

export default async function LoginPage({ searchParams }) {
  const { next } = await searchParams;
  return (
    <div className="admin-login">
      <h1>관리자</h1>
      <LoginForm next={next || ""} />
    </div>
  );
}
