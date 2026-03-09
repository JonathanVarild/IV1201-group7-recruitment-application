import { describe, it, expect } from "vitest";
import { generateRandomPassword, generateUsername, generatePersonalNumber, generateEmail } from "@/lib/migrationHelpers";

describe("generateRandomPassword", () => {
  it("returns a bcrypt hash (starts with $2b$)", () => {
    const result = generateRandomPassword();
    expect(result).toMatch(/^\$2b\$/);
  });

  it("returns a different hash each time", () => {
    const first = generateRandomPassword();
    const second = generateRandomPassword();
    expect(first).not.toBe(second);
  });
});

describe("generateUsername", () => {
  it("returns a username = name + surname + id", () => {
    const result = generateUsername("John", "Doe", 3);
    expect(result).toBe("JohnDoe3");
  });
});

describe("generatePersonalNumber", () => {
  it("returns a pnr with padded id", () => {
    const result = generatePersonalNumber(3);
    expect(result).toBe("20000000-0003");
  });

  it("returns a pnr without padding if id is 4 digits", () => {
    const result = generatePersonalNumber(1234);
    expect(result).toBe("20000000-1234");
  });
});

describe("generateEmail", () => {
  it("returns email with the format username@finnsinte.se", () => {
    const result = generateEmail("JohnDoe3");
    expect(result).toBe("JohnDoe3@finnsinte.se");
  });
});
