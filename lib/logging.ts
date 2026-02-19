import { PoolClient } from "pg";
import { pool } from "./database";

export enum LogType {
  INFO = "INFO",
  ERROR = "ERROR",
  DEBUG = "DEBUG",
}

/**
 * Function used to log a user activity to the database.
 *
 * @param client A database client from the connection pool, used for transactions.
 * @param logType The type of log entry (e.g., INFO, ERROR, DEBUG).
 * @param eventType An identifier for the specific event such as "USER_LOGIN", "APPLICATION_SUBMISSION", etc.
 * @param message The message with details about the event being logged.
 * @param request The request which is the source of the log entry.
 * @param actor_id (optional) The ID of the user associated with the activity, if applicable.
 * @returns The ID of the newly created log entry in the database.
 * @throws Will throw an error if the query fails.
 */
export async function logUserActivity(client: PoolClient | null, logType: LogType, eventType: string, message: string, request: Request, actor_id?: number) {
  const ip = process.env.NODE_ENV === "production" ? request.headers.get("x-forwarded-for") : "127.0.0.1";
  const userAgent = request.headers.get("user-agent");

  const databaseClient = client || (await pool.connect());

  try {
    const result = await databaseClient.query("INSERT INTO log (level, event_type, message, ip, user_agent, actor_person_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING log_id", [
      logType,
      eventType,
      message,
      ip,
      userAgent,
      actor_id,
    ]);

    return result.rows[0].log_id;
  } finally {
    if (!client) {
      databaseClient.release();
    }
  }
}

/**
 * Function used to log a general activity to the databse which isn't directly linked to a specific user.
 *
 * @param client A database client from the connection pool, used for transactions. Null if the function should manage its own connection.
 * @param logType The type of log entry (e.g., INFO, ERROR, DEBUG).
 * @param eventType An identifier for the specific event such as "SYSTEM_STARTUP", "SCHEDULED_TASK", etc.
 * @param message The message with details about the event being logged.
 * @return The ID of the newly created log entry in the database.
 * @throws Will throw an error if the query fails.
 */
export async function logGeneralActivity(client: PoolClient | null, logType: LogType, eventType: string, message: string) {
  const databaseClient = client || (await pool.connect());
  try {
    const result = await databaseClient.query("INSERT INTO log (level, event_type, message) VALUES ($1, $2, $3) RETURNING log_id", [logType, eventType, message]);
    return result.rows[0].log_id;
  } finally {
    if (!client) {
      databaseClient.release();
    }
  }
}
