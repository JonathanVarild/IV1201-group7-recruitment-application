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
 * Retrieves the data from the currently authenticated user.
 *
 * @returns The user data.
 * @throws Will throw an InvalidSessionError if the session is invalid or expired.
 */
export async function getAuthenticatedUserData(): Promise<UserData> {
  // Get the session token from the cookies, and throw an error if it doesn't exist.
  const token = (await cookies()).get("session")?.value;
  if (!token) throw new InvalidSessionError();

  // Hash the token to compare with the database.
  const tokenHash = hashToken(token);

  // Query the database for the session and associated user data.
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
 * Validates that a user session is valid and not expired.
 *
 * @throws Will throw an InvalidSessionError if the session is invalid or expired.
 */
export async function validateUserSession(): Promise<void> {
  // Get the session token from the cookies, and throw an error if it doesn't exist.
  const token = (await cookies()).get("session")?.value;
  if (!token) throw new InvalidSessionError();

  // Hash the token to compare with the database.
  const tokenHash = hashToken(token);

  // Check if the session exists and isn't expired.
  const result = await pool.query(`SELECT 1 FROM session WHERE token_hash = $1 AND expires_at > NOW()`, [tokenHash]);

  // Check so we found a valid session
  if (result.rows.length === 0) throw new InvalidSessionError();
}

/**
 * Validates that a user session is valid, not expired and belongs to a recruiter user.
 *
 * @throws Will throw an InvalidSessionError if the session is invalid, expired or doesn't belong to a recruiter user.
 */
export async function validateUserSessionAndRecruiter(): Promise<void> {
  // Get the session token from the cookies, and throw an error if it doesn't exist.
  const token = (await cookies()).get("session")?.value;
  if (!token) throw new InvalidSessionError();

  // Hash the token to compare with the database.
  const tokenHash = hashToken(token);

  // Check if the session exists, isn't expired and belongs to a recruiter user.
  const result = await pool.query(
    `SELECT 1 FROM session s
    JOIN person p ON s.person_id = p.person_id
    WHERE s.token_hash = $1 AND s.expires_at > NOW() AND p.role_id = (SELECT role_id FROM role WHERE name = 'recruiter')`,
    [tokenHash],
  );

  // Check so we found a valid session for a recruiter user.
  if (result.rows.length === 0) throw new InvalidSessionError();
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
