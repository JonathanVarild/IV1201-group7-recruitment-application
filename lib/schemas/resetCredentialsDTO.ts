import { z } from "zod";

/**
 * DTO and validation for updating forgotten user credentials.
 */
export const resetCredentialsSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long").optional().or(z.literal("")),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter")
    .regex(/[0-9]/, "Password must contain at least one number")
    .optional()
    .or(z.literal("")),
});

export type ResetCredentialsDTO = z.infer<typeof resetCredentialsSchema>;
