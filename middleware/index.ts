import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes that should always be accessible without auth
  const publicRoutes = new Set([
    "/sign-in",
    "/sign-up",
    "/forgot-password",
    "/reset-password",
    "/unsubscribe",
  ]);

  // Check for session cookie
  const sessionCookie = getSessionCookie(request);

  // If authenticated and visiting auth pages, redirect to dashboard
  if (sessionCookie && (pathname === "/sign-in" || pathname === "/sign-up")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Protect non-public routes for unauthenticated users
  const isPublic = [...publicRoutes].some((route) =>
    pathname.startsWith(route)
  );
  if (!sessionCookie && !isPublic) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Run on all routes except Next.js internals, API, and static assets
    "/((?!api|_next/static|_next/image|favicon.ico|assets).*)",
  ],
};
