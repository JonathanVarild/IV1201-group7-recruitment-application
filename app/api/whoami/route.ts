import { InvalidSessionError } from "@/lib/errors/authErrors";
import { InvalidFormDataError } from "@/lib/errors/generalErrors";
import { getUserDataFromSession } from "@/lib/session";
import { cookies } from "next/dist/server/request/cookies";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    // Get session token from cookies
    const token = (await cookies()).get("session")?.value;

    // Ensure we received a token
    if (!token) throw new InvalidFormDataError();

    // Get user data from session token
    const userData = await getUserDataFromSession(token);

    // Return the user data and HTTP 200 (OK) status.
    return NextResponse.json({ ...userData }, { status: 200 });
  } catch (error) {
    // Check if the form data was invalid and return HTTP 400 (BAD REQUEST) status.
    if (error instanceof InvalidFormDataError) return NextResponse.json({ error: error.message }, { status: 400 });
    // Check if the session was invalid and return HTTP 401 (UNAUTHORIZED) status.
    else if (error instanceof InvalidSessionError) return NextResponse.json({ error: error.message }, { status: 401 });
    // Return HTTP 500 (INTERNAL SERVER ERROR) status for any other errors.
    else {
      console.error("Unexpected error during whoami:", error);
      return NextResponse.json({ error: "An unknown error occurred." }, { status: 500 });
    }
  }
}
