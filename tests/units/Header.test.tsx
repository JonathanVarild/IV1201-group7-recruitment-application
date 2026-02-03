import { describe, expect, it } from "vitest";
import { Header } from "../../components/Header";
import { render, screen } from "@testing-library/react";

describe("Header", () => {
  it("renders logo that links to home", () => {
    render(<Header />);

    const logo = screen.getByText("RecruitApp");
    expect(logo).toBeInTheDocument();
    expect(logo.closest("a")).toHaveAttribute("href", "/");
  });

  it("includes correct navigation links", () => {
    const { container } = render(<Header />);

    const nav = container.querySelector("nav");
    expect(nav).toBeInTheDocument();
    expect(nav?.querySelector('a[href="/"]')).toBeInTheDocument();
    expect(nav?.querySelector('a[href="/apply"]')).toBeInTheDocument();
    expect(nav?.querySelector('a[href="/about"]')).toBeInTheDocument();
  });
});
