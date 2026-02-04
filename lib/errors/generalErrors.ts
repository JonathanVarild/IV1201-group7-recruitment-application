/**
 * Custom error to indicate that the form data provided is invalid.
 */
export class InvalidFormDataError extends Error {
  constructor() {
    super("The provided form data is invalid.");
    this.name = "InvalidFormDataError";
  }
}

/**
 * Custom error to represent API-related errors.
 */
export class APIError extends Error {
  statusCode: number;
  response: Response;
  jsonData: unknown;

  constructor(statusCode: number, response: Response, jsonData: unknown) {
    super(`API Error: ${statusCode}`);
    this.name = "APIError";
    this.statusCode = statusCode;
    this.response = response;
    this.jsonData = jsonData;
  }
}
