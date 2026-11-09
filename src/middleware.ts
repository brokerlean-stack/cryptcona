import { NextResponse, type NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { sessionCookieName } from "@/lib/sessionConfig";
export async function middleware(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: sessionCookieName,
  });
  if (!token) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  if (request.nextUrl.pathname.startsWith("/admin") && token.role !== "admin")
    return NextResponse.redirect(new URL("/dashboard", request.url));
  return NextResponse.next();
}
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/profile/:path*",
    "/settings/:path*",
  ],
};
