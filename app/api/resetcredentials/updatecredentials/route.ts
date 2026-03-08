import { updateUserProfile } from "@/server/services/authenticationService";
import { deleteHashedResetToken, getUserIdByToken, validateResetToken } from "@/server/services/resetCredentialsService";
import { InvalidFormDataError } from "@/lib/errors/generalErrors";
import { ConflictingSignupDataError } from "@/lib/errors/signupErrors";
import { NextResponse } from "next/server";

/**
 * Validates the reset token exists and has not expired. Then updates the user profile.
 *
 * @param request the incoming HTTP PUT request with the token and entered new data
 * @returns JSON response
 */
export async function PUT(request: Request) {
  try {
    const { token, ...updateData } = await request.json();

    const tokenId = await validateResetToken(token);
    if (!tokenId) {
      return NextResponse.json({ error: "Token är ogiltig eller har gått ut" }, { status: 404 });
    }

    const userId = await getUserIdByToken(token);
    if (!userId) {
      return NextResponse.json({ error: "Token är ogiltig eller har gått ut" }, { status: 404 });
    }

    await updateUserProfile(userId, updateData);
    await deleteHashedResetToken(userId);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (error instanceof ConflictingSignupDataError) return NextResponse.json({ error: error.message, translationKey: error.translationKey }, { status: 409 });
    else if (error instanceof InvalidFormDataError) return NextResponse.json({ error: error.message, translationKey: error.translationKey }, { status: 400 });
    else {
      console.error("Unexpected error during updatecredentials:", error);
      return NextResponse.json({ error: "An unknown error occurred.", translationKey: "unknownError" }, { status: 500 });
    }
  }
}
