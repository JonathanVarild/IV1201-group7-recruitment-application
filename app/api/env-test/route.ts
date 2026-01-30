import { getFirstComponent } from "@/server/services/exampleService";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await getFirstComponent();
    return new NextResponse(`Database connectivity test successful: ${data}`, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    console.error("Database connectivity test failed:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
