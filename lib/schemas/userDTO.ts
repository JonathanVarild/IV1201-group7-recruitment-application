import { z } from "zod";

export const newUserSchema = z.object({
  name: z.string().min(1, "Name is required"),
  surname: z.string().min(1, "Surname is required"),
  pnr: z.string().regex(/^(19|20)[0-9]{6}-[0-9]{4}$/, "Personal number must be in the format YYYYMMDD-XXXX"),
  email: z.email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  username: z.string().min(3, "Username must be at least 3 characters long"),
});

export type NewUserDTO = z.infer<typeof newUserSchema>;
