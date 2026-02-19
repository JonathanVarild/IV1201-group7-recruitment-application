export type Competence = {
  id: number;
  name: string;
};

export type UserCompetence = Competence & {
  yearsOfExperience: number;
  competenceProfileID: number;
};
