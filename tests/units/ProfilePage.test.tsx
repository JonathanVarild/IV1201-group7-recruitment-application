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

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));

import { useAuth, AuthStatus } from "../../components/AuthProvider";
import { useRouter } from "next/navigation";
import ProfilePage from "@/app/[locale]/profile/page";

describe("ProfilePage", () => {
  beforeEach(() => {
    vi.mocked(useAuth).mockReturnValue({
      status: AuthStatus.Authenticated,
      userData: {
        id: 1,
        username: "testuser",
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
              userData: {
                username: "testuser",
                email: "test@example.com",
                pnr: "19900101-1234",
              },
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

  it("redirects to /login when unauthenticated", async () => {
    const pushMock = vi.fn();
    vi.mocked(useRouter).mockReturnValue({ push: pushMock } as unknown as ReturnType<typeof useRouter>);
    vi.mocked(useAuth).mockReturnValue({
      status: AuthStatus.Unauthenticated,
      userData: null,
      refreshAuth: vi.fn(),
    });

    render(<ProfilePage />);
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith("/login");
    });
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

    await waitFor(() => {
      expect(screen.getByRole("heading")).toHaveTextContent("testuser");
    });
    expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
    expect(screen.getByText(/19900101-1234/i)).toBeInTheDocument();
  });

  it("displays validation errors for short username", async () => {
    const user = userEvent.setup();
    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    await user.clear(screen.getByLabelText(/username/i));
    await user.type(screen.getByLabelText(/username/i), "ab");
    await user.click(screen.getByRole("button"));

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

    await user.clear(screen.getByLabelText(/pnr/i));
    await user.type(screen.getByLabelText(/pnr/i), "12345");
    await user.click(screen.getByRole("button"));

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

    await user.clear(screen.getByLabelText(/email/i));
    await user.type(screen.getByLabelText(/email/i), "not-an-email");
    await user.click(screen.getByRole("button"));

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

    await user.type(screen.getByLabelText(/password/i), "weak");
    await user.click(screen.getByRole("button"));

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

    await user.clear(screen.getByLabelText(/email/i));
    await user.type(screen.getByLabelText(/email/i), "invalid");
    await user.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByLabelText(/email/i)).toHaveAttribute("aria-invalid", "true");
    });
  });
});
