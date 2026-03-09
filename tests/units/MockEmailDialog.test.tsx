import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi, afterEach } from "vitest";
import { cleanup } from "@testing-library/react";
import { MockEmailDialog } from "../../app/[locale]/resetcredentials/mockEmailDialog";

const defaultProps = {
  open: true,
  onOpenChange: vi.fn(),
  email: "user@example.com",
  token: "abc123",
  resetUrl: "http://localhost:3000/resetcredentials/abc123",
};

describe("MockEmailDialog", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("renders email metadata when open", () => {
    render(<MockEmailDialog {...defaultProps} />);

    expect(screen.getByText(/donotreply@finnsinte\.se/)).toBeInTheDocument();
    expect(screen.getByText(/user@example\.com/)).toBeInTheDocument();
  });

  it("renders email body content when open", () => {
    render(<MockEmailDialog {...defaultProps} />);

    expect(screen.getByText(/hello/i)).toBeInTheDocument();
    expect(screen.getByText("emailContent")).toBeInTheDocument();
  });

  it("renders reset link with correct href and display text", () => {
    render(<MockEmailDialog {...defaultProps} />);

    const link = screen.getByRole("link", { name: defaultProps.resetUrl });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", `/resetcredentials/${defaultProps.token}`);
  });

  it("does not render content when closed", () => {
    render(<MockEmailDialog {...defaultProps} open={false} />);

    expect(screen.queryByText(/donotreply@finnsinte\.se/)).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("calls onOpenChange when dialog close button is clicked", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();
    render(<MockEmailDialog {...defaultProps} onOpenChange={onOpenChange} />);

    const closeButton = screen.getByRole("button");
    await user.click(closeButton);

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
