export type OldPersonType = {
  person_id: number;
  name: string;
  surname: string;
  pnr: string | null;
  password: string | null;
  role_id: number;
  username: string | null;
  email: string | null;
};

export type OldCompetenceType = {
  competence_id: number;
  name: string;
};

export type OldCompetenceProfileType = {
  competence_profile_id: number;
  person_id: number;
  competence_id: number;
  years_of_experience: number;
};

export type OldAvailabilityType = {
  availability_id: number;
  person_id: number;
  from_date: Date;
  to_date: Date;
};

export type OldRoleType = {
  role_id: number;
  name: string;
};
