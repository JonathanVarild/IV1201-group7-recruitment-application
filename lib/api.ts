import { APIError } from "./errors/generalErrors";

/**
 * Helper function to perform a fetch request and handle the response.
 *
 * @template T - allows for generic data with safety.
 * @param url - the URL to fetch.
 * @param options - options for the fetch.
 * @returns the data from the response as a promise.
 */
export async function managedFetch<T>(url: string, options: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  return handleResponse<T>(response);
}

/**
 * Helper function to handle HTTP responses.
 *
 * @template T - allows for generic data with safety.
 * @param response - the response from fetch.
 * @returns the parsed JSON data from the response as a promise.
 * @throws Error if the response status is not ok, or if JSON parsing fails.
 */
export async function handleResponse<T>(response: Response): Promise<T> {
  const jsonData = await response.json().catch((error) => {
    throw new Error("Failed to parse JSON: " + error.message);
  });

  if (!response.ok) {
    throw new APIError(response.status, response, jsonData);
  }
  return jsonData;
}
