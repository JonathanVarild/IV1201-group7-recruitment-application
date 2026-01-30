import { describe, expect, it } from "vitest";
import { exampleSchema } from "../../lib/schemas/dto_example";

describe("exampleDTO", () => {
  it("accepts a valid email", () => {
    const parsed = exampleSchema.parse({ email: "user@example.com" });
    expect(parsed).toEqual({ email: "user@example.com" });
  });

  it("rejects an invalid email", () => {
    expect(() => exampleSchema.parse({ email: "invalid-email" })).toThrow();
  });
});
