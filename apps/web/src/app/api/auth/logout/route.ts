import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const redirectTo = request.nextUrl.searchParams.get("redirect") || "/";

  const response = NextResponse.redirect(new URL(redirectTo, request.url));

  // Clear the session cookie
  response.cookies.set("session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0, // Expire immediately
    path: "/",
  });

  return response;
}

// Also support GET for simple logout links
export async function GET(request: NextRequest) {
  return POST(request);
}
