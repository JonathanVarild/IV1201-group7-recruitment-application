import { getDatabaseClient, pool } from "@/lib/database";
import { ConflictingApplicationError } from "@/lib/errors/applicationErrors";
import { InvalidFormDataError } from "@/lib/errors/generalErrors";
import { LogType, logUserActivity } from "@/lib/logging";
import { SetAvailabilityDTO, SetCompetenceDTO, AddUserAvailabilityDTO } from "@/lib/schemas/applicationDTO";
import { Competence, UserCompetence } from "@/lib/types/competenceType";
import { FullUserData, UserAvailability } from "@/lib/types/userType";
import { DatabaseError } from "pg";

/**
 * Registers a new application for the user, if they don't already have an unhandled application.
 *
 * @param userID The ID of the user for whom to register the application.
 * @returns The ID of the newly registered application.
 * @throws Will throw a ConflictingApplicationError if the user already has an unhandled application, or an error if the database query fails.
 */
export const registerApplication = async (userID: number, srcRequest: Request): Promise<number> => {
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

    // Log the application submission.
    await logUserActivity(
      databaseClient,
      LogType.INFO,
      "SUBMIT_APPLICATION",
      `User with ID ${userID} submitted a new application with ID ${result.rows[0].application_id}.`,
      srcRequest,
      userID,
    );

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
export async function getFullUserData(userID: number, srcRequest: Request): Promise<FullUserData> {
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

    // Log the full user data fetch.
    await logUserActivity(databaseClient, LogType.INFO, "FETCH_FULL_USER_DATA", `Fetched full user data for user with ID ${userID}.`, srcRequest, userID);

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
 * Fetches all availabilites for a given user ID.
 *
 * @param userID The ID of the user to fetch availability for.
 * @returns The availability intervals of the user, including availability ID and date range.
 * @throws Will throw an error if the database query fails.
 */
export async function getUserAvailability(userID: number): Promise<UserAvailability[]> {
  // Query the database for the user's availability.
  const availabilityQueryResult = await pool.query(
    `SELECT 
      availability_id AS "availabilityID",
      from_date AS "fromDate",
      to_date AS "toDate"
    FROM availability
    WHERE person_id = $1
    ORDER BY from_date ASC, to_date ASC, availability_id ASC`,
    [userID],
  );

  return availabilityQueryResult.rows;
}

/**
 * Fetches the competences associated with a given user ID.
 *
 * @param userID The ID of the user to fetch competences for.
 * @returns An array of competences associated with the user.
 * @throws Will throw an error if the database query fails.
 */
export async function getUserCompetences(userID: number, srcRequest: Request): Promise<UserCompetence[]> {
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

    // Log the user competences fetch.
    await logUserActivity(databaseClient, LogType.INFO, "FETCH_USER_COMPETENCES", `Fetched competences for user with ID ${userID}.`, srcRequest, userID);

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
export async function deleteUserCompetence(userID: number, competenceProfileID: number, srcRequest: Request): Promise<void> {
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

    // Log the deletion of a competence.
    await logUserActivity(
      databaseClient,
      LogType.INFO,
      "DELETE_USER_COMPETENCE",
      `Deleted competence profile with ID ${competenceProfileID} from user with ID ${userID}.`,
      srcRequest,
      userID,
    );

    // Check if we actually deleted a competence, and throw an error if not.
    if (result.rowCount === 0) throw new InvalidFormDataError();

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
export async function setUserCompetence(userID: number, competenceData: SetCompetenceDTO, srcRequest: Request): Promise<void> {
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

    // Log the setting of a competence.
    await logUserActivity(
      databaseClient,
      LogType.INFO,
      "SET_USER_COMPETENCE",
      `Set competence with ID ${competenceData.competenceID} for user with ID ${userID} with ${competenceData.yearsOfExperience} years of experience.`,
      srcRequest,
      userID,
    );

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
 * Sets an availability interval for a user.
 *
 * @param userID The ID of the user for whom the availability is to be set.
 * @param availabilityData The data of the availability to be set, including availability ID, fromDate and toDate.
 * @throws Will throw an error if the availability interval does not exist in the user's profile, if the fromDate is after the toDate, or if the database query fails.
 */
export async function setUserAvailability(userID: number, availabilityData: SetAvailabilityDTO, srcRequest: Request): Promise<void> {
  // Get a database client to perform queries.
  const databaseClient = await getDatabaseClient();
  try {
    // Start a transaction.
    await databaseClient.query("BEGIN");

    // Execute the query to update the availability interval for the user.
    const result = await databaseClient.query(
      `UPDATE availability
    SET from_date = $1, to_date = $2
    WHERE person_id = $3 AND availability_id = $4`,
      [availabilityData.fromDate, availabilityData.toDate, userID, availabilityData.availabilityID],
    );

    // Log the setting of an availability interval.
    await logUserActivity(
      databaseClient,
      LogType.INFO,
      "SET_USER_AVAILABILITY",
      `Set availability with ID ${availabilityData.availabilityID} for user with ID ${userID} from ${availabilityData.fromDate} to ${availabilityData.toDate}.`,
      srcRequest,
      userID,
    );

    // Check if we actually updated an availability interval and throw an error if not.
    if (result.rowCount === 0) throw new InvalidFormDataError();

    // Commit the transaction.
    await databaseClient.query("COMMIT");
  } catch (error) {
    await databaseClient.query("ROLLBACK");
    if (error instanceof DatabaseError && error.code === "23514" && error.constraint === "availability_from_before_to_chk") throw new InvalidFormDataError();
    else throw error;
  } finally {
    databaseClient.release();
  }
}

/**
 * Inserts an availability interval for a user based on the provided user ID and availability data.
 *
 * @param userID The ID of the user for whom the availability is to be set.
 * @param availabilityData The data of the availability to be set, including fromDate and toDate.
 * @return The ID of the newly inserted availability interval.
 * @throws Will throw an error if the database query fails.
 */
export async function insertUserAvailability(userID: number, availabilityData: AddUserAvailabilityDTO, srcRequest: Request): Promise<number> {
  // Get a database client to perform queries.
  const databaseClient = await getDatabaseClient();
  try {
    // Start a transaction.
    await databaseClient.query("BEGIN");

    // Execute the query to insert a new availability interval for the user.
    const result = await databaseClient.query(
      `INSERT INTO availability (person_id, from_date, to_date)
    VALUES ($1, $2, $3)
    RETURNING availability_id`,
      [userID, availabilityData.fromDate, availabilityData.toDate],
    );

    // Log the insertion of an availability interval.
    await logUserActivity(
      databaseClient,
      LogType.INFO,
      "INSERT_USER_AVAILABILITY",
      `Inserted new availability for user with ID ${userID} from ${availabilityData.fromDate} to ${availabilityData.toDate}.`,
      srcRequest,
      userID,
    );

    // Check if we actually inserted the availability and throw an error if not.
    if (result.rowCount === 0) throw new Error("Failed to set the user's availability");

    // Commit the transaction.
    await databaseClient.query("COMMIT");

    // Return the ID of the newly inserted availability interval.
    return result.rows[0]?.availability_id;
  } catch (error) {
    await databaseClient.query("ROLLBACK");
    if (error instanceof DatabaseError && error.code === "23514" && error.constraint === "availability_from_before_to_chk") throw new InvalidFormDataError();
    else throw error;
  } finally {
    databaseClient.release();
  }
}

/**
 * Deletes an availability interval from a user's profile.
 *
 * @param userID The ID of the user whose availability is to be deleted.
 * @param availabilityID The ID of the availability interval to be deleted.
 * @throws Will throw an error if the availability interval does not exist in the user's profile or if the database query fails.
 */
export async function deleteUserAvailability(userID: number, availabilityID: number, srcRequest: Request): Promise<void> {
  // Get a database client to perform queries.
  const databaseClient = await getDatabaseClient();
  try {
    // Start a transaction.
    await databaseClient.query("BEGIN");

    // Execute the delete query to remove the availability interval from the user's profile.
    const result = await databaseClient.query(
      `DELETE FROM availability
    WHERE person_id = $1 AND availability_id = $2`,
      [userID, availabilityID],
    );

    // Log the deletion of an availability interval.
    await logUserActivity(
      databaseClient,
      LogType.INFO,
      "DELETE_USER_AVAILABILITY",
      `Deleted availability with ID ${availabilityID} from user with ID ${userID}.`,
      srcRequest,
      userID,
    );

    // Check if we actually deleted an availability interval, and throw an error if not.
    if (result.rowCount === 0) throw new InvalidFormDataError();

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
