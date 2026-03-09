import { getTranslations } from "next-intl/server";
import { NextRequest, NextResponse } from "next/server";
import { ApplicationStatus, getApplicationsByStatus } from "@/server/services/adminService";

const VALID_STATUSES: ApplicationStatus[] = ["unhandled", "accepted", "rejected"];
const PAGE_SIZE = 5;

const isApplicationStatus = (status: string): status is ApplicationStatus => {
  return VALID_STATUSES.includes(status as ApplicationStatus);
};

/**
 * Method to handle GET requests for fetching applications by status with pagination support.
 *
 * @param request The incoming Next.js request object.
 * @returns A JSON response containing the applications data or an error message.
 */
export async function GET(request: NextRequest) {
  try {
    const statusParam = request.nextUrl.searchParams.get("status") ?? "";
    const offsetParam = request.nextUrl.searchParams.get("offset") ?? "0";
    const locale = (request.nextUrl.searchParams.get("locale") ?? "en") as "en" | "sv";

    if (!isApplicationStatus(statusParam)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }

    const parsedOffset = Number.parseInt(offsetParam, 10);
    const offset = Number.isNaN(parsedOffset) || parsedOffset < 0 ? 0 : parsedOffset;

    const tDetails = await getTranslations({ locale, namespace: "AdminPage.applicationDetails" });

    const result = await getApplicationsByStatus(
      {
        noCompetencesText: tDetails("noCompetences"),
        noAvailabilityText: tDetails("noAvailability"),
        yearsText: tDetails("years"),
        availabilityToText: tDetails("availabilityTo"),
        locale,
      },
      statusParam,
      PAGE_SIZE,
      offset,
    );

    return NextResponse.json(result, { status: 200 });
  } catch {
    return NextResponse.json({ error: "An unknown error occurred." }, { status: 500 });
  }
}
