import { InvalidSessionError } from "@/lib/errors/authErrors";
import { InvalidFormDataError } from "@/lib/errors/generalErrors";
import { getAuthenticatedUserData } from "@/lib/session";
import { deleteUserAvailability } from "@/server/services/applicationService";
import { NextResponse } from "next/server";
import { DeleteAvailabilityDTO, deleteAvailabilitySchema } from "@/lib/schemas/applicationDTO";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    // Get authenticated user data.
    const userData = await getAuthenticatedUserData();

    // Read the incoming data for deleting a competence.
    const availabilityData: DeleteAvailabilityDTO = await request.json();

    // Validate the incoming data.
    if (deleteAvailabilitySchema.safeParse(availabilityData).success === false) throw new InvalidFormDataError();

    // Delete the competence from the user's profile.
    await deleteUserAvailability(userData.id, availabilityData.availabilityID);

    // Return the competences and HTTP 200 (OK) status.
    return NextResponse.json({}, { status: 200 });
  } catch (error) {
    // Check if the form data was invalid and return HTTP 400 (BAD REQUEST) status.
    if (error instanceof InvalidFormDataError) return NextResponse.json({ error: error.message }, { status: 400 });
    // Check if the session was invalid and return HTTP 401 (UNAUTHORIZED) status.
    else if (error instanceof InvalidSessionError) return new NextResponse(null, { status: 401 });
    // Return HTTP 500 (INTERNAL SERVER ERROR) status for any other errors.
    else {
      console.error("Unexpected error during application/deleteUserAvailability:", error);
      return NextResponse.json({ error: "An unknown error occurred." }, { status: 500 });
    }
  }
}
