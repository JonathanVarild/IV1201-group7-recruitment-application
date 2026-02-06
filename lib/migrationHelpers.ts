import bcrypt from "bcrypt";
import { randomBytes } from "crypto";

/**
 * Function to generate a random password and hash it.
 *
 * @returns a hashed password as a string.
 */
export function generateRandomPassword(): string {
  const password = randomBytes(14).toString("hex");
  return bcrypt.hashSync(password, 10);
}

/**
 * Function to generate a username based on the person's name, surname and personID.
 *
 * @param name - first name of the person in the old database.
 * @param surname - last name of the person in the old database.
 * @param person_id - unique identifier of the person in the old database.
 * @returns the generated username as a string.
 */
export function generateUsername(name: string, surname: string, person_id: number): string {
  return `${name}${surname}${person_id}`;
}

/**
 * Function to generate a personal number with zeros that ends with the person_id.
 *
 * @param person_id - unique identifier of the person in the old database.
 * @returns the generated personal number as a string.
 */
export function generatePersonalNumber(person_id: number): string {
  const base = "00000000-";
  const secondPart = person_id.toString().padStart(4, "0");
  return `${base}${secondPart}`;
}

/**
 * Function to generate an email based on the username ending in a standard made up domain.
 *
 * @param username - username of the person, either generated or from the old database.
 * @returns a generated email address as a string.
 */
export function generateEmail(username: string): string {
  return `${username}@finnsinte.se`;
}
