import { describe, it, expect } from "vitest";
import { managedFetch } from "../../lib/api";

describe("handleResponse", () => {
  it("throws error for HTTP 404", async () => {
    await expect(managedFetch("https://httpbin.org/status/404")).rejects.toThrow("HTTP error 404");
  });

  it("throws error for HTTP 500", async () => {
    await expect(managedFetch("https://httpbin.org/status/500")).rejects.toThrow("HTTP error 500");
  });

  it("throws error with no JSON", async () => {
    await expect(managedFetch("https://httpbin.org/status/204")).rejects.toThrow("Unexpected end of JSON input");
  });

  it("returns json data for HTTP 200", async () => {
    const data = await managedFetch("https://httpbin.org/json");

    expect(data).toBeDefined();
    expect((data as { slideshow: unknown }).slideshow).toBeDefined();
  });
});
