import { describe, it, expect } from "vitest";
import { getDateFnsLocale, locales } from "@/lib/dateLocales";

describe("getDateFnsLocale", () => {
  it("returns exact match for existing locale with 2 digits", () => {
    const result = getDateFnsLocale("sv");
    expect(result).toBe(locales.sv);
  });

  it("return language part if given tag", () => {
    const result = getDateFnsLocale("sv-SE");
    expect(result).toBe(locales.sv);
  });

  it("returns enUS if given unknown locale", () => {
    const result = getDateFnsLocale("xx");
    expect(result).toBe(locales.enUS);
  });
});
