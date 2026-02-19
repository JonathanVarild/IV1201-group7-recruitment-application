import { z } from "zod";

/**
 * DTO for updating user profile data.
 * Ensures each field meets validation rules when provided.
 */
export const updateUserSchema = z.object({
  email: z.email("Invalid email address").optional().or(z.literal("")),
  pnr: z
    .string()
    .regex(/^(19|20)[0-9]{6}-[0-9]{4}$/, "Personal number must be in the format YYYYMMDD-XXXX")
    .optional()
    .or(z.literal("")),
  password: z.string().min(8, "Password must be at least 8 characters long").optional().or(z.literal("")),
  username: z.string().min(3, "Username must be at least 3 characters long").optional().or(z.literal("")),
});

export type ProfileDTO = z.infer<typeof updateUserSchema>;
