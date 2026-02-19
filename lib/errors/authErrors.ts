/**
 * Custom error to indciate that the provided credentials are invalid.
 */
export class InvalidCredentialsError extends Error {
  translationKey: string;

  constructor() {
    super("The provided credentials are invalid.");
    this.name = "InvalidCredentialsError";
    this.translationKey = "invalidCredentialsError";
  }
}

/**
 * Custom error to indicate that session is invalid or has expired.
 */
export class InvalidSessionError extends Error {
  translationKey: string;

  constructor() {
    super("The session is invalid or has expired.");
    this.name = "InvalidSessionError";
    this.translationKey = "invalidSessionError";
  }
}
