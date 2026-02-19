import { LogType, logUserActivity } from "@/lib/logging";
import { deleteSession, getAuthenticatedUserData } from "@/lib/session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Endpoint for logging out the authenticated user by deleting their session.
 *
 * @param request The incoming HTTP request.
 * @return HTTP response.
 */
export async function GET(request: Request) {
  try {
    // Get the token.
    const token = (await cookies()).get("session")?.value || "Unknown";

    // Get user data for logging purposes, ignore errors since the UserID isn't critical if session token is invalid.
    let userID: number | undefined = undefined;
    try {
      const userData = await getAuthenticatedUserData();
      userID = userData?.id || undefined;
    } catch {}

    // Delete session via cookie and redirect to home page.
    await deleteSession();
    const res = NextResponse.redirect(new URL("/", request.url));

    // Clear the session cookie.
    res.cookies.delete("session");

    // Log logout activity.
    await logUserActivity(null, LogType.INFO, "SESSION_LOGOUT", `User (${userID || "Unknown"}) logged out with session token (${token}).`, request, userID);

    return res;
  } catch (error) {
    console.error("Unexpected error during logout:", error);
    return NextResponse.json({ error: "An unknown error occurred." }, { status: 500 });
  }
}
