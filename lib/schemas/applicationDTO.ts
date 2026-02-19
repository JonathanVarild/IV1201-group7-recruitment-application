import { z } from "zod";

/**
 * Validation schema and DTO for deleting a competence from a users' profile.
 */
export const deleteCompetenceSchema = z.object({
  competenceProfileID: z.number(),
});
export type DeleteCompetenceDTO = z.infer<typeof deleteCompetenceSchema>;

/**
 * Validation schema and DTO for setting a competence in a users' profile.
 */
export const setCompetenceSchema = z.object({
  competenceID: z.number(),
  yearsOfExperience: z.number().min(0),
});
export type SetCompetenceDTO = z.infer<typeof setCompetenceSchema>;

/**
 * Validation schema and DTO for getting the competence list for a specific locale.
 */
export const getCompetenceListSchema = z.object({
  locale: z.string().length(2),
});
export type GetCompetenceListDTO = z.infer<typeof getCompetenceListSchema>;

/**
 * Validation schema and DTO for adding an availability to a users' profile.
 */
export const addUserAvailabilitySchema = z.object({
  fromDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format for fromDate.",
  }),
  toDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format for toDate.",
  }),
});
export type AddUserAvailabilityDTO = z.infer<typeof addUserAvailabilitySchema>;

/**
 * Validation schema and DTO for deleting an availability from a users' profile.
 */
export const deleteAvailabilitySchema = z.object({
  availabilityID: z.number(),
});
export type DeleteAvailabilityDTO = z.infer<typeof deleteAvailabilitySchema>;

/**
 * Validation schema and DTO for updating an availability in a users' profile.
 */
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
