import { createHmac, randomBytes } from "crypto";
import { GeneratedSession } from "./types/sessionType";
import { pool } from "@/lib/database";
import { UserData } from "./types/userType";
import { InvalidSessionError } from "./errors/authErrors";
import { cookies } from "next/headers";

const SESSION_DURATION_DAYS = 7;

function hashToken(value: string): string {
  if (!process.env.SESSION_SECRET) throw new Error("Missing SESSION_SECRET environment variable.");
  return createHmac("sha256", process.env.SESSION_SECRET).update(value).digest("hex");
}

/**
 * Generated a new session with token, hashed token and expiration date.
 * @returns The generated session.
 */
export function generateSession(): GeneratedSession {
  const token = randomBytes(32).toString("base64url");
  return { token: token, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000) };
}

/**
 * Retrieves user data associated with session token.
 * @param sessionToken - The session token.
 * @returns The user data.
 * @throws Will throw an InvalidSessionError if the session is invalid or expired.
 */
export async function getUserDataFromSession(sessionToken: string): Promise<UserData> {
  if (!sessionToken) throw new InvalidSessionError();
  const tokenHash = hashToken(sessionToken);

  const result = await pool.query(
    `SELECT
      p.person_id,
      p.username,
      r.role_id,
      r.name AS role_name
    FROM session s
    JOIN person p ON s.person_id = p.person_id
    JOIN role r ON p.role_id = r.role_id
    WHERE s.token_hash = $1`,
    [tokenHash],
  );

  // Check so we found a valid session
  if (result.rows.length === 0) throw new InvalidSessionError();

  // Return user data
  return {
    id: result.rows[0].person_id,
    username: result.rows[0].username,
    roleID: Number(result.rows[0].role_id),
    role: result.rows[0].role_name,
  };
}

/**
 * Retrieves the data from the currently authenticated user.
 *
 * @returns The user data or null if no valid session exists.
 * @throws Will throw an InvalidSessionError if the session is invalid or expired.
 */
export async function getAuthenticatedUserData(): Promise<UserData | null> {
  const token = (await cookies()).get("session")?.value;
  if (!token) throw new InvalidSessionError();
  const userData = await getUserDataFromSession(token);

  return userData;
}

/**
 * Deletes a session from the database.
 *
 * @param sessionToken The session token to delete.
 * @returns A promise that resolves when the session is deleted.
 */
export async function deleteSession(): Promise<void> {
  const token = (await cookies()).get("session")?.value;
  if (!token) return;
  const tokenHash = hashToken(token);
  await pool.query(`DELETE FROM session WHERE token_hash = $1`, [tokenHash]);
}
