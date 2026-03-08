import { describe, it, expect } from "vitest";
import { updateUserSchema } from "@/lib/schemas/profileDTO";

describe("updateUserSchema", () => {
  describe("empty object", () => {
    it("accepts an empty object since all fields are optional", () => {
      expect(() => updateUserSchema.parse({})).not.toThrow();
    });
  });

  it("accepts a valid email", () => {
    const result = updateUserSchema.parse({ email: "user@example.com" });
    expect(result.email).toBe("user@example.com");
  });

  it("accepts an empty string for email", () => {
    const result = updateUserSchema.parse({ email: "" });
    expect(result.email).toBe("");
  });

  it("rejects an email without @", () => {
    const result = updateUserSchema.safeParse({ email: "notanemail" });
    expect(result.success).toBe(false);
  });

  it("rejects an email without domain", () => {
    const result = updateUserSchema.safeParse({ email: "user@" });
    expect(result.success).toBe(false);
  });
});

describe("pnr (personal number)", () => {
  it("accepts a valid pnr starting with 19", () => {
    const result = updateUserSchema.parse({ pnr: "19000000-0000" });
    expect(result.pnr).toBe("19000000-0000");
  });

  it("accepts a valid pnr starting with 20", () => {
    const result = updateUserSchema.parse({ pnr: "20000000-0000" });
    expect(result.pnr).toBe("20000000-0000");
  });

  it("rejects pnr starting with other than 19 or 20", () => {
    const result = updateUserSchema.safeParse({ pnr: "18000000-0000" });
    expect(result.success).toBe(false);
  });

  it("rejects pnr without dash", () => {
    const result = updateUserSchema.safeParse({ pnr: "190000000000" });
    expect(result.success).toBe(false);
  });

  it("rejects pnr with shorter length", () => {
    const result = updateUserSchema.safeParse({ pnr: "19000000-00" });
    expect(result.success).toBe(false);
  });

  it("rejects pnr with letters", () => {
    const result = updateUserSchema.safeParse({ pnr: "19000000-ABCD" });
    expect(result.success).toBe(false);
  });
});

describe("password", () => {
  it("accepts a valid password", () => {
    const result = updateUserSchema.parse({ password: "ABcd1234" });
    expect(result.password).toBe("ABcd1234");
  });

  it("accepts a password longer than 8 characters", () => {
    const result = updateUserSchema.parse({ password: "Verylongpassword123" });
    expect(result.password).toBe("Verylongpassword123");
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = updateUserSchema.safeParse({ password: "Short1" });
    expect(result.success).toBe(false);
  });

  it("rejects a password with only lowercase", () => {
    const result = updateUserSchema.safeParse({ password: "abcd1234" });
    expect(result.success).toBe(false);
  });

  it("rejects a password with only uppercase", () => {
    const result = updateUserSchema.safeParse({ password: "ABCD1234" });
    expect(result.success).toBe(false);
  });

  it("rejects a password with only numbers", () => {
    const result = updateUserSchema.safeParse({ password: "12345678" });
    expect(result.success).toBe(false);
  });

  it("rejects a password with only letters", () => {
    const result = updateUserSchema.safeParse({ password: "abcdEFGH" });
    expect(result.success).toBe(false);
  });
});

describe("username", () => {
  it("accepts a username with exactly 3 characters", () => {
    const result = updateUserSchema.parse({ username: "joh" });
    expect(result.username).toBe("joh");
  });

  it("accepts a username longer than 3 letters", () => {
    const result = updateUserSchema.parse({ username: "john" });
    expect(result.username).toBe("john");
  });

  it("rejects a username shorter than 3 letters", () => {
    const result = updateUserSchema.safeParse({ username: "jo" });
    expect(result.success).toBe(false);
  });
});

describe("multiple fields filled out", () => {
  it("accepts a fully valid object", () => {
    const result = updateUserSchema.parse({
      email: "user@example.com",
      pnr: "19901231-1234",
      password: "Validpassword1",
      username: "johndoe",
    });
    expect(result).toMatchObject({
      email: "user@example.com",
      pnr: "19901231-1234",
      password: "Validpassword1",
      username: "johndoe",
    });
  });

  it("fails if one field is invalid even if others are valid", () => {
    const result = updateUserSchema.safeParse({
      email: "user@example.com",
      pnr: "INVALID",
      password: "Validpassword1",
      username: "johndoe",
    });
    expect(result.success).toBe(false);
  });
});
