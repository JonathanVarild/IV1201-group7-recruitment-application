import { deleteSession } from "@/lib/session";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    // Delete session via cookie and redirect to home page.
    await deleteSession();
    const res = NextResponse.redirect(new URL("/", request.url));

    // Clear the session cookie.
    res.cookies.delete("session");

    return res;
  } catch (error) {
    console.error("Unexpected error during logout:", error);
    return NextResponse.json({ error: "An unknown error occurred.", translationKey: "unknownError" }, { status: 500 });
  }
}
