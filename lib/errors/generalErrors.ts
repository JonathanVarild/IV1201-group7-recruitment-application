/**
 * Custom error to indicate that the form data provided is invalid.
 */
export class InvalidFormDataError extends Error {
  constructor() {
    super("The provided form data is invalid.");
    this.name = "InvalidFormDataError";
  }
}
