import { getDatabaseClient } from "@/lib/database";
import { ApplicationFullInformation } from "@/lib/types/applicationType";

interface GetApplicationsOptions {
  noCompetencesText: string;
  noAvailabilityText: string;
}

/**
 * Fetches all applications including the person, competences, and availability.
 *
 * @param options Options for handling missing competences and availability text.
 * @returns A promise that resolves to an array of ApplicationFullInformation objects.
 */
export async function getApplications(options: GetApplicationsOptions): Promise<ApplicationFullInformation[]> {
  const client = await getDatabaseClient();

  try {
    const result = await client.query(`
      WITH 
      applications_with_person AS (
        SELECT 
          a.application_id,
          a.created_at,
          a.status,
          a.person_id,
          p.name,
          p.surname,
          p.username,
          p.email
        FROM applications AS a
        JOIN person AS p ON a.person_id = p.person_id
      ),

      competences_agg AS (
        SELECT 
          cp.person_id,
          STRING_AGG(CONCAT(c.name, ' (', cp.years_of_experience, ' years)'), ', ') as competences
        FROM competence_profile AS cp
        JOIN competence AS c ON cp.competence_id = c.competence_id
        WHERE c.name IS NOT NULL AND cp.years_of_experience IS NOT NULL
        GROUP BY cp.person_id
      ),

      availability_agg AS (
        SELECT 
          av.person_id,
          STRING_AGG(CONCAT(av.from_date, ' to ', av.to_date), ', ') as availability
        FROM availability AS av
        WHERE av.from_date IS NOT NULL AND av.to_date IS NOT NULL
        GROUP BY av.person_id
      )

      SELECT 
        awp.application_id,
        awp.created_at as date_of_registration,
        awp.status,
        awp.name,
        awp.surname,
        awp.username,
        awp.email,
        comp.competences,
        avail.availability
      FROM applications_with_person AS awp
      LEFT JOIN competences_agg AS comp ON awp.person_id = comp.person_id
      LEFT JOIN availability_agg AS avail ON awp.person_id = avail.person_id
      ORDER BY awp.created_at DESC
    `);

    return result.rows.map((row) => ({
      id: row.application_id.toString(),
      name: {
        firstName: row.name,
        lastName: row.surname,
      },
      username: row.username,
      email: row.email,
      applicationDate: new Date(row.date_of_registration).toISOString().split("T")[0],
      status: row.status,
      answers: [
        {
          question: "competences",
          answer: row.competences || options.noCompetencesText,
        },
        {
          question: "availability",
          answer: row.availability || options.noAvailabilityText,
        },
      ],
    }));
  } finally {
    client.release();
  }
}
