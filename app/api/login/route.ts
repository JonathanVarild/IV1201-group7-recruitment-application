import { InvalidCredentialsError } from "@/lib/errors/authErrors";
import { InvalidFormDataError } from "@/lib/errors/generalErrors";
import { CredentialsDTO, credentialsSchema } from "@/lib/schemas/loginDTO";
import { authenticateUser } from "@/server/services/authenticationService";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Endpoint for authenticating a user and creating a session.
 *
 * @param request The incoming HTTP request.
 * @return HTTP response.
 */
export async function POST(request: Request) {
  try {
    // Read the incoming user credentials
    const userCredentials: CredentialsDTO = await request.json();

    // Validate the user credentials.
    if (credentialsSchema.safeParse(userCredentials).success === false) throw new InvalidFormDataError();

    // Authenticate the user.
    const { userData, sessionData } = await authenticateUser(userCredentials, request);

    // Create response.
    const res = NextResponse.json({ ...userData }, { status: 200 });

    // Set session cookie.
    res.cookies.set("session", sessionData.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: sessionData.expiresAt,
    });

    // Return the user data and HTTP 200 (OK) status.
    return res;
  } catch (error) {
    // Check if the form data was invalid and return HTTP 400 (BAD REQUEST) status.
    if (error instanceof InvalidFormDataError) return NextResponse.json({ error: error.message }, { status: 400 });
    // Check if the credentials were invalid and return HTTP 401 (UNAUTHORIZED) status.
    else if (error instanceof InvalidCredentialsError) return NextResponse.json({ error: error.message }, { status: 401 });
    // Check if the JSON parsing failed and return HTTP 400 (BAD REQUEST) status.
    else if (error instanceof SyntaxError) return NextResponse.json({ error: "Malformed JSON in request body." }, { status: 400 });
    // Return HTTP 500 (INTERNAL SERVER ERROR) status for any other errors.
    else {
      console.error("Unexpected error during authentication:", error);
      return NextResponse.json({ error: "An unknown error occurred." }, { status: 500 });
    }
  }
}
