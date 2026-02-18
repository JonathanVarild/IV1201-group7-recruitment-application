import { InvalidFormDataError } from "@/lib/errors/generalErrors";
import { ConflictingSignupDataError } from "@/lib/errors/signupErrors";
import { NewUserDTO, newUserSchema } from "@/lib/schemas/userDTO";
import { registerUser } from "@/server/services/authenticationService";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    // Read the incoming user post data
    const userData: NewUserDTO = await request.json();

    // Validate the user data which will throw if invalid.
    if (newUserSchema.safeParse(userData).success === false) throw new InvalidFormDataError();

    // Create the user.
    const { userID, sessionData } = await registerUser(userData, request);

    // Prepare the response.
    const res = NextResponse.json({ userID }, { status: 201 });

    // Set session cookie.
    res.cookies.set("session", sessionData.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: sessionData.expiresAt,
    });

    // Return the newly created user ID and HTTP 201 (CREATED) status.
    return res;
  } catch (error) {
    // Check if there is a conflicting user in the database and return HTTP 409 (CONFLICT) status.
    if (error instanceof ConflictingSignupDataError) return NextResponse.json({ error: error.message, translationKey: error.translationKey }, { status: 409 });
    // Check if the form data was invalid and return HTTP 400 (BAD REQUEST) status.
    else if (error instanceof InvalidFormDataError) return NextResponse.json({ error: error.message, translationKey: error.translationKey }, { status: 400 });
    // Return HTTP 500 (INTERNAL SERVER ERROR) status for any other errors.
    else {
      console.error("Unexpected error during signup:", error);
      return NextResponse.json({ error: "An unknown error occurred.", translationKey: "unknownError" }, { status: 500 });
    }
  }
}
