import { describe, it, expect } from "vitest";
import {
  deleteCompetenceSchema,
  setCompetenceSchema,
  getCompetenceListSchema,
  addUserAvailabilitySchema,
  deleteAvailabilitySchema,
  setAvailabilitySchema,
} from "@/lib/schemas/applicationDTO";

describe("deleteCompetenceSchema", () => {
  describe("competenceProfileID", () => {
    it("accepts a number as competenceProfileID", () => {
      const result = deleteCompetenceSchema.parse({ competenceProfileID: 1 });
      expect(result.competenceProfileID).toBe(1);
    });

    it("rejects missing competenceProfileID", () => {
      const result = setCompetenceSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});

describe("setCompetenceSchema", () => {
  describe("competenceID", () => {
    it("accepts a number as competenceID", () => {
      const result = deleteCompetenceSchema.parse({ competenceProfileID: 1 });
      expect(result.competenceProfileID).toBe(1);
    });

    it("rejects missing competenceID", () => {
      const result = setCompetenceSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("yearsOfExperience", () => {
    it("accepts number bigger than 0", () => {
      const result = setCompetenceSchema.parse({ competenceID: 1, yearsOfExperience: 0.1 });
      expect(result.yearsOfExperience).toBe(0.1);
    });

    it("rejects negative number", () => {
      const result = setCompetenceSchema.safeParse({ competenceID: 1, yearsOfExperience: -0.1 });
      expect(result.success).toBe(false);
    });
  });
});

describe("getCompetenceListSchema", () => {
  describe("locale", () => {
    it("accepts string with 2 characters", () => {
      const result = getCompetenceListSchema.parse({ locale: "ab" });
      expect(result.locale).toBe("ab");
    });

    it("rejects string less than 2 characters", () => {
      const result = getCompetenceListSchema.safeParse({ locale: "a" });
      expect(result.success).toBe(false);
    });

    it("rejects string less more 2 characters", () => {
      const result = getCompetenceListSchema.safeParse({ locale: "abc" });
      expect(result.success).toBe(false);
    });
  });
});

describe("addUserAvailabilitySchema", () => {
  it("accepts valid date strings", () => {
    const result = addUserAvailabilitySchema.parse({ fromDate: "2000-01-01", toDate: "2000-12-12" });
    expect(result.fromDate).toBe("2000-01-01");
    expect(result.toDate).toBe("2000-12-12");
  });

  it("rejects missing fromDate", () => {
    const result = addUserAvailabilitySchema.safeParse({ toDate: "2000-12-12" });
    expect(result.success).toBe(false);
  });

  it("rejects missing toDate", () => {
    const result = addUserAvailabilitySchema.safeParse({ fromDate: "2000-01-01" });
    expect(result.success).toBe(false);
  });
});

describe("deleteAvailabilitySchema", () => {
  describe("availabilityID", () => {
    it("accepts a number as availabilityID", () => {
      const result = deleteAvailabilitySchema.parse({ availabilityID: 1 });
      expect(result.availabilityID).toBe(1);
    });

    it("rejects missing availabilityID", () => {
      const result = deleteAvailabilitySchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });
});

describe("setAvailabilitySchema", () => {
  const validInput = {
    availabilityID: 1,
    fromDate: "2000-01-01",
    toDate: "2000-12-12",
  };

  it("accepts valid input", () => {
    const result = setAvailabilitySchema.parse({ ...validInput });
    expect(result).toMatchObject({ ...validInput });
  });
});
