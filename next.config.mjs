import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
});



export default withPWA(()=>{
  // Your Next.js config
  const nextConfig = {
    output: "export",
    images: {
      unoptimized: true, // GitHub Pages에서는 SSR 이미지 최적화 미지원
    },
    basePath: "/jyhyun1008", // GitHub Pages에서는 필수
    assetPrefix: "/movelnext/",
  };
});