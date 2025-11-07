import { NextRequest, NextResponse } from "next/server";

// List of frontend routes to protect
const protectedRoutes = ["/home"];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip static files and public assets
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/robots.txt")
  ) {
    return NextResponse.next();
  }

  // Only protect listed routes
  const isProtected = protectedRoutes.some((route) =>
    pathname === route || pathname.startsWith(route + "/")
  );
  if (!isProtected) return NextResponse.next();

  // Get token from cookie
  const token = req.cookies.get("jam-track-session")?.value;

  // Redirect to sign-in if token is missing or empty
  if (!token || token === "undefined") {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // Token exists → allow access (no verification)
  return NextResponse.next();
}

// Apply middleware globally
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt).*)"],
};