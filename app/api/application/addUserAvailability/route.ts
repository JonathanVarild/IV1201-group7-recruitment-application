import { ConflictingApplicationError } from "@/lib/errors/applicationErrors";
import { InvalidSessionError } from "@/lib/errors/authErrors";
import { InvalidFormDataError } from "@/lib/errors/generalErrors";
import { getAuthenticatedUserData } from "@/lib/session";
import { insertUserAvailability, validateNoUnhandledApplication } from "@/server/services/applicationService";
import { NextResponse } from "next/server";
import { AddUserAvailabilityDTO, addUserAvailabilitySchema } from "@/lib/schemas/applicationDTO";

export const dynamic = "force-dynamic";

/**
 * Endpoint for adding availability to a users' profile.
 *
 * @param request The incoming HTTP request.
 * @return HTTP response.
 */
export async function POST(request: Request) {
  try {
    // Get authenticated user data.
    const userData = await getAuthenticatedUserData();

    // Ensure the user does not have an active application.
    await validateNoUnhandledApplication(userData.id);

    // Read the incoming data for setting the availability.
    const availabilityData: AddUserAvailabilityDTO = await request.json();

    // Validate the incoming data.
    if (addUserAvailabilitySchema.safeParse(availabilityData).success === false) throw new InvalidFormDataError();

    // Set the availability in the user's profile.
    const availabilityID = await insertUserAvailability(userData.id, availabilityData, request);

    // Return HTTP 200 (OK) status with the ID of the newly created availability.
    return NextResponse.json({ availabilityID }, { status: 200 });
  } catch (error) {
    // Check if there is a conflicting unhandled application and return HTTP 409 (CONFLICT) status.
    if (error instanceof ConflictingApplicationError) return NextResponse.json({ error: error.message, translationKey: error.translationKey }, { status: 409 });
    // Check if the form data was invalid and return HTTP 400 (BAD REQUEST) status.
    else if (error instanceof InvalidFormDataError) return NextResponse.json({ error: error.message }, { status: 400 });
    // Check if the session was invalid and return HTTP 401 (UNAUTHORIZED) status.
    else if (error instanceof InvalidSessionError) return new NextResponse(null, { status: 401 });
    // Return HTTP 500 (INTERNAL SERVER ERROR) status for any other errors.
    else {
      console.error("Unexpected error during application/addUserAvailability:", error);
      return NextResponse.json({ error: "An unknown error occurred." }, { status: 500 });
    }
  }
}
