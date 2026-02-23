import { validateResetToken } from "@/server/services/resetCredentialsService";

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    const tokenId = await validateResetToken(token);

    if (!tokenId) {
      return Response.json({ error: "Token is not available or out of time" }, { status: 404 });
    }

    return Response.json({ valid: true });
  } catch (error) {
    // TODO error
  }
}
