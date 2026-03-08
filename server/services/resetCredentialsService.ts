import { getDatabaseClient, pool } from "@/lib/database";
import { InvalidResetTokenError } from "@/lib/errors/resetCredentialErrors";
import { LogType, logUserActivity } from "@/lib/logging";
import { createHash } from "crypto";

/**
 * Searches for the person id of a user with a given email
 *
 * @param email the given email
 * @param srcRequest the source request used for logging
 * @returns the id of the person found, or undefined
 */
export async function getPersonIdByEmail(email: string, srcRequest?: Request): Promise<number | undefined> {
  const databaseClient = await getDatabaseClient();
  try {
    const queryResult = await databaseClient.query(
      `SELECT person_id FROM person
            WHERE email = $1`,
      [email],
    );
    const personID = queryResult.rows[0]?.person_id;

    if (srcRequest) {
      const eventType = personID ? "RESET_CREDENTIALS_EMAIL_LOOKUP_SUCCESS" : "RESET_CREDENTIALS_EMAIL_LOOKUP_FAILED";
      const message = personID ? `Found user ID ${personID} for email lookup.` : "Reset credentials email lookup failed.";
      await logUserActivity(databaseClient, LogType.INFO, eventType, message, srcRequest, personID);
    }

    return personID;
  } finally {
    databaseClient.release();
  }
}

/**
 * Inserts reset token into database together with user id and time stamp + 15 minute interval.
 *
 * @param hashedResetToken the hashed reset token to insert
 * @param userId the userId of the user requesting credentials reset
 * @param srcRequest the source request used for logging
 */
export async function saveHashedResetToken(hashedResetToken: string, userId: number, srcRequest?: Request) {
  const databaseClient = await getDatabaseClient();
  try {
    // Start transaction.
    await databaseClient.query("BEGIN");

    await databaseClient.query(
      `INSERT INTO password_reset_token(person_id, token_hash, expires_at, created_at)
            VALUES ($1, $2, NOW() + INTERVAL '15 minutes', NOW())`,
      [userId, hashedResetToken],
    );

    if (srcRequest) {
      await logUserActivity(databaseClient, LogType.INFO, "RESET_CREDENTIALS_TOKEN_CREATED", `Created token for user with ID ${userId}.`, srcRequest, userId);
    }

    // Commit.
    await databaseClient.query("COMMIT");
  } catch (error) {
    // Rollback.
    await databaseClient.query("ROLLBACK");

    if (srcRequest) {
      await logUserActivity(null, LogType.ERROR, "RESET_CREDENTIALS_TOKEN_CREATE_FAILED", `Failed to create token for user with ID ${userId}.`, srcRequest, userId);
    }

    throw error;
  } finally {
    databaseClient.release();
  }
}

/**
 * Deletes the reset token from the database.
 *
 * @param userId the userId of the user reseting their credentials
 * @param srcRequest the source request used for logging
 */
export async function deleteHashedResetToken(userId: number, srcRequest?: Request) {
  const databaseClient = await getDatabaseClient();
  try {
    // Start transaction.
    await databaseClient.query("BEGIN");

    const deleteResult = await databaseClient.query(
      `DELETE FROM password_reset_token
            WHERE person_id = $1`,
      [userId],
    );

    if (srcRequest) {
      const eventType = deleteResult.rowCount === 0 ? "RESET_CREDENTIALS_TOKEN_DELETE_MISS" : "RESET_CREDENTIALS_TOKEN_DELETED";
      const message = deleteResult.rowCount === 0 ? `No reset credentials token found for user with ID ${userId}.` : `Deleted token for user with ID ${userId}.`;
      await logUserActivity(databaseClient, LogType.INFO, eventType, message, srcRequest, userId);
    }

    // Commit.
    await databaseClient.query("COMMIT");
  } catch (error) {
    // Rollback.
    await databaseClient.query("ROLLBACK");

    if (srcRequest) {
      await logUserActivity(null, LogType.ERROR, "RESET_CREDENTIALS_TOKEN_DELETE_FAILED", `Failed to delete token for user with ID ${userId}.`, srcRequest, userId);
    }

    throw error;
  } finally {
    databaseClient.release();
  }
}

/**
 * Checks in the database that the token exists and is not expired.
 *
 * @param token the given reset token
 * @param srcRequest the source request used for logging
 * @returns the token id, or undefined
 * @throws {InvalidResetTokenError} if the token is invalid or expired
 */
export async function validateResetToken(token: string, srcRequest?: Request): Promise<number> {
  const hashedToken = createHash("sha256").update(token).digest("hex");
  const result = await pool.query(
    `SELECT token_id FROM password_reset_token 
       WHERE token_hash = $1 AND expires_at >= NOW()`,
    [hashedToken],
  );
  if (!result.rows[0]) {
    if (srcRequest) {
      await logUserActivity(null, LogType.INFO, "RESET_CREDENTIALS_TOKEN_VALIDATION_FAILED", "Reset credentials token validation failed.", srcRequest);
    }
    throw new InvalidResetTokenError();
  }

  if (srcRequest) {
    await logUserActivity(null, LogType.INFO, "RESET_CREDENTIALS_TOKEN_VALIDATED", `Reset credentials token validated for token ID ${result.rows[0].token_id}.`, srcRequest);
  }

  return result.rows[0].token_id;
}

/**
 * Gets the user connected to a given token.
 *
 * @param token the given reset token
 * @param srcRequest the source request used for logging
 * @returns the person id of the user found, or undefined
 * @throws {InvalidResetTokenError} if the token is invalid or expired
 */
export async function getUserIdByToken(token: string, srcRequest?: Request): Promise<number> {
  const hashedToken = createHash("sha256").update(token).digest("hex");
  const result = await pool.query(
    `SELECT person_id FROM password_reset_token 
       WHERE token_hash = $1 AND expires_at >= NOW()`,
    [hashedToken],
  );
  if (!result.rows[0]) {
    if (srcRequest) {
      await logUserActivity(null, LogType.INFO, "RESET_CREDENTIALS_USER_LOOKUP_BY_TOKEN_FAILED", "Reset credentials user lookup by token failed.", srcRequest);
    }
    throw new InvalidResetTokenError();
  }

  if (srcRequest) {
    await logUserActivity(
      null,
      LogType.INFO,
      "RESET_CREDENTIALS_USER_LOOKUP_BY_TOKEN_SUCCESS",
      `Reset credentials lookup succeeded for user with ID ${result.rows[0].person_id}.`,
      srcRequest,
      result.rows[0].person_id,
    );
  }

  return result.rows[0].person_id;
}
