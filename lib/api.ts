/**
 * Helper function to handle HTTP responses.
 *
 * @template T - allows for generic data with safety.
 * @param response - the response from fetch.
 * @returns the parsed JSON data from the response as a promise.
 * @throws Error if the response status is not ok.
 */
export async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: "HTTP error " + response.status + ": " + response.statusText }));
    throw new Error(errorData.message || "HTTP error " + response.status + ": " + response.statusText);
  }
  return response.json();
}
