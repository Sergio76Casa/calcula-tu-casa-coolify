import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE   = "ab_variant";
const ONE_YEAR = 60 * 60 * 24 * 365;

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  if (!request.cookies.has(COOKIE)) {
    const variant = Math.random() < 0.5 ? "A" : "B";
    response.cookies.set(COOKIE, variant, {
      maxAge:   ONE_YEAR,
      httpOnly: false,   // readable by client-side analytics
      sameSite: "lax",
      path:     "/",
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\.png$).*)"],
};
