import { updateUserProfile } from "@/server/services/authenticationService";
import { deleteHashedResetToken, validateResetToken } from "@/server/services/resetCredentialsService";
import { getUserIdByToken } from "@/server/services/resetCredentialsService";

/**
 * Validates the reset token exists and has not expired. Then updates the user profile.
 *
 * @param request the incoming HTTP PUT request with the token and entered new data
 * @returns JSON response
 */
export async function PUT(request: Request) {
  const { token, ...updateData } = await request.json();

  const tokenId = await validateResetToken(token);
  if (!tokenId) {
    return Response.json({ error: "Token är ogiltig eller har gått ut" }, { status: 404 });
  }

  const userId = await getUserIdByToken(token);
  await updateUserProfile(userId, updateData);
  await deleteHashedResetToken(userId);

  return Response.json({ success: true });
}
