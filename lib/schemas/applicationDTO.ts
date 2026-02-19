import { z } from "zod";

export const deleteCompetenceSchema = z.object({
  competenceProfileID: z.number(),
});

export type DeleteCompetenceDTO = z.infer<typeof deleteCompetenceSchema>;

export const setCompetenceSchema = z.object({
  competenceID: z.number(),
  yearsOfExperience: z.number().min(0),
});

export type SetCompetenceDTO = z.infer<typeof setCompetenceSchema>;

export const getCompetenceListSchema = z.object({
  locale: z.string().length(2),
});

export type GetCompetenceListDTO = z.infer<typeof getCompetenceListSchema>;

export const addUserAvailabilitySchema = z.object({
  fromDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format for fromDate.",
  }),
  toDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format for toDate.",
  }),
});

export type AddUserAvailabilityDTO = z.infer<typeof addUserAvailabilitySchema>;

export const deleteAvailabilitySchema = z.object({
  availabilityID: z.number(),
});

export type DeleteAvailabilityDTO = z.infer<typeof deleteAvailabilitySchema>;

export const setAvailabilitySchema = z.object({
  availabilityID: z.number(),
  fromDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format for fromDate.",
  }),
  toDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format for toDate.",
  }),
});

export type SetAvailabilityDTO = z.infer<typeof setAvailabilitySchema>;
