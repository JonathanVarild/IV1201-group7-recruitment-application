import { Nav } from "../../components/Nav";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

describe("Nav", () => {
  it("renders all expected navigation links", () => {
    render(<Nav />);

    expect(screen.getByText("home")).toBeInTheDocument();
    expect(screen.getByText("apply")).toBeInTheDocument();
    expect(screen.getByText("about")).toBeInTheDocument();
  });

  it("links have correct hrefs", () => {
    const { container } = render(<Nav />);

    const homeLink = container.querySelector('a[href="/"]');
    const applyLink = container.querySelector('a[href="/apply"]');
    const aboutLink = container.querySelector('a[href="/about"]');

    expect(homeLink).toHaveAttribute("href", "/");
    expect(applyLink).toHaveAttribute("href", "/apply");
    expect(aboutLink).toHaveAttribute("href", "/about");
  });
});
