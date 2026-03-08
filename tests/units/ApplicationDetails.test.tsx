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

  it("renders answers section and translated question keys when answers are present", () => {
    render(<ApplicationDetails applicationDetails={mockApplication} />);

    expect(screen.getByText("answersHeader")).toBeInTheDocument();
    expect(screen.getByText("Strong leadership skills")).toBeInTheDocument();
    expect(screen.getByText("Available immediately")).toBeInTheDocument();
    expect(screen.getByText(/questionsToAnswer\.competences/)).toBeInTheDocument();
    expect(screen.getByText(/questionsToAnswer\.availability/)).toBeInTheDocument();
  });

  it("renders all basic application fields including status", () => {
    render(<ApplicationDetails applicationDetails={mockApplication} />);

    expect(screen.getByText("john.doe@example.com")).toBeInTheDocument();
    expect(screen.getByText("johndoe")).toBeInTheDocument();
    expect(screen.getByText("2024-06-01")).toBeInTheDocument();

    const statusValue = screen.getByText("unhandled");
    expect(statusValue).toBeInTheDocument();
  });

  it("handles undefined answers without crashing", () => {
    const applicationWithUndefinedAnswers = {
      ...mockApplication,
      answers: undefined,
    } as unknown as ApplicationFullInformation;

    render(<ApplicationDetails applicationDetails={applicationWithUndefinedAnswers} />);

    expect(screen.getByText("john.doe@example.com")).toBeInTheDocument();
    expect(screen.queryByText("answersHeader")).not.toBeInTheDocument();
  });

  it("renders unknown question keys using fallback translation key path", () => {
    const applicationWithUnknownQuestion: ApplicationFullInformation = {
      ...mockApplication,
      answers: [{ question: "unknownQuestionKey", answer: "Fallback answer" }],
    };

    render(<ApplicationDetails applicationDetails={applicationWithUnknownQuestion} />);

    expect(screen.getByText("Fallback answer")).toBeInTheDocument();
    expect(screen.getByText(/questionsToAnswer\.unknownQuestionKey/)).toBeInTheDocument();
  });

  it("renders answers in the same order as provided", () => {
    render(<ApplicationDetails applicationDetails={mockApplication} />);

    const answerTexts = screen.getAllByText(/Strong leadership skills|Available immediately/);
    expect(answerTexts[0]).toHaveTextContent("Strong leadership skills");
    expect(answerTexts[1]).toHaveTextContent("Available immediately");
  });
});
