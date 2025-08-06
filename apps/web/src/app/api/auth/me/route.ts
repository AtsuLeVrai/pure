import type { APIUser } from "discord-api-types/v10";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { env } from "@/env";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: "No session found" }, { status: 401 });
    }

    const { exp, access_token, token_expires_at, ...user } = jwt.verify(
      sessionCookie.value,
      env.JWT_SECRET,
    ) as APIUser & {
      exp: number;
      access_token: string;
      token_expires_at: number;
    };

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    return NextResponse.json(user);
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
