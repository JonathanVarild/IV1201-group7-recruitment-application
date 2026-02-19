import { describe, expect, it } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, fireEvent } from "@testing-library/react";
import ApplicationCard from "../../app/[locale]/applications/ApplicationCard";
import { ApplicationFullInformation } from "@/lib/types/applicationType";

describe("ApplicationCard", () => {
  const mockApplication: ApplicationFullInformation = {
    id: "1",
    name: {
      firstName: "John",
      lastName: "Doe",
    },
    username: "johndoe",
    email: "john.doe@example.com",
    applicationDate: "2024-06-01",
    status: "unhandled",
    answers: [
      { question: "competences", answer: "Strong leadership skills" },
      { question: "availability", answer: "Available immediately" },
    ],
  };

  it("renders application name and date correctly", () => {
    render(<ApplicationCard applicationFullInformation={mockApplication} />);

    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(
      screen.getByText((content, element) => {
        return element?.textContent === "appliedDate: 2024-06-01";
      }),
    ).toBeInTheDocument();
  });

  it("opens dialog when card is clicked", async () => {
    const user = userEvent.setup();
    const { container } = render(<ApplicationCard applicationFullInformation={mockApplication} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Click on the dialog trigger
    const trigger = container.querySelector('[data-slot="dialog-trigger"]');
    expect(trigger).toBeInTheDocument();
    await user.click(trigger!);

    // Verify dialog content is displayed
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("john.doe@example.com")).toBeInTheDocument();
    expect(screen.getByText("johndoe")).toBeInTheDocument();
  });

  it("passes correct props to ApplicationDetails component", async () => {
    const { container } = render(<ApplicationCard applicationFullInformation={mockApplication} />);

    // Click on the dialog trigger using fireEvent to avoid pointer-events issue
    const trigger = container.querySelector('[data-slot="dialog-trigger"]');
    fireEvent.click(trigger!);

    // Verify application details are displayed in the dialog
    const dialogContent = screen.getByRole("dialog");
    expect(dialogContent).toHaveTextContent("john.doe@example.com");
    expect(dialogContent).toHaveTextContent("johndoe");
    expect(dialogContent).toHaveTextContent("Strong leadership skills");
  });
});
