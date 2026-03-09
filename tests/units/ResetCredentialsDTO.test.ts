import { describe, it, expect } from "vitest";
import { resetCredentialsSchema } from "@/lib/schemas/resetCredentialsDTO";

describe("resetCredentialsSchema", () => {
  describe("empty object", () => {
    it("accepts an empty object since all fields are optional", () => {
      expect(() => resetCredentialsSchema.parse({})).not.toThrow();
    });
  });
  describe("username", () => {
    it("accepts a username with exactly 3 characters", () => {
      const result = resetCredentialsSchema.parse({ username: "abc" });
      expect(result.username).toBe("abc");
    });

    it("accepts a username longer than 3 characters", () => {
      const result = resetCredentialsSchema.parse({ username: "johndoe" });
      expect(result.username).toBe("johndoe");
    });

    it("rejects a username shorter than 3 characters", () => {
      const result = resetCredentialsSchema.safeParse({ username: "ab" });
      expect(result.success).toBe(false);
    });
  });

  describe("password", () => {
    it("accepts a valid password", () => {
      const result = resetCredentialsSchema.parse({ password: "ABcd1234" });
      expect(result.password).toBe("ABcd1234");
    });

    it("accepts a password longer than 8 characters", () => {
      const result = resetCredentialsSchema.parse({ password: "Verylongpassword123" });
      expect(result.password).toBe("Verylongpassword123");
    });

    it("rejects a password shorter than 8 characters", () => {
      const result = resetCredentialsSchema.safeParse({ password: "short" });
      expect(result.success).toBe(false);
    });

    it("rejects a password with only lowercase", () => {
      const result = resetCredentialsSchema.safeParse({ password: "abcd1234" });
      expect(result.success).toBe(false);
    });

    it("rejects a password with only uppercase", () => {
      const result = resetCredentialsSchema.safeParse({ password: "ABCD1234" });
      expect(result.success).toBe(false);
    });

    it("rejects a password with only numbers", () => {
      const result = resetCredentialsSchema.safeParse({ password: "12345678" });
      expect(result.success).toBe(false);
    });

    it("rejects a password with only letters", () => {
      const result = resetCredentialsSchema.safeParse({ password: "abcdEFGH" });
      expect(result.success).toBe(false);
    });
  });
});
