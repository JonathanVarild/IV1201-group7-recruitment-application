import { z } from "zod";

export const exampleSchema = z.object({
  email: z.email(),
});

export type ExampleDTO = z.infer<typeof exampleSchema>;
