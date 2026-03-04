import { getPersonIdByEmail, saveHashedResetToken } from "@/server/services/resetCredentialsService";
import { createHash, randomBytes } from "crypto";

/**
 * Validates entered email exists in the database. Then creates a unique reset token and saves it to the database. Finally, sends the token back to the frontend.
 *
 * @param request the incoming HTTP request with entered email
 * @returns a JSON response
 */
export async function POST(request: Request) {
  const { email } = await request.json();
  const userId = await getPersonIdByEmail(email);

  if (!userId) {
    return Response.json({ error: "Email is not registered" }, { status: 404 });
  }

  const resetToken = randomBytes(14).toString("hex");
  const hashedResetToken = createHash("sha256").update(resetToken).digest("hex");

  await saveHashedResetToken(hashedResetToken, userId);

  return Response.json({ token: resetToken });
}
