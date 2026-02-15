import { updateUserSchema, ProfileDTO } from "@/lib/schemas/profileDTO";
import { updateUserProfile } from "@/server/services/authenticationService";
import { InvalidFormDataError } from "@/lib/errors/generalErrors";
import { InvalidSessionError } from "@/lib/errors/authErrors";
import { getAuthenticatedUserData } from "@/lib/session";
import { NextResponse } from "next/server";
import { ConflictingSignupDataError } from "@/lib/errors/signupErrors";

export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  try {
    const userData = await getAuthenticatedUserData();

    if (!userData) {
      throw new InvalidSessionError();
    }

    const updateData: ProfileDTO = await request.json();

    if (updateUserSchema.safeParse(updateData).success === false) {
      throw new InvalidFormDataError();
    }

    await updateUserProfile(userData.id, updateData);

    // translations?
    const res = NextResponse.json({ message: "Profile updated successfully" }, { status: 201 });
    return res;
  } catch (error) {
    // translations?
    if (error instanceof ConflictingSignupDataError) return NextResponse.json({ error: error.message }, { status: 409 });
    else if (error instanceof InvalidFormDataError) return NextResponse.json({ error: error.message }, { status: 400 });
    else {
      console.error("Unexpected error during profile updating:", error);
      return NextResponse.json({ error: "An unknown error occurred." }, { status: 500 });
    }
  }
}
