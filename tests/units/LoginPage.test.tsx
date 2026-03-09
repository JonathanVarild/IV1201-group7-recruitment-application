import userEvent from "@testing-library/user-event";
import { vi, describe, expect, it, afterEach, beforeEach } from "vitest";
import LoginPage from "../../app/[locale]/login/page";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { managedFetch } from "@/lib/api";
import { handleClientError } from "@/lib/utils";

const mockPush = vi.fn();
const mockRefreshAuth = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock("@/components/AuthProvider", () => ({
  useAuth: () => ({
    refreshAuth: mockRefreshAuth,
  }),
}));

vi.mock("@/lib/api", () => ({
  managedFetch: vi.fn(),
}));

vi.mock("@/lib/utils", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/utils")>();
  return {
    ...actual,
    handleClientError: vi.fn(),
  };
});

const mockedManagedFetch = managedFetch as unknown as ReturnType<typeof vi.fn>;
const mockedHandleClientError = handleClientError as unknown as ReturnType<typeof vi.fn>;

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });
  it("renders login form with username and password fields", () => {
    render(<LoginPage />);

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("displays validation errors for missing username", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const usernameInput = screen.getByLabelText(/username/i);
    const submitButton = screen.getByRole("button");

    await user.clear(usernameInput);
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("validation.usernameRequired")).toBeInTheDocument();
    });
  });

  it("displays validation error for empty password", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const usernameInput = screen.getByLabelText(/username/i);
    const submitButton = screen.getByRole("button");

    await user.type(usernameInput, "testuser");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("validation.passwordRequired")).toBeInTheDocument();
    });
  });

  it("marks fields as invalid when there are errors", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const usernameInput = screen.getByLabelText(/username/i);
    const submitButton = screen.getByRole("button");

    await user.clear(usernameInput);
    await user.click(submitButton);

    await waitFor(() => {
      expect(usernameInput).toHaveAttribute("aria-invalid", "true");
    });
  });

  it("successfully logs in with valid credentials", async () => {
    const user = userEvent.setup();
    mockedManagedFetch.mockResolvedValueOnce({});
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/username/i), "testuser");
    await user.type(screen.getByLabelText(/password/i), "Qwerty123");
    await user.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(mockedManagedFetch).toHaveBeenCalledWith(
        "/api/login",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }),
      );
      expect(mockPush).toHaveBeenCalledWith("/");
      expect(mockRefreshAuth).toHaveBeenCalledTimes(1);
    });
  });

  it("handleClientError when login request fails", async () => {
    const user = userEvent.setup();
    const loginError = new Error("login failed");
    mockedManagedFetch.mockRejectedValueOnce(loginError);
    render(<LoginPage />);

    await user.type(screen.getByLabelText(/username/i), "testuser");
    await user.type(screen.getByLabelText(/password/i), "Qwerty123");
    await user.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(mockedHandleClientError).toHaveBeenCalledWith(loginError, expect.any(Function));
      expect(mockPush).not.toHaveBeenCalled();
      expect(mockRefreshAuth).not.toHaveBeenCalled();
    });
  });
});
