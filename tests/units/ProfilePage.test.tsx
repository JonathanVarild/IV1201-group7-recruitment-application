import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("../../components/AuthProvider", async () => {
  const actual = await vi.importActual("../../components/AuthProvider");
  return {
    ...actual,
    useAuth: vi.fn(),
  };
});

import { useAuth, AuthStatus } from "../../components/AuthProvider";
import ProfilePage from "@/app/[locale]/profile/page";

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      status: AuthStatus.Authenticated,
      userData: {
        id: 1,
        username: "testuser",
        email: "test@example.com",
        pnr: "19900101-1234",
        roleID: 1,
        role: "user",
      },
      refreshAuth: vi.fn(),
    });

    vi.stubGlobal(
      "fetch",
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              username: "testuser",
              email: "test@example.com",
              pnr: "19900101-1234",
            }),
        }),
      ),
    );
  });
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders profile form with all required fields", async () => {
    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/pnr/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it("shows current users information", async () => {
    render(<ProfilePage />);

    await waitFor(
      () => {
        expect(screen.getByText(/testuser!/i)).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
    expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
    expect(screen.getByText(/19900101-1234/i)).toBeInTheDocument();
  });

  it("displays validation errors for short username", async () => {
    const user = userEvent.setup();
    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    const usernameInput = screen.getByLabelText(/username/i);
    const updateButton = screen.getByRole("button");

    await user.clear(usernameInput);
    await user.type(usernameInput, "ab");
    await user.click(updateButton);

    await waitFor(() => {
      expect(screen.getByText("validation.usernameMin")).toBeInTheDocument();
    });
  });

  it("displays validation error for invalid personal number format", async () => {
    const user = userEvent.setup();
    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    const personalNumberInput = screen.getByLabelText(/pnr/i);
    const submitButton = screen.getByRole("button");

    await user.clear(personalNumberInput);
    await user.type(personalNumberInput, "12345");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("validation.personalNumberInvalid")).toBeInTheDocument();
    });
  });

  it("displays validation error for invalid email", async () => {
    const user = userEvent.setup();
    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole("button");

    await user.clear(emailInput);
    await user.type(emailInput, "not-an-email");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("validation.emailInvalid")).toBeInTheDocument();
    });
  });

  it("displays validation errors for weak password", async () => {
    const user = userEvent.setup();
    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole("button");

    await user.type(passwordInput, "weak");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("validation.passwordMin")).toBeInTheDocument();
    });
  });

  it("marks fields as invalid when there are errors", async () => {
    const user = userEvent.setup();
    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole("button");

    await user.clear(emailInput);
    await user.type(emailInput, "invalid");
    await user.click(submitButton);

    await waitFor(() => {
      expect(emailInput).toHaveAttribute("aria-invalid", "true");
    });
  });
});
