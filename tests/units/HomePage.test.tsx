import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import Home from "../../app/[locale]/page";

vi.mock("next-intl/server", () => ({
  getTranslations: () => (key: string) => key,
  setRequestLocale: vi.fn(),
}));

const params = Promise.resolve({ locale: "en" });

describe("HomePage", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders the heading", async () => {
    render(await Home({ params }));
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
  });

  it("renders the subheading", async () => {
    render(await Home({ params }));
    expect(screen.getByText("subheading")).toBeInTheDocument();
  });

  it("renders a link to the apply page", async () => {
    render(await Home({ params }));
    const applyLink = screen.getByRole("link", { name: "applyButton" });
    expect(applyLink).toBeInTheDocument();
    expect(applyLink).toHaveAttribute("href", "/en/apply");
  });

  it("renders the background image", async () => {
    const { container } = render(await Home({ params }));
    const img = container.querySelector("img");
    expect(img).toHaveAttribute("src", "/roller-coaster-homepage.jpg");
  });

  it("uses the locale from params in link hrefs", async () => {
    const svParams = Promise.resolve({ locale: "sv" });
    render(await Home({ params: svParams }));
    expect(screen.getByRole("link", { name: "applyButton" })).toHaveAttribute("href", "/sv/apply");
  });

  it("calls setRequestLocale with the correct locale", async () => {
    const { setRequestLocale } = await import("next-intl/server");
    render(await Home({ params }));
    expect(setRequestLocale).toHaveBeenCalledWith("en");
  });

  it("renders a main element as the root", async () => {
    const { container } = render(await Home({ params }));
    expect(container.querySelector("main")).toBeInTheDocument();
  });

  it("heading text comes from translations", async () => {
    render(await Home({ params }));
    // The mock returns the key as the value, so the heading should contain "heading"
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("heading");
  });
});
