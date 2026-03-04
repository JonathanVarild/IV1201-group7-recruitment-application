import { validateResetToken } from "@/server/services/resetCredentialsService";
import { NextResponse } from "next/server";

/**
 * Validates that the token exists and is not expired.
 *
 * @param request incoming HTTP POST request with the token
 * @returns JSON response
 */
export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    const tokenId = await validateResetToken(token);

    if (!tokenId) {
      return NextResponse.json({ error: "Token is not available or out of time" }, { status: 404 });
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error("Unexpected error during token validation:", error);
    return NextResponse.json({ error: "An unknown error occurred." }, { status: 500 });
  }
}
