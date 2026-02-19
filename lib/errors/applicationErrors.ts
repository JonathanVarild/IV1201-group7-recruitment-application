/**
 * Custom error to indicate that the user already has an unhandled application.
 */
export class ConflictingApplicationError extends Error {
  translationKey: string;

  constructor() {
    super("The user already has an unhandled application.");
    this.name = "ConflictingApplicationError";
    this.translationKey = "conflictingApplicationError";
  }
}
