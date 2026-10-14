import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, SESSION_MAX_AGE, createToken, verifyToken } from "./session";

export async function isAdmin() {
  const store = await cookies();
  return verifyToken(store.get(SESSION_COOKIE)?.value);
}

// 모든 server action 첫 줄에서 호출
export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

export async function startSession() {
  const store = await cookies();
  store.set(SESSION_COOKIE, await createToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && process.env.COOKIE_SECURE !== "false",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function endSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}
