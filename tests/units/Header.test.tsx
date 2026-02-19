import { Header } from "../../components/Header";
import { useAuth } from "../../components/AuthProvider";
import { render, screen } from "@testing-library/react";
import { AuthStatus } from "../../components/AuthProvider";
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../../components/AuthProvider", async () => {
  const actual = await vi.importActual("../../components/AuthProvider");
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

describe("Header", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      status: AuthStatus.Unauthenticated,
      userData: null,
      refreshAuth: vi.fn(),
    });
  });

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
    expect(nav?.querySelector('a[href="/about"]')).toBeInTheDocument();
    expect(nav?.querySelector('a[href="/login"]')).toBeInTheDocument();
    expect(nav?.querySelector('a[href="/register"]')).toBeInTheDocument();
  });
});
