import { z } from "zod";

// Type for the validation messages or translation keys used for the validation schemas.
type UserValidationMessages = {
  nameMin: string;
  surnameMin: string;
  pnrInvalid: string;
  emailInvalid: string;
  passwordMin: string;
  passwordUppercase: string;
  passwordLowercase: string;
  passwordNumber: string;
  usernameMin: string;
};

// Function to create the schema with the provided validation messages.
const createUserSchema = (messages: UserValidationMessages) => ({
  name: z.string().min(2, messages.nameMin),
  surname: z.string().min(2, messages.surnameMin),
  pnr: z.string().regex(/^(19|20)[0-9]{6}-[0-9]{4}$/, messages.pnrInvalid),
  email: z.email(messages.emailInvalid),
  password: z.string().min(8, messages.passwordMin).regex(/[A-Z]/, messages.passwordUppercase).regex(/[a-z]/, messages.passwordLowercase).regex(/[0-9]/, messages.passwordNumber),
  username: z.string().min(3, messages.usernameMin),
});

// Validation messages for server-side validation with hardcoded English strings.
const serverValidationMessages: UserValidationMessages = {
  nameMin: "First name must be at least 2 characters long",
  surnameMin: "Last name must be at least 2 characters long",
  pnrInvalid: "Personal number must be in the format YYYYMMDD-XXXX and start with 19 or 20",
  emailInvalid: "Invalid email address",
  passwordMin: "Password must be at least 8 characters long",
  passwordUppercase: "Password must contain at least one uppercase letter",
  passwordLowercase: "Password must contain at least one lowercase letter",
  passwordNumber: "Password must contain at least one number",
  usernameMin: "Username must be at least 3 characters long",
};

// Validation messages for client-side validation using translation keys.
const clientValidationMessages: UserValidationMessages = {
  nameMin: "validation.firstNameMin",
  surnameMin: "validation.lastNameMin",
  pnrInvalid: "validation.personalNumberInvalid",
  emailInvalid: "validation.emailInvalid",
  passwordMin: "validation.passwordMin",
  passwordUppercase: "validation.passwordUppercase",
  passwordLowercase: "validation.passwordLowercase",
  passwordNumber: "validation.passwordNumber",
  usernameMin: "validation.usernameMin",
};

/**
 * Validation schema and DTO for registering a new user.
 */
export const newUserSchema = z.object(createUserSchema(serverValidationMessages));
export type NewUserDTO = z.infer<typeof newUserSchema>;

/**
 * Validation schema for the registration form, with an extra confirmPassword field to ensure the passwords match.
 */
export const registerFormSchema = z
  .object({
    ...createUserSchema(clientValidationMessages),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "validation.passwordsMismatch",
    path: ["confirmPassword"],
  });

export type RegisterFormData = z.infer<typeof registerFormSchema>;
