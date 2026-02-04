export type GeneratedSession = {
  token: string;
  tokenHash: string;
  expiresAt: Date;
};

export type SessionData = {
  id: number;
  personID: number;
  token: string;
  expiresAt: Date;
};
