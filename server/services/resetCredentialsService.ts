import { getDatabaseClient } from "@/lib/database";
import { createHash } from "crypto";

/**
 * Searches for the person id of a user with a given email
 *
 * @param email the given email
 * @returns the id of the person found, or undefined
 */
export async function getPersonIdByEmail(email: string): Promise<number> {
  const databaseClient = await getDatabaseClient();
  try {
    const queryResult = await databaseClient.query(
      `SELECT person_id FROM person
            WHERE email = $1`,
      [email],
    );
    return queryResult.rows[0].person_id;
  } finally {
    databaseClient.release();
  }
}

/**
 * Inserts reset token into database together with user id and time stamp + 15 minute interval.
 *
 * @param hashedResetToken the hashed reset token to insert
 * @param userId the userId of the user requesting credentials reset
 */
export async function saveHashedResetToken(hashedResetToken: string, userId: number) {
  const databaseClient = await getDatabaseClient();
  try {
    // Start transaction.
    await databaseClient.query("BEGIN");

    await databaseClient.query(
      `INSERT INTO password_reset_token(person_id, token_hash, expires_at, created_at)
            VALUES ($1, $2, NOW() + INTERVAL '15 minutes', NOW())`,
      [userId, hashedResetToken],
    );

    // Commit.
    await databaseClient.query("COMMIT");
  } catch (error) {
    // Rollback.
    await databaseClient.query("ROLLBACK");
    throw error;
  } finally {
    databaseClient.release();
  }
}

/**
 * Deletes the reset token from the database.
 *
 * @param userId the userId of the user reseting their credentials
 */
export async function deleteHashedResetToken(userId: number) {
  const databaseClient = await getDatabaseClient();
  try {
    // Start transaction.
    await databaseClient.query("BEGIN");

    await databaseClient.query(
      `DELETE FROM password_reset_token
            WHERE person_id = $1`,
      [userId],
    );

    // Commit.
    await databaseClient.query("COMMIT");
  } catch (error) {
    // Rollback.
    await databaseClient.query("ROLLBACK");
    throw error;
  } finally {
    databaseClient.release();
  }
}

/**
 * Checks in the database that the token exists and is not expired.
 *
 * @param token the given reset token
 * @returns the token id, or undefined
 */
export async function validateResetToken(token: string): Promise<number> {
  const databaseClient = await getDatabaseClient();
  try {
    const hashedToken = createHash("sha256").update(token).digest("hex");
    const result = await databaseClient.query(
      `SELECT token_id FROM password_reset_token 
       WHERE token_hash = $1 AND expires_at >= NOW()`,
      [hashedToken],
    );
    return result.rows[0].token_id;
  } finally {
    databaseClient.release();
  }
}

/**
 * Gets the user connected to a given token.
 *
 * @param token the given reset token
 * @returns the person id of the user found, or undefined
 */
export async function getUserIdByToken(token: string): Promise<number> {
  const databaseClient = await getDatabaseClient();
  try {
    const hashedToken = createHash("sha256").update(token).digest("hex");
    const result = await databaseClient.query(
      `SELECT person_id FROM password_reset_token 
       WHERE token_hash = $1 AND expires_at >= NOW()`,
      [hashedToken],
    );
    return result.rows[0].person_id;
  } finally {
    databaseClient.release();
  }
}
