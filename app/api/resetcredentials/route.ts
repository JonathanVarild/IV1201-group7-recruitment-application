import { getPersonIdByEmail, saveHashedResetToken } from "@/server/services/resetCredentialsService";
import { createHash, randomBytes } from "crypto";

export async function POST(req: Request) {
  const { email } = await req.json();
  console.error(email);
  const userId = await getPersonIdByEmail(email);
  console.log("userId: " + { userId });

  if (!userId) {
    return Response.json({ error: "Email is not registered" }, { status: 404 });
  }

  const resetToken = randomBytes(14).toString("hex");
  const hashedResetToken = createHash("sha256").update(resetToken).digest("hex");

  await saveHashedResetToken(hashedResetToken, userId);

  return Response.json({ token: resetToken });
}
