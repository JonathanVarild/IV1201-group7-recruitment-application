import userEvent from "@testing-library/user-event";
import RegisterPage from "../../app/[locale]/register/page";
import { describe, expect, it, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";

describe("RegisterPage", () => {
  afterEach(() => {
    cleanup();
  });
  it("renders registration form with all required fields", () => {
    render(<RegisterPage />);

    expect(screen.getByLabelText(/firstName/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/lastName/i)).toBeInTheDocument();
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

  it("marks fields as invalid when there are errors", async () => {
    const user = userEvent.setup();
    render(<RegisterPage />);

    const emailInput = screen.getByLabelText(/email/i);
    const submitButton = screen.getByRole("button");

    await user.type(emailInput, "invalid");
    await user.click(submitButton);

    await waitFor(() => {
      expect(emailInput).toHaveAttribute("aria-invalid", "true");
    });
  });
});
