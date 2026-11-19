import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const entered = request.cookies.get("gp_entered")?.value === "1";

  if (pathname.startsWith("/api/")) {
    if (pathname === "/api/v2/session") return NextResponse.next();
    if (!entered) return NextResponse.json({ error: "Sign in to open a case." }, { status: 401 });
    return NextResponse.next();
  }

  const isPublic = pathname === "/" || pathname === "/login";
  if (!entered && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (entered && pathname === "/login" && !request.nextUrl.searchParams.has("switch")) {
    const url = request.nextUrl.clone();
    url.pathname = "/case";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
