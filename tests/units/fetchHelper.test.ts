import { describe, it, expect, vi, beforeEach } from "vitest";
import { managedFetch } from "../../lib/api";

beforeEach(() => {
  vi.resetAllMocks();
});

describe("handleFetch", () => {
  // Mock fetch for testing ok===false and JSON ok
  it("throws error for HTTP 404", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          statusText: "Not Found",
          json: () => Promise.resolve({ message: "Not Found" }),
        }),
      ),
    );

    await expect(managedFetch("https://example.com", {})).rejects.toThrow("Not Found");
  });

  // Mock fetch for testing ok===false and JSON is missing message
  it("throws error for HTTP 500", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
          json: () => Promise.resolve({}),
        }),
      ),
    );

    await expect(managedFetch("https://example.com", {})).rejects.toThrow("Internal Server Error");
  });

  // Mock fetch for testing ok===true and JSON fails
  it("throws error with no JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.reject(new Error("No JSON")),
        }),
      ),
    );

    await expect(managedFetch("https://example.com", {})).rejects.toThrow("Failed to parse JSON: No JSON");
  });

  // Mock fetch for testing ok===true and JSON ok
  it("returns json data for HTTP 200", async () => {
    const mockResponse = { message: "test" };

    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(mockResponse),
        }),
      ),
    );

    const data = await managedFetch("https://example.com", {});
    expect(data).toEqual(mockResponse);
  });
});
