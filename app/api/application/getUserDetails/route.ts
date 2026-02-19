import { InvalidSessionError } from "@/lib/errors/authErrors";
import { InvalidFormDataError } from "@/lib/errors/generalErrors";
import { getAuthenticatedUserData } from "@/lib/session";
import { getFullUserData, getUserAvailability, getUserCompetences } from "@/server/services/applicationService";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Endpoint for retrieving the details of the authenticated user.
 *
 * @param request The incoming HTTP request.
 * @return HTTP response.
 */
export async function POST(request: Request) {
  try {
    // Get authenticated user data.
    const userData = await getAuthenticatedUserData();

    // Get the full user data.
    const fullUserData = await getFullUserData(userData.id, request);

    // Get the user's availability.
    const userAvailability = await getUserAvailability(userData.id);

    // Get the user's competences.
    const userCompetences = await getUserCompetences(userData.id, request);

    // Return the full user data and HTTP 200 (OK) status.
    return NextResponse.json({ userData: fullUserData, availability: userAvailability, competences: userCompetences }, { status: 200 });
  } catch (error) {
    // Check if the form data was invalid and return HTTP 400 (BAD REQUEST) status.
    if (error instanceof InvalidFormDataError) return NextResponse.json({ error: error.message }, { status: 400 });
    // Check if the session was invalid and return HTTP 401 (UNAUTHORIZED) status.
    else if (error instanceof InvalidSessionError) return new NextResponse(null, { status: 401 });
    // Return HTTP 500 (INTERNAL SERVER ERROR) status for any other errors.
    else {
      console.error("Unexpected error during application/getUserDetails:", error);
      return NextResponse.json({ error: "An unknown error occurred." }, { status: 500 });
    }
  }
}
