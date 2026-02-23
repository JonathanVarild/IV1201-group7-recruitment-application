import { z } from "zod";

export const resetCredentialsSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters long").optional().or(z.literal("")),
  password: z.string().min(8, "Password must be at least 8 characters long").optional().or(z.literal("")),
});

export type ResetCredentialsDTO = z.infer<typeof resetCredentialsSchema>;
