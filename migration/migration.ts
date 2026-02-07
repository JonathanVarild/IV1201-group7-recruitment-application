import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import bcrypt from "bcrypt";
import { getDatabaseClient } from "@/lib/database";
import { Client, PoolClient } from "pg";
import { generateRandomPassword, generateEmail, generatePersonalNumber, generateUsername } from "@/lib/migrationHelpers";
import { OldPersonType, OldCompetenceType, OldCompetenceProfileType, OldAvailabilityType, OldRoleType } from "@/lib/types/oldDatabaseTypes";

/**
 * Function to get a database client connected to the old database, hosted locally on docker.
 *
 * @returns a client connected to the old database.
 */
async function getLocalClient() {
  const client = new Client({
    user: "postgres",
    host: "localhost",
    database: "legacy_db",
    password: "postgres",
    port: 5432,
  });

  await client.connect();
  return client;
}

/**
 * Function to migrate competence data from the old database to the new database.
 *
 * @param localDatabaseClient - a client connected to the old database.
 * @param newDatabaseClient - a client connected to the new database.
 */
async function migrateCompetence(localDatabaseClient: Client, newDatabaseClient: PoolClient) {
  try {
    const { rows } = await localDatabaseClient.query<OldCompetenceType>("SELECT * FROM competence");

    for (const competence of rows) {
      await newDatabaseClient.query(
        `INSERT INTO competence (competence_id, name) 
                OVERRIDING SYSTEM VALUE
                VALUES ($1, $2)`,
        [competence.competence_id, competence.name],
      );
    }
  } catch (error) {
    // TODO: log error
  }
}

/**
 * Function to migrate competence profile data from the old database to the new database.
 *
 * @param localDatabaseClient - a client connected to the old database.
 * @param newDatabaseClient - a client connected to the new database.
 */
async function migrateCompetenceProfile(localDatabaseClient: Client, newDatabaseClient: PoolClient) {
  try {
    const { rows } = await localDatabaseClient.query<OldCompetenceProfileType>("SELECT * FROM competence_profile");

    for (const competence_profile of rows) {
      await newDatabaseClient.query(
        `INSERT INTO competence_profile (competence_profile_id, person_id, competence_id, years_of_experience) 
                OVERRIDING SYSTEM VALUE
                VALUES ($1, $2, $3, $4)`,
        [competence_profile.competence_profile_id, competence_profile.person_id, competence_profile.competence_id, competence_profile.years_of_experience],
      );
    }
  } catch (error) {
    // TODO: log error
  }
}

/**
 * Function to migrate availability data from the old database to the new database.
 *
 * @param localDatabaseClient - a client connected to the old database.
 * @param newDatabaseClient - a client connected to the new database.
 */
async function migrateAvailability(localDatabaseClient: Client, newDatabaseClient: PoolClient) {
  try {
    const { rows } = await localDatabaseClient.query<OldAvailabilityType>("SELECT * FROM availability");

    for (const availability of rows) {
      await newDatabaseClient.query(
        `INSERT INTO availability (availability_id, person_id, from_date, to_date) 
                OVERRIDING SYSTEM VALUE
                VALUES ($1, $2, $3, $4)`,
        [availability.availability_id, availability.person_id, availability.from_date, availability.to_date],
      );
    }
  } catch (error) {
    // TODO: log error
  }
}

/**
 * Function to migrate role data from the old database to the new database.
 *
 * @param localDatabaseClient - a client connected to the old database.
 * @param newDatabaseClient - a client connected to the new database.
 */
async function migrateRole(localDatabaseClient: Client, newDatabaseClient: PoolClient) {
  try {
    const { rows } = await localDatabaseClient.query<OldRoleType>("SELECT * FROM role");

    for (const role of rows) {
      console.log(`Migrating role: ${role.name} (ID: ${role.role_id})`); // Log the role being migrated
      await newDatabaseClient.query(
        `INSERT INTO role (role_id, name) 
                OVERRIDING SYSTEM VALUE
                VALUES ($1, $2)`,
        [role.role_id, role.name],
      );
    }
  } catch (error) {
    // TODO: log error
  }
}

/**
 * Function to migrate person data from the old database to the new database and handle null values by generating new ones.
 *
 * @param localDatabaseClient - a client connected to the old database.
 * @param newDatabaseClient - a client connected to the new database.
 */
async function migratePerson(localDatabaseClient: Client, newDatabaseClient: PoolClient) {
  try {
    const { rows } = await localDatabaseClient.query<OldPersonType>("SELECT * FROM person");

    for (const person of rows) {
      let personal_number: string;
      let password_hash: string;
      let username: string;
      let email: string;

      if (person.pnr === null) {
        personal_number = generatePersonalNumber(person.person_id);
      } else {
        personal_number = person.pnr;
      }
      if (person.password === null) {
        password_hash = generateRandomPassword();
      } else {
        password_hash = bcrypt.hashSync(person.password, 10);
      }
      if (person.username === null) {
        username = generateUsername(person.name, person.surname, person.person_id);
      } else {
        username = person.username;
      }
      if (person.email === null) {
        email = generateEmail(username);
      } else {
        email = person.email;
      }

      await newDatabaseClient.query(
        `INSERT INTO person (person_id, name, surname, pnr, email, password_hash, role_id,username)
                OVERRIDING SYSTEM VALUE
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [person.person_id, person.name, person.surname, personal_number, email, password_hash, person.role_id, username],
      );
    }
  } catch (error) {
    // TODO: log error
  }
}

async function migrate() {
  const localDatabaseClient = await getLocalClient();
  const newDatabaseClient = await getDatabaseClient();

  // Start Transaction
  await newDatabaseClient.query("BEGIN");

  try {
    // Migrate data for each table
    await migrateRole(localDatabaseClient, newDatabaseClient);
    await migratePerson(localDatabaseClient, newDatabaseClient);
    await migrateCompetence(localDatabaseClient, newDatabaseClient);
    await migrateCompetenceProfile(localDatabaseClient, newDatabaseClient);
    await migrateAvailability(localDatabaseClient, newDatabaseClient);

    // Commit and release clients
    await newDatabaseClient.query("COMMIT");

    newDatabaseClient.release();
    await localDatabaseClient.end();
  } catch (error) {
    // Rollback transaction and release clients
    await newDatabaseClient.query("ROLLBACK");
    newDatabaseClient.release();
    await localDatabaseClient.end();

    // TODO: log error
  }
}

migrate().catch((error) => {
  // TODO: log error
});
