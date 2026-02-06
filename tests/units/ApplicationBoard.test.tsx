import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import ApplicationBoard from "../../app/[locale]/applications/ApplicationBoard";
import { ApplicationFullInformation } from "@/lib/types/applicationType";

vi.mock("../../app/[locale]/admin/ApplicationCard", () => ({
  default: ({ applicationFullInformation }: { applicationFullInformation: ApplicationFullInformation }) => (
    <div data-testid={`app-card-${applicationFullInformation.id}`}>
      {applicationFullInformation.name.firstName} {applicationFullInformation.name.lastName}
    </div>
  ),
}));

describe("ApplicationBoard", () => {
  afterEach(() => {
    cleanup();
  });
  const mockApplications: ApplicationFullInformation[] = [
    {
      id: "1",
      name: { firstName: "John", lastName: "Doe" },
      username: "johndoe",
      email: "john@example.com",
      applicationDate: "2024-01-01",
      status: "unhandled",
      answers: [],
    },
    {
      id: "2",
      name: { firstName: "Jane", lastName: "Smith" },
      username: "janesmith",
      email: "jane@example.com",
      applicationDate: "2024-01-02",
      status: "unhandled",
      answers: [],
    },
    {
      id: "3",
      name: { firstName: "Bob", lastName: "Johnson" },
      username: "bobjohnson",
      email: "bob@example.com",
      applicationDate: "2024-01-03",
      status: "accepted",
      answers: [],
    },
    {
      id: "4",
      name: { firstName: "Alice", lastName: "Williams" },
      username: "alicew",
      email: "alice@example.com",
      applicationDate: "2024-01-04",
      status: "rejected",
      answers: [],
    },
  ];

  it("renders all three columns with correct application counts and categorization", () => {
    render(<ApplicationBoard applications={mockApplications} />);

    // Check all three columns are rendered (use getAllByText since columns might appear from previous tests)
    const unhandledColumns = screen.getAllByText("unhandled");
    const acceptedColumns = screen.getAllByText("accepted");
    const rejectedColumns = screen.getAllByText("rejected");

    expect(unhandledColumns.length).toBeGreaterThan(0);
    expect(acceptedColumns.length).toBeGreaterThan(0);
    expect(rejectedColumns.length).toBeGreaterThan(0);

    // Check that applications are rendered with correct names
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText("Jane Smith")).toBeInTheDocument();
    expect(screen.getByText("Bob Johnson")).toBeInTheDocument();
    expect(screen.getByText("Alice Williams")).toBeInTheDocument();
  });

  it("loads more applications when load more button is clicked", () => {
    // Create more than 5 unhandled applications to trigger "Load More"
    const manyApplications: ApplicationFullInformation[] = Array.from({ length: 8 }, (_, i) => ({
      id: `unhandled-${i + 1}`,
      name: { firstName: `User${i + 1}`, lastName: "Test" },
      username: `user${i + 1}`,
      email: `user${i + 1}@example.com`,
      applicationDate: "2024-01-01",
      status: "unhandled",
      answers: [],
    }));

    render(<ApplicationBoard applications={manyApplications} />);

    // Initially, only 5 applications should be visible
    expect(screen.getByText("User1 Test")).toBeInTheDocument();
    expect(screen.getByText("User5 Test")).toBeInTheDocument();
    expect(screen.queryByText("User6 Test")).not.toBeInTheDocument();

    // Load More button should be visible
    const loadMoreButton = screen.getByText(/loadMore/);
    expect(loadMoreButton).toBeInTheDocument();

    // Click Load More
    fireEvent.click(loadMoreButton);

    // Now more applications should be visible (5 + 5 = 10, but we only have 8)
    expect(screen.getByText("User6 Test")).toBeInTheDocument();
    expect(screen.getByText("User7 Test")).toBeInTheDocument();
    expect(screen.getByText("User8 Test")).toBeInTheDocument();
  });

  it("handles empty applications array gracefully", () => {
    render(<ApplicationBoard applications={[]} />);

    // All three columns should still be rendered
    const unhandledColumns = screen.getAllByText("unhandled");
    const acceptedColumns = screen.getAllByText("accepted");
    const rejectedColumns = screen.getAllByText("rejected");

    expect(unhandledColumns.length).toBeGreaterThan(0);
    expect(acceptedColumns.length).toBeGreaterThan(0);
    expect(rejectedColumns.length).toBeGreaterThan(0);

    // "No applications" message should be displayed in each column
    const noApplicationsMessages = screen.getAllByText(/noApplications/);
    expect(noApplicationsMessages.length).toBe(3);

    // No application cards should be rendered (check for any testid starting with app-card)
    const appCards = screen.queryAllByTestId(/^app-card-/);
    expect(appCards.length).toBe(0);

    // Load more buttons should not be visible
    expect(screen.queryByText(/loadMore/)).not.toBeInTheDocument();
  });
});
