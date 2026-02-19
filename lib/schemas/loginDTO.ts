import { z } from "zod";

/**
 * Validation schema and DTO for user credentials used in login and signup.
 */
export const credentialsSchema = z.object({
  username: z.string(),
  password: z.string(),
});
export type CredentialsDTO = z.infer<typeof credentialsSchema>;
