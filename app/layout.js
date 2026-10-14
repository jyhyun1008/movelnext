import "./globals.css";
import { getSettings } from "@/lib/storage";

// 콘텐츠를 어드민에서 수정하므로 빌드 시점이 아닌 요청 시점에 렌더링
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { title, description } = await getSettings();
  return {
    title: { default: title, template: `%s · ${title}` },
    description,
    appleWebApp: { capable: true, title },
    formatDetection: { telephone: false },
    openGraph: { type: "website", siteName: title, title, description },
    twitter: { card: "summary", title, description },
  };
}

export async function generateViewport() {
  const { theme } = await getSettings();
  return { themeColor: theme };
}

const THEME_SCRIPT = `try{var t=localStorage.getItem("theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t}catch(e){}`;

export default async function RootLayout({ children }) {
  const { theme } = await getSettings();
  return (
    <html lang="ko" style={{ "--brand": theme }} suppressHydrationWarning>
      <head>
        {/* 첫 화면을 그리기 전에 저장된 테마를 적용해 깜빡임을 막는다 */}
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
