import { getDatabaseClient } from "@/lib/database";
import { createHash } from "crypto";

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

export async function saveHashedResetToken(hashedResetToken: string, userId: number) {
  const databaseClient = await getDatabaseClient();
  try {
    // Start transaction.
    await databaseClient.query("BEGIN");

    await databaseClient.query(
      `INSERT INTO password_reset_token(person_id, token_hash)
            VALUES ($1, $2)`,
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
