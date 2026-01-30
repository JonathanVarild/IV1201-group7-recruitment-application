import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await getSupabase().from("competence").select("*").limit(1).single();

  if (error) {
    console.error("Database connectivity test failed:", error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return new NextResponse(`Database connectivity test successful: ${data.name}`, { status: 200 });
}
