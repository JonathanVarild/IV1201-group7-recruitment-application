/**
 * Custom error to indicate that the provided reset token is invalid or has expired.
 */
export class InvalidResetTokenError extends Error {
  translationKey: string;

  constructor() {
    super("The provided reset token is invalid or has expired.");
    this.name = "InvalidResetTokenError";
    this.translationKey = "invalidResetTokenError";
  }
}
