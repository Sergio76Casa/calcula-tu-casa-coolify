import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE   = "ab_variant";
const ONE_YEAR = 60 * 60 * 24 * 365;

export function middleware(request: NextRequest) {
  const url = request.nextUrl;
  const forceVariant = url.searchParams.get("v"); // ?v=A o ?v=B
  
  let response = NextResponse.next();

  // 1. Si viene forzado por URL (para previsualizar), mandamos sobre la cookie
  if (forceVariant === "A" || forceVariant === "B") {
    response = NextResponse.rewrite(url);
    response.cookies.set(COOKIE, forceVariant, {
      maxAge:   ONE_YEAR,
      httpOnly: false,
      sameSite: "lax",
      path:     "/",
    });
    return response;
  }

  // 2. Si no tiene cookie, asignamos aleatorio (aquí irá la lógica de la DB después)
  if (!request.cookies.has(COOKIE)) {
    const variant = Math.random() < 0.5 ? "A" : "B";
    response.cookies.set(COOKIE, variant, {
      maxAge:   ONE_YEAR,
      httpOnly: false,
      sameSite: "lax",
      path:     "/",
    });
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico|.*\\.png$).*)"],
};
