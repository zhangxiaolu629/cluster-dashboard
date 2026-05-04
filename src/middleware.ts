import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (path.startsWith("/login")) {
    return NextResponse.next();
  }
  if (!getSessionCookie(request)) {
    const login = new URL("/login", request.url);
    const callback = `${request.nextUrl.pathname}${request.nextUrl.search}`;
    if (callback && callback !== "/login") {
      login.searchParams.set("callbackUrl", callback);
    }
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.svg).*)"],
};
