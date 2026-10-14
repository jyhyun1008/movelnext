/** @type {import('next').NextConfig} */
export default {
  // Docker 이미지에 필요한 파일만 담기 위해 .next/standalone 으로 빌드
  output: "standalone",
  experimental: {
    serverActions: {
      // 배경·음악 업로드용
      bodySizeLimit: "50mb",
    },
  },
};
