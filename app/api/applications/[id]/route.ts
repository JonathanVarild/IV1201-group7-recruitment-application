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
    const { status } = await request.json();

    const client = await getDatabaseClient();

    const result = await client.query(
      `UPDATE applications 
       SET status = $1 
       WHERE application_id = $2 
       RETURNING *`,
      [status, id],
    );

    client.release();

    return NextResponse.json({ application: result.rows[0] }, { status: 200 });
  } catch (error) {
    return NextResponse.json(null, { status: 500 });
  }
}
