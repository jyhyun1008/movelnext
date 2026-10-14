import fs from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { mediaPath } from "@/lib/storage";

const TYPES = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".mp3": "audio/mpeg",
  ".ogg": "audio/ogg",
  ".m4a": "audio/mp4",
  ".wav": "audio/wav",
};

export async function GET(request, { params }) {
  const segments = (await params).path.map(decodeURIComponent);
  const file = await mediaPath(segments);
  const type = file && TYPES[path.extname(file).toLowerCase()];
  if (!type) return new Response("Not found", { status: 404 });

  let info;
  try {
    info = await stat(file);
  } catch {
    return new Response("Not found", { status: 404 });
  }

  const lastModified = info.mtime.toUTCString();
  const headers = {
    "Content-Type": type,
    "Last-Modified": lastModified,
    "Cache-Control": "public, max-age=600, stale-while-revalidate=86400",
    "Accept-Ranges": "bytes",
  };

  const since = request.headers.get("if-modified-since");
  if (since && Math.floor(info.mtimeMs / 1000) <= Math.floor(Date.parse(since) / 1000)) {
    return new Response(null, { status: 304, headers });
  }

  // 사파리는 오디오 재생에 Range 요청 지원이 필요하다
  const range = request.headers.get("range")?.match(/^bytes=(\d*)-(\d*)$/);
  if (range) {
    const size = info.size;
    let start = range[1] ? Number(range[1]) : size - Number(range[2]);
    let end = range[1] && range[2] ? Number(range[2]) : size - 1;
    start = Math.max(0, start);
    end = Math.min(end, size - 1);
    if (start > end) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    }
    const body = Readable.toWeb(fs.createReadStream(file, { start, end }));
    return new Response(body, {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
    });
  }

  const body = Readable.toWeb(fs.createReadStream(file));
  return new Response(body, { headers: { ...headers, "Content-Length": String(info.size) } });
}
