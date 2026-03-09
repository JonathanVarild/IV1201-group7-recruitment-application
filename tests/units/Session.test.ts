import { describe, it, expect, beforeEach } from "vitest";
import { generateSession } from "@/lib/session";

describe("generateSession", () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = "test-secret";
  });

  it("returns a token, tokenHash and expiresAt", () => {
    const session = generateSession();
    expect(session).toHaveProperty("token");
    expect(session).toHaveProperty("tokenHash");
    expect(session).toHaveProperty("expiresAt");
  });

  it("token and tokenHash are different values", () => {
    const { token, tokenHash } = generateSession();
    expect(token).not.toBe(tokenHash);
  });
});
