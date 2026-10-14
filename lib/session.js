// middleware(edge)와 서버 양쪽에서 쓰므로 Web Crypto만 사용
export const SESSION_COOKIE = "movel_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

const encoder = new TextEncoder();

async function hmac(message) {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET 환경 변수가 설정되지 않았습니다.");
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function createToken() {
  const expires = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE;
  return `${expires}.${await hmac(String(expires))}`;
}

export async function verifyToken(token) {
  if (!token) return false;
  const [expires, sig] = token.split(".");
  if (!expires || !sig || Number(expires) < Date.now() / 1000) return false;
  return safeEqual(sig, await hmac(expires));
}

export async function checkPassword(input) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || typeof input !== "string") return false;
  // 길이 차이로 인한 타이밍 노출을 막기 위해 해시끼리 비교
  return safeEqual(await hmac(`pw:${input}`), await hmac(`pw:${expected}`));
}
