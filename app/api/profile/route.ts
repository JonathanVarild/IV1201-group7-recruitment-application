import { updateUserSchema, ProfileDTO } from "@/lib/schemas/profileDTO";
import { updateUserProfile } from "@/server/services/authenticationService";
import { InvalidFormDataError } from "@/lib/errors/generalErrors";
import { InvalidSessionError } from "@/lib/errors/authErrors";
import { getAuthenticatedUserData } from "@/lib/session";
import { NextResponse } from "next/server";

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

    const res = NextResponse.json({ message: "Profile updated successfully" }, { status: 201 });
    return res;
  } catch (error) {
    //TODO: Handle error
  }
}
