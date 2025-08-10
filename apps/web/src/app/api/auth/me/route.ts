import { NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth-helpers";

export async function GET() {
  const authResult = await authenticateUser();

  if (!authResult.user) {
    return NextResponse.json(
      { error: authResult.error || "Not authenticated" },
      { status: 401 },
    );
  }

  return NextResponse.json(authResult.user);
}
