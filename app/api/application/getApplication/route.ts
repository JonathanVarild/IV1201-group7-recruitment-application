import { InvalidSessionError } from "@/lib/errors/authErrors";
import { getAuthenticatedUserData } from "@/lib/session";
import { getSubmittedApplication } from "@/server/services/applicationService";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const userData = await getAuthenticatedUserData();
    const application = await getSubmittedApplication(userData.id);
    return NextResponse.json({ application }, { status: 200 });
  } catch (error) {
    if (error instanceof InvalidSessionError) return new NextResponse(null, { status: 401 });

    console.error("Unexpected error during application/getApplication:", error);
    return NextResponse.json({ error: "An unknown error occurred." }, { status: 500 });
  }
}
