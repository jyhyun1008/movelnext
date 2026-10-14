import { NextResponse } from "next/server";
import { SESSION_COOKIE, verifyToken } from "./lib/session";

export async function middleware(request) {
  if (request.nextUrl.pathname === "/admin/login") return NextResponse.next();
  if (await verifyToken(request.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();
  const url = new URL("/admin/login", request.url);
  url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
