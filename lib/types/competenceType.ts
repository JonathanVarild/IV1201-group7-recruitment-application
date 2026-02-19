/**
 * Type used to represent a competence object.
 */
export type Competence = {
  id: number;
  name: string;
};

/**
 * Type used to represent a specific competence object in a user's profile.
 */
export type UserCompetence = Competence & {
  yearsOfExperience: number;
  competenceProfileID: number;
};
