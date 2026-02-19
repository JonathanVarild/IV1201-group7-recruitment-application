import { InvalidSessionError } from "@/lib/errors/authErrors";
import { InvalidFormDataError } from "@/lib/errors/generalErrors";
import { getAuthenticatedUserData } from "@/lib/session";
import { setUserAvailability } from "@/server/services/applicationService";
import { NextResponse } from "next/server";
import { SetAvailabilityDTO, setAvailabilitySchema } from "@/lib/schemas/applicationDTO";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    // Get authenticated user data.
    const userData = await getAuthenticatedUserData();

    // Read the incoming data for setting the availability.
    const availabilityData: SetAvailabilityDTO = await request.json();

    // Validate the incoming data.
    if (setAvailabilitySchema.safeParse(availabilityData).success === false) throw new InvalidFormDataError();

    // Update the availability in the user's profile.
    await setUserAvailability(userData.id, availabilityData, request);

    // Return HTTP 200 (OK) status with the ID of the newly created availability.
    return NextResponse.json({}, { status: 200 });
  } catch (error) {
    // Check if the form data was invalid and return HTTP 400 (BAD REQUEST) status.
    if (error instanceof InvalidFormDataError) return NextResponse.json({ error: error.message }, { status: 400 });
    // Check if the session was invalid and return HTTP 401 (UNAUTHORIZED) status.
    else if (error instanceof InvalidSessionError) return new NextResponse(null, { status: 401 });
    // Return HTTP 500 (INTERNAL SERVER ERROR) status for any other errors.
    else {
      console.error("Unexpected error during application/setUserAvailability:", error);
      return NextResponse.json({ error: "An unknown error occurred." }, { status: 500 });
    }
  }
}
