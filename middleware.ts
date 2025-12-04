import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth/middleware";

// Routes that don't require authentication
const publicRoutes = ["/", "/login", "/signup"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPublicRoute = publicRoutes.includes(pathname);

  // Allow API auth routes to pass through
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Check authentication
  const user = await getAuthUser(request);

  // Redirect authenticated users away from auth pages to assessment agent (chat page)
  if (isPublicRoute && user) {
    return NextResponse.redirect(new URL("/assessment-agent", request.url));
  }

  // Redirect unauthenticated users to login
  if (!isPublicRoute && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};

