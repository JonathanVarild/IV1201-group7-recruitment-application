import userEvent from "@testing-library/user-event";
import LoginPage from "../../app/[locale]/login/page";
import { describe, expect, it, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";

describe("LoginPage", () => {
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
});
