import { InvalidSessionError } from "@/lib/errors/authErrors";
import { InvalidFormDataError } from "@/lib/errors/generalErrors";
import { getAuthenticatedUserData } from "@/lib/session";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    // Return the user data and HTTP 200 (OK) status.
    const userData = await getAuthenticatedUserData();
    return NextResponse.json({ ...userData }, { status: 200 });
  } catch (error) {
    // Check if the form data was invalid and return HTTP 400 (BAD REQUEST) status.
    if (error instanceof InvalidFormDataError) return NextResponse.json({ error: error.message, translationKey: error.translationKey }, { status: 400 });
    // Check if the session was invalid and return HTTP 204 (NO CONTENT) status.
    else if (error instanceof InvalidSessionError) return new NextResponse(null, { status: 204 });
    // Return HTTP 500 (INTERNAL SERVER ERROR) status for any other errors.
    else {
      console.error("Unexpected error during whoami:", error);
      return NextResponse.json({ error: "An unknown error occurred.", translationKey: "unknownError" }, { status: 500 });
    }
  }
}
