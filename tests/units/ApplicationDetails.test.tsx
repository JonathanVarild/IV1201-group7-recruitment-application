import { describe, expect, it, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import ApplicationDetails from "../../app/[locale]/admin/ApplicationDetails";
import { ApplicationFullInformation } from "@/lib/types/applicationType";

describe("ApplicationDetails", () => {
  afterEach(() => {
    cleanup();
  });

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

  it("renders basic application information correctly", () => {
    const { container } = render(<ApplicationDetails applicationDetails={mockApplication} />);

    // Check email is displayed
    expect(screen.getByText("john.doe@example.com")).toBeInTheDocument();

    // Check username is displayed
    expect(screen.getByText("johndoe")).toBeInTheDocument();

    // Check application date is displayed
    expect(screen.getByText("2024-06-01")).toBeInTheDocument();

    // Check status is displayed (capitalized by CSS)
    expect(screen.getByText("unhandled")).toBeInTheDocument();

    // Check translation keys are being used for labels
    expect(screen.getAllByText("email").length).toBeGreaterThan(0);
    expect(screen.getAllByText("username").length).toBeGreaterThan(0);
    expect(screen.getAllByText("applicationDate").length).toBeGreaterThan(0);
    expect(screen.getAllByText("status").length).toBeGreaterThan(0);
  });

  it("handles application with no answers correctly", () => {
    const applicationWithNoAnswers: ApplicationFullInformation = {
      ...mockApplication,
      answers: [],
    };

    render(<ApplicationDetails applicationDetails={applicationWithNoAnswers} />);

    // Basic info should still be displayed - check actual values
    expect(screen.getByText("john.doe@example.com")).toBeInTheDocument();
    expect(screen.getByText("johndoe")).toBeInTheDocument();
    expect(screen.getByText("2024-06-01")).toBeInTheDocument();

    // Answers section should not be displayed
    expect(screen.queryByText("answersHeader")).not.toBeInTheDocument();

    // No answer text should be displayed
    expect(screen.queryByText("Strong leadership skills")).not.toBeInTheDocument();
    expect(screen.queryByText("Available immediately")).not.toBeInTheDocument();
  });
});
