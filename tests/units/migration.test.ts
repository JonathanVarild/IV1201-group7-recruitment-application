import { generateRandomPassword, generateEmail, generatePersonalNumber, generateUsername } from "@/lib/migrationHelpers";
import { describe, it, expect } from "vitest";

describe("generateUsername", () => {
  it("generates a username by combining name, surname and person_id", () => {
    const name = "John";
    const surname = "Doe";
    const person_id = 123;
    const expectedUsername = "JohnDoe123";
    expect(generateUsername(name, surname, person_id)).toBe(expectedUsername);
  });
});

describe("generatePersonalNumber", () => {
  it("generates a personal number with zeros ending with person_id", () => {
    const person_id = 45;
    const expectedPersonalNumber = "20000000-0045";
    expect(generatePersonalNumber(person_id)).toBe(expectedPersonalNumber);
  });
});

describe("generateEmail", () => {
  it("generates an email with the username before @finnsinte.se", () => {
    const username = "JohnDoe123";
    const expectedEmail = "JohnDoe123@finnsinte.se";
    expect(generateEmail(username)).toBe(expectedEmail);
  });
});

describe("generateRandomPassword", () => {
  it("generates a hashed password using bcrypt with 10 rounds", () => {
    const hashedPassword = generateRandomPassword();
    expect(hashedPassword).toMatch(/^\$2[aby]\$10\$/);
  });
});
