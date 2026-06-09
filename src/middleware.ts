import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "pro-personal-session";

const publicPaths = ["/", "/login", "/register", "/descoberta"];

function getSecret() {
  return new TextEncoder().encode(
    process.env.SESSION_SECRET ||
      "pro-personal-dev-secret-change-in-production-32chars"
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/uploads") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  let role: string | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, getSecret());
      role = payload.role as string;
    } catch {
      role = null;
    }
  }

  const isPublic =
    publicPaths.some((p) => pathname === p) ||
    pathname.startsWith("/descoberta/");

  if (!role && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (role && (pathname === "/login" || pathname === "/register")) {
    const home =
      role === "ADMIN"
        ? "/admin"
        : role === "PERSONAL"
          ? "/personal"
          : "/aluno";
    return NextResponse.redirect(new URL(home, request.url));
  }

  if (role === "PERSONAL" && pathname.startsWith("/aluno")) {
    return NextResponse.redirect(new URL("/personal", request.url));
  }
  if (role === "ALUNO" && pathname.startsWith("/personal")) {
    return NextResponse.redirect(new URL("/aluno", request.url));
  }
  if (role === "ADMIN" && (pathname.startsWith("/aluno") || pathname.startsWith("/personal"))) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }
  if (role === "ALUNO" && pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/aluno", request.url));
  }
  if (role === "PERSONAL" && pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/personal", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
