import userEvent from "@testing-library/user-event";
import LoginPage from "../../app/[locale]/login/page";
import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";

describe("LoginPage", () => {
  afterEach(() => {
    cleanup();
  });
  it("renders login form with email and password fields", () => {
    render(<LoginPage />);

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("displays validation errors for invalid email", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole("button");

    await user.type(emailInput, "invalid-email");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("validation.emailInvalid")).toBeInTheDocument();
    });
  });

  it("displays validation error for empty password", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole("button");

    await user.type(emailInput, "test@example.com");
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("validation.passwordRequired")).toBeInTheDocument();
    });
  });

  it("marks fields as invalid when there are errors", async () => {
    const user = userEvent.setup();
    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole("button");

    await user.type(emailInput, "invalid");
    await user.click(submitButton);

    await waitFor(() => {
      expect(emailInput).toHaveAttribute("aria-invalid", "true");
    });
  });
});
