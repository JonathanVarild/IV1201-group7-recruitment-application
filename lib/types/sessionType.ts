/**
 * Type used to represent a generated session object.
 */
export type GeneratedSession = {
  token: string;
  tokenHash: string;
  expiresAt: Date;
};

/**
 * Type used to represent a session object that can be shared with the client.
 */
export type SessionData = {
  id: number;
  personID: number;
  token: string;
  expiresAt: Date;
};
