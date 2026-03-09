import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = ["/home"];

// Next.js 16 prefers the default export for the middleware function
export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Optimized Path Check
  // We moved the static file skips to the 'matcher' config below 
  // to prevent this function from even running for assets.

  const isProtected = protectedRoutes.some((route) =>
    pathname === route || pathname.startsWith(route + "/")
  );

  if (!isProtected) return NextResponse.next();

  // 2. Cookie Access
  const token = req.cookies.get("jam-track-session")?.value;

  // 3. Redirect Logic
  // Ensure the redirect URL is constructed correctly for the 16.x router
  if (!token || token === "undefined") {
    const url = req.nextUrl.clone();
    url.pathname = "/sign-in";
    // Clear search params if you don't want them persisting to sign-in
    url.search = ""; 
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// 4. Enhanced Matcher
// This is the "Next.js 16 way": exclude everything you don't want 
// at the config level so the middleware function stays lean.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (optional, remove if you want middleware on API)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, robots.txt (metadata files)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt).*)",
  ],
};