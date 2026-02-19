import { NewUserDTO, newUserSchema } from "@/lib/schemas/userDTO";
import { getDatabaseClient } from "@/lib/database";
import { InvalidFormDataError } from "@/lib/errors/generalErrors";
import { DatabaseError } from "pg";
import { ConflictingSignupDataError } from "@/lib/errors/signupErrors";
import bcrypt from "bcrypt";
import { CredentialsDTO, credentialsSchema } from "@/lib/schemas/loginDTO";
import { InvalidCredentialsError } from "@/lib/errors/authErrors";
import { UserData } from "@/lib/types/userType";
import { SessionData } from "@/lib/types/sessionType";
import { generateSession } from "@/lib/session";
import { ProfileDTO, updateUserSchema } from "@/lib/schemas/profileDTO";
import { LogType, logUserActivity } from "@/lib/logging";

/**
 * Registers a new user in database.
 * @param newUserData - The data of the new user to register.
 * @returns The ID of the newly created user.
 * @throws Will throw an error if validation fails or if the database insertion fails.
 */
export async function registerUser(newUserData: NewUserDTO, srcRequest: Request): Promise<{ userID: number; sessionData: SessionData }> {
  // Validate the incoming user data against the schema
  if (newUserSchema.safeParse(newUserData).success === false) {
    throw new InvalidFormDataError();
  }

  // Hash the user's password.
  const hash = bcrypt.hashSync(newUserData.password, 10);

  // Get a database client to perform queries.
  const databaseClient = await getDatabaseClient();

  try {
    // Start transaction.
    await databaseClient.query("BEGIN");

    // Insert the new user into the "person" table
    const userInsertResult = await databaseClient.query(
      `INSERT INTO person (name, surname, pnr, email, password_hash, username)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING person_id`,
      [newUserData.name, newUserData.surname, newUserData.pnr, newUserData.email, hash, newUserData.username],
    );

    // Get the newly created user ID.
    const userID = userInsertResult.rows[0].person_id;

    // Log to the database.
    await logUserActivity(databaseClient, LogType.INFO, "USER_SIGNUP", `New user (${newUserData.username}) has been created.`, srcRequest, userID);

    // Generate a new session for the user.
    const generatedSession = generateSession();

    // Insert the new session into the "session" table.
    const sessionInsertResult = await databaseClient.query(
      `INSERT INTO session (person_id, token_hash, expires_at)
     VALUES ($1, $2, $3) RETURNING session_id`,
      [userID, generatedSession.tokenHash, generatedSession.expiresAt],
    );

    // Commit.
    await databaseClient.query("COMMIT");

    // Prepare session data.
    const sessionData: SessionData = {
      id: sessionInsertResult.rows[0].session_id,
      personID: userID,
      token: generatedSession.token,
      expiresAt: generatedSession.expiresAt,
    };

    // Return the newly created user ID and session data
    return { userID, sessionData };
  } catch (error) {
    // Rollback transaction and release client.
    await databaseClient.query("ROLLBACK");

    // Check if we failed due to conflicting signup data and throw specific error, else throw the original error.
    if (error instanceof DatabaseError && error.code === "23505") {
      await logUserActivity(databaseClient, LogType.INFO, "USER_SIGNUP_CONFLICT", `Failed attempt to create user due to conflicting data.`, srcRequest);
      throw new ConflictingSignupDataError();
    } else throw error;
  } finally {
    databaseClient.release();
  }
}

/**
 * Authenticates a user with given username and password.
 * @param credentials - The user's login credentials.
 * @returns The authenticated user's data and session data.
 * @throws Will throw an error if authentication fails for any reason.
 */
