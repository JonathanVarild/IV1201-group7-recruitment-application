import { InvalidSessionError } from "@/lib/errors/authErrors";
import { InvalidFormDataError } from "@/lib/errors/generalErrors";
import { getAuthenticatedUserData } from "@/lib/session";
import { setUserCompetence } from "@/server/services/applicationService";
import { NextResponse } from "next/server";
import { SetCompetenceDTO, setCompetenceSchema } from "@/lib/schemas/applicationDTO";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    // Get authenticated user data.
    const userData = await getAuthenticatedUserData();

    // Read the incoming data for setting a competence.
    const competenceData: SetCompetenceDTO = await request.json();

    // Validate the incoming data.
    if (setCompetenceSchema.safeParse(competenceData).success === false) throw new InvalidFormDataError();

    // Set the competence in the user's profile.
    await setUserCompetence(userData.id, competenceData);

    // Return the competences and HTTP 200 (OK) status.
    return NextResponse.json({}, { status: 200 });
  } catch (error) {
    // Check if the form data was invalid and return HTTP 400 (BAD REQUEST) status.
    if (error instanceof InvalidFormDataError) return NextResponse.json({ error: error.message }, { status: 400 });
    // Check if the session was invalid and return HTTP 401 (UNAUTHORIZED) status.
    else if (error instanceof InvalidSessionError) return new NextResponse(null, { status: 401 });
    // Return HTTP 500 (INTERNAL SERVER ERROR) status for any other errors.
    else {
      console.error("Unexpected error during application/setUserCompetence:", error);
      return NextResponse.json({ error: "An unknown error occurred." }, { status: 500 });
    }
  }
}
