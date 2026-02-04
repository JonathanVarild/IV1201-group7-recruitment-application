/**
 * Custom error to indciate that the provided credentials are invalid.
 */
export class InvalidCredentialsError extends Error {
  constructor() {
    super("The provided credentials are invalid.");
    this.name = "InvalidCredentialsError";
  }
}

/**
 * Custom error to indicate that session is invalid or has expired.
 */
export class InvalidSessionError extends Error {
  constructor() {
    super("The session is invalid or has expired.");
    this.name = "InvalidSessionError";
  }
}
