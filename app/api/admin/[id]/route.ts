import { getDatabaseClient } from "@/lib/database";
import { NextRequest, NextResponse } from "next/server";

/**
 * PATCH request handler for updating the status of an application as admin.
 *
 * @param request The incoming request object.
 * @param params An object containing the route parameters.
 * @returns A JSON response indicating the result of the operation.
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { status, currentStatus } = await request.json();

    const client = await getDatabaseClient();

    const result = await client.query(
      `UPDATE applications 
       SET status = $1 
       WHERE application_id = $2 AND status = $3
       RETURNING *`,
      [status, id, currentStatus],
    );

    client.release();

    // If no rows were updated, the status has changed
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Status has changed" }, { status: 409 });
    }

    return NextResponse.json({ application: result.rows[0] }, { status: 200 });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ error: "An unknown error occurred." }, { status: 500 });
  }
}