export async function authenticateUser(credentials: CredentialsDTO, srcRequest: Request): Promise<{ userData: UserData; sessionData: SessionData }> {
  // Validate the incoming credentials against the schema
  if (credentialsSchema.safeParse(credentials).success === false) {
    throw new InvalidFormDataError();
  }

  // Get a database client from the connection pool.
  const databaseClient = await getDatabaseClient();

  try {
    // Start transaction.
    await databaseClient.query("BEGIN");

    // Query the user by username
    const userQueryResult = await databaseClient.query(
      `SELECT 
    p.person_id,
    p.password_hash,
    p.username,
    p.email,
    p.pnr,
    p.role_id ,
    r.name AS role_name
  FROM person p
  JOIN role r ON p.role_id = r.role_id
  WHERE p.username = $1`,
      [credentials.username],
    );

    // If no user found, throw error.
    if (userQueryResult.rows.length === 0) {
      throw new InvalidCredentialsError();
    }

    // If no user found, throw error.
    if (userQueryResult.rows.length === 0) {
      await logUserActivity(databaseClient, LogType.INFO, "USER_LOGIN_FAILED", `Client failed to authenticate with username (${credentials.username}).`, srcRequest);
      throw new InvalidCredentialsError();
    }

    // Get the user data.
    const user = userQueryResult.rows[0];

    // Validate the password.
    const successfulLogin = await bcrypt.compare(credentials.password, user.password_hash);

    // Check if we were successful.
    if (!successfulLogin) {
      await logUserActivity(
        databaseClient,
        LogType.INFO,
        "USER_LOGIN_FAILED",
        `Client failed to authenticate with username (${credentials.username}).`,
        srcRequest,
        user.person_id,
      );
      throw new InvalidCredentialsError();
    }

    // Prepare user data to return
    const userData: UserData = {
      id: user.person_id,
      username: user.username,
      roleID: Number(user.role_id),
      role: user.role_name,
    };

    // Generate a new session for the user.
    const generatedSession = generateSession();

    // Start a new transaction.
    await databaseClient.query("BEGIN");

    // Log the login attempt.
    await logUserActivity(
      databaseClient,
      LogType.INFO,
      "USER_LOGIN_SUCCESS",
      `Client successfully authenticated with username (${credentials.username}).`,
      srcRequest,
      userQueryResult.rows[0].person_id,
    );

    // Insert the new session into the "session" table.
    const sessionInsertResult = await databaseClient.query(
      `INSERT INTO session (person_id, token_hash, expires_at)
     VALUES ($1, $2, $3) RETURNING session_id`,
      [userData.id, generatedSession.tokenHash, generatedSession.expiresAt],
    );

    // Commit transaction.
    await databaseClient.query("COMMIT");

    // Prepare session data.
    const sessionData: SessionData = {
      id: sessionInsertResult.rows[0].session_id,
      personID: userData.id,
      token: generatedSession.token,
      expiresAt: generatedSession.expiresAt,
    };

    // Return the authenticated user data.
    return { userData, sessionData };
  } catch (e) {
    await databaseClient.query("ROLLBACK");
    throw e;
  } finally {
    databaseClient.release();
  }
}

/**
 * Updates the user in the database based on what has been entered in profile page fields.
 *
 * @param userID - the id of the current user.
 * @param profileData - the new data entered into profile form.
 */
export async function updateUserProfile(userID: number, profileData: Partial<ProfileDTO>): Promise<void> {
  if (updateUserSchema.safeParse(profileData).success === false) {
    throw new InvalidFormDataError();
  }

  const databaseClient = await getDatabaseClient();

  try {
    // Start transaction.
    await databaseClient.query("BEGIN");

    // Determine which values to update
    const valuesToUpdate: string[] = [];
    const newValues: string[] = [];
    let index = 1;

    // If username has been changed
    if (profileData.username) {
      valuesToUpdate.push(`username = $${index}`);
      newValues.push(profileData.username);
      index++;
    }

    // If email has been changed
    if (profileData.email) {
      valuesToUpdate.push(`email = $${index}`);
      newValues.push(profileData.email);
      index++;
    }

    // If personal number has been changed
    if (profileData.pnr) {
      valuesToUpdate.push(`pnr = $${index}`);
      newValues.push(profileData.pnr);
      index++;
    }

    // If password has been changed
    if (profileData.password) {
      const newHash = bcrypt.hashSync(profileData.password, 10);
      valuesToUpdate.push(`password_hash = $${index}`);
      newValues.push(newHash);
      index++;
    }

    const query = `UPDATE person SET ${valuesToUpdate.join(", ")} WHERE person_id = ${userID}`;

    await databaseClient.query(query, newValues);

    await databaseClient.query("COMMIT");
    databaseClient.release();
  } catch (error) {
    await databaseClient.query("ROLLBACK");
    databaseClient.release();

    if (error instanceof DatabaseError && error.code === "23505") throw new ConflictingSignupDataError();
    else throw error;
  }
}
