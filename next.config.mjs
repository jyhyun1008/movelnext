import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
});



export default withPWA({
    output: "export",
    images: {
      unoptimized: true,
    },
    basePath: "",
    assetPrefix: "/",
});