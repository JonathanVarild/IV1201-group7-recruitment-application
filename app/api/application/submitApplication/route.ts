import { InvalidSessionError } from "@/lib/errors/authErrors";
import { ConflictingApplicationError } from "@/lib/errors/applicationErrors";
import { InvalidFormDataError } from "@/lib/errors/generalErrors";
import { getAuthenticatedUserData } from "@/lib/session";
import { registerApplication } from "@/server/services/applicationService";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    // Get authenticated user data.
    const userData = await getAuthenticatedUserData();

    // Register a new application for the authenticated user.
    const applicationID = await registerApplication(userData.id);

    // Return the application ID and HTTP 200 (OK) status.
    return NextResponse.json({ applicationID }, { status: 200 });
  } catch (error) {
    // Check if there is a conflicting unhandled application and return HTTP 409 (CONFLICT) status.
    if (error instanceof ConflictingApplicationError) return NextResponse.json({ error: error.message, translationKey: error.translationKey }, { status: 409 });
    // Check if the form data was invalid and return HTTP 400 (BAD REQUEST) status.
    else if (error instanceof InvalidFormDataError) return NextResponse.json({ error: error.message }, { status: 400 });
    // Check if the session was invalid and return HTTP 401 (UNAUTHORIZED) status.
    else if (error instanceof InvalidSessionError) return new NextResponse(null, { status: 401 });
    // Return HTTP 500 (INTERNAL SERVER ERROR) status for any other errors.
    else {
      console.error("Unexpected error during application/submitApplication:", error);
      return NextResponse.json({ error: "An unknown error occurred." }, { status: 500 });
    }
  }
}
