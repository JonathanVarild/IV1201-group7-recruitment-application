import { Nav } from "../../components/Nav";
import { render } from "@testing-library/react";
import { useAuth } from "../../components/AuthProvider";
import { AuthStatus } from "../../components/AuthProvider";
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("../../components/AuthProvider", async () => {
  const actual = await vi.importActual("../../components/AuthProvider");
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

describe("Nav", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all expected navigation links", () => {
    vi.mocked(useAuth).mockReturnValue({
      status: AuthStatus.Unauthenticated,
      userData: null,
      refreshAuth: vi.fn(),
    });

    const { container } = render(<Nav />);

    expect(container.querySelector('a[href="/"]')).toBeInTheDocument();
    expect(container.querySelector('a[href="/about"]')).toBeInTheDocument();
    expect(container.querySelector('a[href="/login"]')).toBeInTheDocument();
    expect(container.querySelector('a[href="/register"]')).toBeInTheDocument();
  });

  it("links have correct hrefs", () => {
    vi.mocked(useAuth).mockReturnValue({
      status: AuthStatus.Unauthenticated,
      userData: null,
      refreshAuth: vi.fn(),
    });

    const { container } = render(<Nav />);

    const homeLink = container.querySelector('a[href="/"]');
    const aboutLink = container.querySelector('a[href="/about"]');
    const loginLink = container.querySelector('a[href="/login"]');
    const registerLink = container.querySelector('a[href="/register"]');

    expect(homeLink).toHaveAttribute("href", "/");
    expect(aboutLink).toHaveAttribute("href", "/about");
    expect(loginLink).toHaveAttribute("href", "/login");
    expect(registerLink).toHaveAttribute("href", "/register");
  });

  it("renders authenticated navigation links when authenticated", () => {
    vi.mocked(useAuth).mockReturnValue({
      status: AuthStatus.Authenticated,
      userData: { username: "testuser", id: 1, roleID: 1, role: "user" },
      refreshAuth: vi.fn(),
    });

    const { container } = render(<Nav />);

    expect(container.querySelector('a[href="/"]')).toBeInTheDocument();
    expect(container.querySelector('a[href="/apply"]')).toBeInTheDocument();
    expect(container.querySelector('a[href="/about"]')).toBeInTheDocument();
    expect(container.querySelector('a[href="#"]')).toBeInTheDocument();
    expect(container.querySelector('a[href="/login"]')).not.toBeInTheDocument();
    expect(container.querySelector('a[href="/register"]')).not.toBeInTheDocument();
  });

  it("authenticated links have correct hrefs", () => {
    vi.mocked(useAuth).mockReturnValue({
      status: AuthStatus.Authenticated,
      userData: { username: "testuser", id: 1, roleID: 1, role: "user" },
      refreshAuth: vi.fn(),
    });

    const { container } = render(<Nav />);

    const homeLink = container.querySelector('a[href="/"]');
    const applyLink = container.querySelector('a[href="/apply"]');
    const aboutLink = container.querySelector('a[href="/about"]');
    const logoutLink = container.querySelector('a[href="#"]');

    expect(homeLink).toHaveAttribute("href", "/");
    expect(applyLink).toHaveAttribute("href", "/apply");
    expect(aboutLink).toHaveAttribute("href", "/about");
    expect(logoutLink).toHaveAttribute("href", "#");
  });
});
