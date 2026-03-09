import userEvent from "@testing-library/user-event";
import RegisterPage from "../../app/[locale]/register/page";
import { vi, describe, expect, it, afterEach, beforeEach } from "vitest";
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

describe("RegisterPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });
  it("renders registration form with all required fields", () => {
    render(<RegisterPage />);

    expect(screen.getByLabelText(/firstName/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/lastName/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/personalNumber/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmPassword/i)).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("displays validation errors for short first name", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    const firstNameInput = screen.getByLabelText(/firstName/i);
    const submitButton = screen.getByRole("button");

    await user.type(firstNameInput, "A");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("validation.firstNameMin")).toBeInTheDocument();
    });
  });

  it("displays validation errors for short username", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    const usernameInput = screen.getByLabelText(/username/i);
    const submitButton = screen.getByRole("button");

    await user.type(usernameInput, "ab");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("validation.usernameMin")).toBeInTheDocument();
    });
  });

  it("displays validation error for invalid personal number format", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    const personalNumberInput = screen.getByLabelText(/personalNumber/i);
    const submitButton = screen.getByRole("button");

    await user.type(personalNumberInput, "12345");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("validation.personalNumberInvalid")).toBeInTheDocument();
    });
  });

  it("displays validation error for invalid email", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole("button");

    await user.type(emailInput, "not-an-email");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("validation.emailInvalid")).toBeInTheDocument();
    });
  });

  it("displays validation errors for weak password", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    const passwordInput = screen.getByLabelText(/^password$/i);
    const submitButton = screen.getByRole("button");

    await user.type(passwordInput, "weak");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("validation.passwordMin")).toBeInTheDocument();
    });
  });

  it("displays error when passwords don't match", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirmPassword/i);
    const submitButton = screen.getByRole("button");

    await user.type(passwordInput, "Password123");
    await user.type(confirmPasswordInput, "DifferentPassword123");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("validation.passwordsMismatch")).toBeInTheDocument();
    });
  });

  it("valid signup data and redirects to home on success", async () => {
    const user = userEvent.setup();
    mockedManagedFetch.mockResolvedValueOnce({ userID: 1 });
    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/firstName/i), "John");
    await user.type(screen.getByLabelText(/lastName/i), "Doe");
    await user.type(screen.getByLabelText(/username/i), "johndoe");
    await user.type(screen.getByLabelText(/personalNumber/i), "20000101-1234");
    await user.type(screen.getByLabelText(/email/i), "john@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "Password123");
    await user.type(screen.getByLabelText(/confirmPassword/i), "Password123");
    await user.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(mockedManagedFetch).toHaveBeenCalledWith(
        "/api/signup",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }),
      );
      expect(mockPush).toHaveBeenCalledWith("/");
      expect(mockRefreshAuth).toHaveBeenCalledTimes(1);
    });
  });

  it("handleClientError when signup fails", async () => {
    const user = userEvent.setup();
    const signupError = new Error("signup failed");
    mockedManagedFetch.mockRejectedValueOnce(signupError);
    render(<RegisterPage />);

    await user.type(screen.getByLabelText(/firstName/i), "John");
    await user.type(screen.getByLabelText(/lastName/i), "Doe");
    await user.type(screen.getByLabelText(/username/i), "johndoe");
    await user.type(screen.getByLabelText(/personalNumber/i), "20000101-1234");
    await user.type(screen.getByLabelText(/email/i), "john@example.com");
    await user.type(screen.getByLabelText(/^password$/i), "Password123");
    await user.type(screen.getByLabelText(/confirmPassword/i), "Password123");
    await user.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(mockedHandleClientError).toHaveBeenCalledWith(signupError, expect.any(Function));
      expect(mockPush).not.toHaveBeenCalled();
      expect(mockRefreshAuth).not.toHaveBeenCalled();
    });
  });
});
