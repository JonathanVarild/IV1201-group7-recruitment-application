import { InvalidSessionError } from "@/lib/errors/authErrors";
import { InvalidFormDataError } from "@/lib/errors/generalErrors";
import { getCompetenceListSchema } from "@/lib/schemas/applicationDTO";
import { validateUserSession } from "@/lib/session";
import { getAllCompetences } from "@/server/services/applicationService";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    // Ensure that the user is authenticated.
    await validateUserSession();

    // Get the data from the request body.
    const localeInfo = await request.json();

    // Validate the locale information.
    if (getCompetenceListSchema.safeParse(localeInfo).success === false) throw new InvalidFormDataError();

    // Get the available competences for the application form.
    const competences = await getAllCompetences(localeInfo.locale);

    // Return the competences and HTTP 200 (OK) status.
    return NextResponse.json(competences, { status: 200 });
  } catch (error) {
    // Check if the form data was invalid and return HTTP 400 (BAD REQUEST) status.
    if (error instanceof InvalidFormDataError) return NextResponse.json({ error: error.message }, { status: 400 });
    // Check if the session was invalid and return HTTP 401 (UNAUTHORIZED) status.
    else if (error instanceof InvalidSessionError) return new NextResponse(null, { status: 401 });
    // Return HTTP 500 (INTERNAL SERVER ERROR) status for any other errors.
    else {
      console.error("Unexpected error during application/getCompetenceList:", error);
      return NextResponse.json({ error: "An unknown error occurred." }, { status: 500 });
    }
  }
}
