import { getSettings } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function manifest() {
  const { title, description } = await getSettings();
  return {
    name: title,
    short_name: title,
    description,
    icons: [{ src: "/logo.png", sizes: "512x512", type: "image/png", purpose: "maskable" }],
    theme_color: "#f6f4ef",
    background_color: "#f6f4ef",
    start_url: "/",
    display: "standalone",
  };
}
