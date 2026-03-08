import { describe, expect, it, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import ApplicationBoard from "../../app/[locale]/admin/ApplicationBoard";
import { ApplicationFullInformation } from "@/lib/types/applicationType";

vi.mock("../../app/[locale]/admin/ApplicationCard", () => ({
  default: ({ applicationFullInformation }: { applicationFullInformation: ApplicationFullInformation }) => (
    <div data-testid={`app-card-${applicationFullInformation.id}`}>
      {applicationFullInformation.name.firstName} {applicationFullInformation.name.lastName}
    </div>
  ),
}));

describe("ApplicationBoard", () => {
  const buildInitialData = (applications: ApplicationFullInformation[]) => ({
    unhandled: {
      applications: applications.filter((app) => app.status === "unhandled"),
      total: applications.filter((app) => app.status === "unhandled").length,
      hasMore: false,
    },
    accepted: {
      applications: applications.filter((app) => app.status === "accepted"),
      total: applications.filter((app) => app.status === "accepted").length,
      hasMore: false,
    },
    rejected: {
      applications: applications.filter((app) => app.status === "rejected"),
      total: applications.filter((app) => app.status === "rejected").length,
      hasMore: false,
    },
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
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
    render(<ApplicationBoard initialData={buildInitialData(mockApplications)} />);

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

  it("loads 5 more applications only for selected category when load more is clicked", async () => {
    const initialUnhandled: ApplicationFullInformation[] = Array.from({ length: 5 }, (_, i) => ({
      id: `unhandled-${i + 1}`,
      name: { firstName: `User${i + 1}`, lastName: "Test" },
      username: `user${i + 1}`,
      email: `user${i + 1}@example.com`,
      applicationDate: "2024-01-01",
      status: "unhandled",
      answers: [],
    }));

    const newUnhandled: ApplicationFullInformation[] = Array.from({ length: 5 }, (_, i) => ({
      id: `unhandled-${i + 6}`,
      name: { firstName: `User${i + 6}`, lastName: "Test" },
      username: `user${i + 6}`,
      email: `user${i + 6}@example.com`,
      applicationDate: "2024-01-01",
      status: "unhandled",
      answers: [],
    }));

    vi.spyOn(global, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        applications: newUnhandled,
        total: 10,
        hasMore: false,
      }),
    } as Response);

    render(
      <ApplicationBoard
        initialData={{
          unhandled: {
            applications: initialUnhandled,
            total: 10,
            hasMore: true,
          },
          accepted: {
            applications: [],
            total: 0,
            hasMore: false,
          },
          rejected: {
            applications: [],
            total: 0,
            hasMore: false,
          },
        }}
      />,
    );

    expect(screen.getByText("User1 Test")).toBeInTheDocument();
    expect(screen.getByText("User5 Test")).toBeInTheDocument();
    expect(screen.queryByText("User6 Test")).not.toBeInTheDocument();

    const loadMoreButton = screen.getByText(/loadMore/);
    expect(loadMoreButton).toBeInTheDocument();
    fireEvent.click(loadMoreButton);

    await waitFor(() => {
      expect(screen.getByText("User6 Test")).toBeInTheDocument();
      expect(screen.getByText("User10 Test")).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining("/api/admin?status=unhandled&offset=5"), expect.objectContaining({ method: "GET" }));
  });

  it("handles empty applications array gracefully", () => {
    render(
      <ApplicationBoard
        initialData={{
          unhandled: { applications: [], total: 0, hasMore: false },
          accepted: { applications: [], total: 0, hasMore: false },
          rejected: { applications: [], total: 0, hasMore: false },
        }}
      />,
    );

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

  it("does not render load more button when column has no more items", () => {
    const fetchSpy = vi.spyOn(global, "fetch");

    render(
      <ApplicationBoard
        initialData={{
          unhandled: {
            applications: [
              {
                id: "unhandled-1",
                name: { firstName: "User1", lastName: "Test" },
                username: "user1",
                email: "user1@example.com",
                applicationDate: "2024-01-01",
                status: "unhandled",
                answers: [],
              },
            ],
            total: 1,
            hasMore: false,
          },
          accepted: {
            applications: [],
            total: 0,
            hasMore: false,
          },
          rejected: {
            applications: [],
            total: 0,
            hasMore: false,
          },
        }}
      />,
    );

    expect(screen.queryByRole("button", { name: /loadMore/i })).not.toBeInTheDocument();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("disables load more button while loading and prevents duplicate requests", async () => {
    let resolveFetch: ((response: Response) => void) | undefined;
    const fetchSpy = vi.spyOn(global, "fetch").mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          resolveFetch = resolve;
        }),
    );

    const initialUnhandled: ApplicationFullInformation[] = Array.from({ length: 5 }, (_, i) => ({
      id: `unhandled-${i + 1}`,
      name: { firstName: `User${i + 1}`, lastName: "Test" },
      username: `user${i + 1}`,
      email: `user${i + 1}@example.com`,
      applicationDate: "2024-01-01",
      status: "unhandled",
      answers: [],
    }));

    render(
      <ApplicationBoard
        initialData={{
          unhandled: {
            applications: initialUnhandled,
            total: 7,
            hasMore: true,
          },
          accepted: {
            applications: [],
            total: 0,
            hasMore: false,
          },
          rejected: {
            applications: [],
            total: 0,
            hasMore: false,
          },
        }}
      />,
    );

    const loadMoreButton = screen.getByRole("button", { name: /loadMore/i });
    fireEvent.click(loadMoreButton);

    expect(loadMoreButton).toBeDisabled();
    fireEvent.click(loadMoreButton);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    resolveFetch?.({
      ok: true,
      json: async () => ({
        applications: [
          {
            id: "unhandled-6",
            name: { firstName: "User6", lastName: "Test" },
            username: "user6",
            email: "user6@example.com",
            applicationDate: "2024-01-02",
            status: "unhandled",
            answers: [],
          },
          {
            id: "unhandled-7",
            name: { firstName: "User7", lastName: "Test" },
            username: "user7",
            email: "user7@example.com",
            applicationDate: "2024-01-03",
            status: "unhandled",
            answers: [],
          },
        ],
        total: 7,
        hasMore: false,
      }),
    } as Response);

    await waitFor(() => {
      expect(screen.getByText("User6 Test")).toBeInTheDocument();
      expect(screen.getByText("User7 Test")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /loadMore/i })).not.toBeInTheDocument();
    });
  });

  it("syncs board state when initialData changes", async () => {
    const { rerender } = render(
      <ApplicationBoard
        initialData={{
          unhandled: {
            applications: [
              {
                id: "unhandled-1",
                name: { firstName: "User1", lastName: "Test" },
                username: "user1",
                email: "user1@example.com",
                applicationDate: "2024-01-01",
                status: "unhandled",
                answers: [],
              },
            ],
            total: 1,
            hasMore: false,
          },
          accepted: {
            applications: [],
            total: 0,
            hasMore: false,
          },
          rejected: {
            applications: [],
            total: 0,
            hasMore: false,
          },
        }}
      />,
    );

    expect(screen.getByText("User1 Test")).toBeInTheDocument();

    rerender(
      <ApplicationBoard
        initialData={{
          unhandled: {
            applications: [],
            total: 0,
            hasMore: false,
          },
          accepted: {
            applications: [
              {
                id: "accepted-1",
                name: { firstName: "Updated", lastName: "User" },
                username: "updateduser",
                email: "updated@example.com",
                applicationDate: "2024-01-02",
                status: "accepted",
                answers: [],
              },
            ],
            total: 1,
            hasMore: false,
          },
          rejected: {
            applications: [],
            total: 0,
            hasMore: false,
          },
        }}
      />,
    );

    await waitFor(() => {
      expect(screen.queryByText("User1 Test")).not.toBeInTheDocument();
      expect(screen.getByText("Updated User")).toBeInTheDocument();
    });
  });
});
