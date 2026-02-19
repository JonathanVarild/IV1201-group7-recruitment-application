import { getDatabaseClient } from "@/lib/database";
import { ApplicationFullInformation } from "@/lib/types/applicationType";

interface GetApplicationsOptions {
  noCompetencesText: string;
  noAvailabilityText: string;
}

/**
 * Type module for handling application-related database operations.
 */
export type ApplicationStatus = "unhandled" | "accepted" | "rejected";

/**
 * Interface for the result of a paginated applications query.
 */
export interface PaginatedApplicationsResult {
  applications: ApplicationFullInformation[];
  total: number;
  hasMore: boolean;
}

interface ApplicationQueryRow {
  application_id: number | string;
  name: string;
  surname: string;
  username: string;
  email: string;
  date_of_registration: Date | string;
  status: string;
  competences: string | null;
  availability: string | null;
}

/**
 * Maps database rows to ApplicationFullInformation objects.
 *
 * @param rows The database rows to map.
 * @param options Options for handling missing competences and availability text.
 * @returns An array of ApplicationFullInformation objects.
 */
const mapApplications = (rows: ApplicationQueryRow[], options: GetApplicationsOptions): ApplicationFullInformation[] => {
  return rows.map((row) => ({
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
};

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

    return mapApplications(result.rows, options);
  } finally {
    client.release();
  }
}

/**
 * Fetches paginated applications for a specific status.
 *
 * @param options Options for handling missing competences and availability text.
 * @param status Application status to filter by.
 * @param limit Number of applications to return.
 * @param offset Number of applications to skip.
 * @returns A paginated result with applications, total count and hasMore flag.
 */
export async function getApplicationsByStatus(options: GetApplicationsOptions, status: ApplicationStatus, limit: number, offset: number): Promise<PaginatedApplicationsResult> {
  const client = await getDatabaseClient();

  try {
    const [result, countResult] = await Promise.all([
      client.query(
        `
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
          WHERE a.status = $1
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
        LIMIT $2 OFFSET $3
      `,
        [status, limit, offset],
      ),
      client.query(
        `
        SELECT COUNT(*)::int AS total
        FROM applications
        WHERE status = $1
      `,
        [status],
      ),
    ]);

    const total = countResult.rows[0]?.total ?? 0;
    const applications = mapApplications(result.rows, options);

    return {
      applications,
      total,
      hasMore: offset + applications.length < total,
    };
  } finally {
    client.release();
  }
}
