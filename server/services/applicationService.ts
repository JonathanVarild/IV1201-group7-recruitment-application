import { getDatabaseClient, pool } from "@/lib/database";
import { ConflictingApplicationError } from "@/lib/errors/applicationErrors";
import { SetCompetenceDTO } from "@/lib/schemas/applicationDTO";
import { Competence, UserCompetence } from "@/lib/types/competenceType";
import { FullUserData } from "@/lib/types/userType";

/**
 * Registers a new application for the user, if they don't already have an unhandled application.
 *
 * @param userID The ID of the user for whom to register the application.
 * @returns The ID of the newly registered application.
 * @throws Will throw a ConflictingApplicationError if the user already has an unhandled application, or an error if the database query fails.
 */
export const registerApplication = async (userID: number): Promise<number> => {
  // Get a database client to perform queries.
  const databaseClient = await getDatabaseClient();
  try {
    // Start a transaction.
    await databaseClient.query("BEGIN");

    // Insert a new application for the user only if they do not already have an unhandled one.
    const result = await databaseClient.query(
      `INSERT INTO applications (person_id)
      SELECT $1
      WHERE NOT EXISTS (
        SELECT 1
        FROM applications
        WHERE person_id = $1 AND status = 'unhandled'
      )
      RETURNING application_id`,
      [userID],
    );

    // If no row was inserted, the user already has an unhandled application.
    if (result.rowCount === 0) throw new ConflictingApplicationError();

    // TODO: add logging.

    // Commit the transaction and return the new application ID.
    await databaseClient.query("COMMIT");
    return result.rows[0].application_id;
  } catch (error) {
    await databaseClient.query("ROLLBACK");
    throw error;
  } finally {
    databaseClient.release();
  }
};

/**
 * Fetches the full user data for a given user ID, including personal information and role.
 *
 * @param userID The ID of the user to fetch data for.
 * @returns The full data of the user.
 * @throws Will throw an error if the user does not exist or if the database query fails.
 */
export async function getFullUserData(userID: number): Promise<FullUserData> {
  // Get a database client to perform queries.
  const databaseClient = await getDatabaseClient();
  try {
    // Start a transaction.
    await databaseClient.query("BEGIN");

    // Query the database for the user's full data.
    const fullUserDataQueryResult = await databaseClient.query(
      `SELECT 
      p.person_id AS id,
      p.username,
      p.role_id AS roleID,
      p.email,
      p.name AS firstName,
      p.surname AS lastName,
      p.pnr
    FROM person p
    WHERE p.person_id = $1`,
      [userID],
    );

    //TODO: add logging.

    // Check if we found a user with the given ID, and throw an error if not.
    if (fullUserDataQueryResult.rows.length === 0) throw new Error("Attempted to fetch full user data for non-existing user");

    // Commit the transaction and return the user data.
    await databaseClient.query("COMMIT");
    return fullUserDataQueryResult.rows[0];
  } catch (error) {
    await databaseClient.query("ROLLBACK");
    throw error;
  } finally {
    databaseClient.release();
  }
}

/**
 * Fetches the competences associated with a given user ID.
 *
 * @param userID The ID of the user to fetch competences for.
 * @returns An array of competences associated with the user.
 * @throws Will throw an error if the database query fails.
 */
export async function getUserCompetences(userID: number): Promise<UserCompetence[]> {
  // Get a database client to perform queries.
  const databaseClient = await getDatabaseClient();
  try {
    // Start a transaction.
    await databaseClient.query("BEGIN");

    // Query the database for the user's competences.
    const competencesQueryResult = await databaseClient.query(
      `SELECT 
      c.competence_id AS id,
      c.name,
      pc.years_of_experience AS yearsOfExperience,
      pc.competence_profile_id AS competenceProfileID
    FROM competence_profile pc
    JOIN competence c ON pc.competence_id = c.competence_id
    WHERE pc.person_id = $1`,
      [userID],
    );

    // TODO: add logging.

    // Commit the transaction and return the competences.
    await databaseClient.query("COMMIT");
    return competencesQueryResult.rows;
  } catch (error) {
    await databaseClient.query("ROLLBACK");
    throw error;
  } finally {
    databaseClient.release();
  }
}

/**
 * Deletes a competence from a user's profile based on the provided user ID and competence profile ID.
 *
 * @param userID The ID of the user whose competence is to be deleted.
 * @param competenceProfileID The ID of the competence profile to be deleted from the user's profile.
 * @throws Will throw an error if the competence does not exist in the user's profile or if the database query fails.
 */
export async function deleteUserCompetence(userID: number, competenceProfileID: number): Promise<void> {
  // Get a database client to perform queries.
  const databaseClient = await getDatabaseClient();
  try {
    // Start a transaction.
    await databaseClient.query("BEGIN");

    // Execute the delete query to remove the competence from the user's profile.
    const result = await databaseClient.query(
      `DELETE FROM competence_profile
    WHERE person_id = $1 AND competence_profile_id = $2`,
      [userID, competenceProfileID],
    );

    // TODO: add logging.

    // Check if we actually deleted a competence, and throw an error if not.
    if (result.rowCount === 0) throw new Error("Attempted to delete a competence that does not exist in the user's profile");

    // Commit the transaction.
    await databaseClient.query("COMMIT");
  } catch (error) {
    await databaseClient.query("ROLLBACK");
    throw error;
  } finally {
    databaseClient.release();
  }
}

/**
 * Sets a competence for a user based on the provided user ID and competence data.
 * If the competence already exists, it will be updated with the new years_of_experience, otherwise it will be inserted as a new competence for the user.
 *
 * @param userID The ID of the user for whom the competence is to be set.
 * @param competenceData The data of the competence to be set, including competence ID and yearsOfExperience.
 * @throws Will throw an error if the database query fails.
 */
export async function setUserCompetence(userID: number, competenceData: SetCompetenceDTO): Promise<void> {
  // Get a database client to perform queries.
  const databaseClient = await getDatabaseClient();
  try {
    // Start a transaction.
    await databaseClient.query("BEGIN");

    // Execute the query to insert or update the competence in the user's profile.
    const result = await databaseClient.query(
      `INSERT INTO competence_profile (person_id, competence_id, years_of_experience)
    VALUES ($1, $2, $3)
    ON CONFLICT (person_id, competence_id) DO UPDATE SET years_of_experience = EXCLUDED.years_of_experience`,
      [userID, competenceData.competenceID, competenceData.yearsOfExperience],
    );

    // TODO: add logging.

    // Check if we actually inserted or updated a competence and throw an error if not.
    if (result.rowCount === 0) throw new Error("Failed to set the user's competence");

    // Commit the transaction.
    await databaseClient.query("COMMIT");
  } catch (error) {
    await databaseClient.query("ROLLBACK");
    throw error;
  } finally {
    databaseClient.release();
  }
}

/**
 * Fetches all available competences from the database.
 *
 * @returns An array of all competences.
 * @throws Will throw an error if the database query fails.
 */
export async function getAllCompetences(localeData: string): Promise<Competence[]> {
  const competencesQueryResult = await pool.query(
    `SELECT 
    c.competence_id AS id,
    COALESCE(cl.translation, c.name) AS name
  FROM competence c
  LEFT JOIN competence_translation cl ON c.competence_id = cl.competence_id AND cl.locale = $1`,
    [localeData],
  );

  return competencesQueryResult.rows;
}
