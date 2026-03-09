import { describe, it, expect } from "vitest";
import { newUserSchema, registerFormSchema } from "@/lib/schemas/userDTO";

const validUser = {
  name: "John",
  surname: "Doe",
  pnr: "19901231-1234",
  email: "john@example.com",
  password: "Password123",
  username: "johndoe",
};

describe("newUserSchema", () => {
  describe("valid input", () => {
    it("accepts a fully valid user object", () => {
      const result = newUserSchema.parse(validUser);
      expect(result).toMatchObject(validUser);
    });
  });

  describe("name", () => {
    it("accepts a name with more than 2 letters", () => {
      const result = newUserSchema.parse({ ...validUser, name: "John" });
      expect(result.name).toBe("John");
    });

    it("accepts a name with exactly 2 letters", () => {
      const result = newUserSchema.parse({ ...validUser, name: "Jo" });
      expect(result.name).toBe("Jo");
    });

    it("rejects a name with 1 letter", () => {
      const result = newUserSchema.safeParse({ ...validUser, name: "J" });
      expect(result.success).toBe(false);
    });

    it("rejects a missing name", () => {
      const { name, ...noName } = validUser;
      const result = newUserSchema.safeParse({ ...noName });
      expect(result.success).toBe(false);
    });
  });

  describe("surname", () => {
    it("accepts a surname with more than 2 letters", () => {
      const result = newUserSchema.parse({ ...validUser, name: "John" });
      expect(result.name).toBe("John");
    });

    it("accepts a surname with exactly 2 letters", () => {
      const result = newUserSchema.parse({ ...validUser, surname: "Do" });
      expect(result.surname).toBe("Do");
    });

    it("rejects a surname with 1 letters", () => {
      const result = newUserSchema.safeParse({ ...validUser, surname: "D" });
      expect(result.success).toBe(false);
    });

    it("rejects a missing surname", () => {
      const { surname, ...noSurname } = validUser;
      const result = newUserSchema.safeParse({ ...noSurname });
      expect(result.success).toBe(false);
    });
  });

  describe("pnr", () => {
    it("accepts a valid pnr starting with 19", () => {
      const result = newUserSchema.parse({ ...validUser, pnr: "19000000-0000" });
      expect(result.pnr).toBe("19000000-0000");
    });

    it("accepts a valid pnr starting with 20", () => {
      const result = newUserSchema.parse({ ...validUser, pnr: "20000000-0000" });
      expect(result.pnr).toBe("20000000-0000");
    });

    it("rejects a pnr starting with 18", () => {
      const result = newUserSchema.safeParse({ ...validUser, pnr: "18000000-0000" });
      expect(result.success).toBe(false);
    });

    it("rejects a pnr without dash", () => {
      const result = newUserSchema.safeParse({ ...validUser, pnr: "190000000000" });
      expect(result.success).toBe(false);
    });

    it("rejects a pnr with the wrong length", () => {
      const result = newUserSchema.safeParse({ ...validUser, pnr: "19000000-00" });
      expect(result.success).toBe(false);
    });

    it("rejects a pnr with letters", () => {
      const result = newUserSchema.safeParse({ ...validUser, pnr: "19000000-ABCD" });
      expect(result.success).toBe(false);
    });

    it("rejects a missing pnr", () => {
      const { pnr, ...noPnr } = validUser;
      const result = newUserSchema.safeParse({ ...noPnr });
      expect(result.success).toBe(false);
    });
  });

  describe("email", () => {
    it("accepts a valid email", () => {
      const result = newUserSchema.parse({ ...validUser, email: "user@example.com" });
      expect(result.email).toBe("user@example.com");
    });

    it("rejects an email without @", () => {
      const result = newUserSchema.safeParse({ ...validUser, email: "notanemail" });
      expect(result.success).toBe(false);
    });

    it("rejects an email without domain", () => {
      const result = newUserSchema.safeParse({ ...validUser, email: "user@" });
      expect(result.success).toBe(false);
    });

    it("rejects a missing email", () => {
      const { email, ...noEmail } = validUser;
      const result = newUserSchema.safeParse({ ...noEmail });
      expect(result.success).toBe(false);
    });
  });

  describe("password", () => {
    it("accepts a valid password", () => {
      const result = newUserSchema.parse({ ...validUser, password: "ABcd1234" });
      expect(result.password).toBe("ABcd1234");
    });

    it("accepts a password longer than 8 characters", () => {
      const result = newUserSchema.parse({ ...validUser, password: "Verylongpassword123" });
      expect(result.password).toBe("Verylongpassword123");
    });

    it("rejects a password shorter than 8 characters", () => {
      const result = newUserSchema.safeParse({ ...validUser, password: "Short1" });
      expect(result.success).toBe(false);
    });

    it("rejects a password with only lowercase", () => {
      const result = newUserSchema.safeParse({ ...validUser, password: "abcd1234" });
      expect(result.success).toBe(false);
    });

    it("rejects a password with only uppercase", () => {
      const result = newUserSchema.safeParse({ ...validUser, password: "ABCD1234" });
      expect(result.success).toBe(false);
    });

    it("rejects a password with only numbers", () => {
      const result = newUserSchema.safeParse({ ...validUser, password: "12345678" });
      expect(result.success).toBe(false);
    });

    it("rejects a password with only letters", () => {
      const result = newUserSchema.safeParse({ ...validUser, password: "abcdEFGH" });
      expect(result.success).toBe(false);
    });

    it("rejects a missing password", () => {
      const { password, ...noPassword } = validUser;
      const result = newUserSchema.safeParse({ ...noPassword });
      expect(result.success).toBe(false);
    });
  });

  describe("username", () => {
    it("accepts a username with exactly 3 letters", () => {
      const result = newUserSchema.parse({ ...validUser, username: "joh" });
      expect(result.username).toBe("joh");
    });

    it("accepts a username with more than 3 letters", () => {
      const result = newUserSchema.parse({ ...validUser, username: "john" });
      expect(result.username).toBe("john");
    });

    it("rejects a username with less than 2 letters", () => {
      const result = newUserSchema.safeParse({ ...validUser, username: "ab" });
      expect(result.success).toBe(false);
    });

    it("rejects a missing username", () => {
      const { username, ...rest } = validUser;
      const result = newUserSchema.safeParse(rest);
      expect(result.success).toBe(false);
    });
  });
});

describe("registerFormSchema", () => {
  const validForm = { ...validUser, confirmPassword: validUser.password };

  it("accepts a valid form with matching passwords", () => {
    const result = registerFormSchema.parse(validForm);
    expect(result).toMatchObject(validForm);
  });

  it("rejects when confirmPassword does not match password", () => {
    const result = registerFormSchema.safeParse({
      ...validForm,
      confirmPassword: "WrongPassword123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects when confirmPassword is missing", () => {
    const { confirmPassword, ...noConfirmPassword } = validForm;
    const result = registerFormSchema.safeParse({ ...noConfirmPassword });
    expect(result.success).toBe(false);
  });
});
