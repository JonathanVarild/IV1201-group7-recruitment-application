import { getSupabase } from "@/lib/supabase";

/**
 * Fetches the name of the first component from the "competence" table.
 *
 * @returns The name of the first component in the "competence" table.
 * @throws Will throw an error if the database query fails.
 */
export async function getFirstComponent(): Promise<string> {
  const { data, error } = await getSupabase().from("competence").select("*").limit(1).single();

  if (error) {
    throw new Error(`Database connectivity test failed: ${error.message}`);
  }

  return data.name;
}
