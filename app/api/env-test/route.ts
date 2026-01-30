import { NextResponse } from "next/server";
import { query } from "@/lib/database";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { rows } = await query("SELECT 1 AS result;");
    const result = rows[0]?.result ?? null;

    return new NextResponse(`Database connectivity test successful: ${result}`, { status: 200 });
  } catch (error) {
    console.error("environment test failed:", error);
    return new Response("Database connectivity failed", { status: 500 });
  }
}
