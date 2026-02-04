/**
 * Custom error to indicate that there is conflicting user data during signup.
 */
export class ConflictingSignupDataError extends Error {
  constructor() {
    super("A user with the provided details already exists.");
    this.name = "ConflictingSignupDataError";
  }
}
