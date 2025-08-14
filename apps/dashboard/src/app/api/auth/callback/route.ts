import { type NextRequest, NextResponse } from "next/server";
import { orpc } from "@/utils/orpc";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const code = request.nextUrl.searchParams.get("code")?.trim();

  if (!code) {
    // Construire une URL absolue à partir de la requête entrante
    return NextResponse.redirect(new URL("/?error=AUTH_NO_CODE", request.url));
  }

  try {
    // Mettre l'appel dans le try pour attraper les exceptions
    const callbackResult = await orpc.auth.callback.call({ code });

    if (!callbackResult) {
      return NextResponse.redirect(
        new URL("/?error=AUTH_CALLBACK_FAILED", request.url),
      );
    }

    return NextResponse.redirect(new URL("/", request.url));
  } catch (err) {
    console.error("auth callback error:", err);
    return NextResponse.redirect(
      new URL("/?error=AUTH_UNEXPECTED_ERROR", request.url),
    );
  }
}
