import { APIError } from "@/lib/errors/generalErrors";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import ApplicationCard from "../../app/[locale]/admin/ApplicationCard";
import { ApplicationFullInformation } from "@/lib/types/applicationType";
import { cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react";

const { mockManagedFetch, mockRefresh } = vi.hoisted(() => ({
  mockManagedFetch: vi.fn(),
  mockRefresh: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  managedFetch: mockManagedFetch,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: mockRefresh,
  }),
}));

describe("ApplicationCard", () => {
  beforeEach(() => {
    mockManagedFetch.mockReset();
    mockRefresh.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
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
    const { container } = render(<ApplicationCard applicationFullInformation={mockApplication} />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    // Click on the dialog trigger
    const trigger = container.querySelector('[data-slot="dialog-trigger"]');
    expect(trigger).toBeInTheDocument();
    fireEvent.click(trigger!);

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

  it("shows status actions based on current status", () => {
    const { container, unmount } = render(<ApplicationCard applicationFullInformation={mockApplication} />);

    const trigger = container.querySelector('[data-slot="dialog-trigger"]');
    fireEvent.click(trigger!);

    expect(screen.getByRole("button", { name: "moveToAccepted" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "moveToRejected" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "moveToUnhandled" })).not.toBeInTheDocument();

    unmount();

    const { container: acceptedContainer } = render(
      <ApplicationCard
        applicationFullInformation={{
          ...mockApplication,
          status: "accepted",
        }}
      />,
    );

    const acceptedTrigger = acceptedContainer.querySelector('[data-slot="dialog-trigger"]');
    fireEvent.click(acceptedTrigger!);

    expect(screen.getByRole("button", { name: "moveToUnhandled" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "moveToRejected" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "moveToAccepted" })).not.toBeInTheDocument();
  });

  it("sends PATCH request and refreshes on successful status update", async () => {
    mockManagedFetch.mockResolvedValueOnce({});

    const { container } = render(<ApplicationCard applicationFullInformation={mockApplication} />);
    const trigger = container.querySelector('[data-slot="dialog-trigger"]');
    fireEvent.click(trigger!);

    const moveButton = screen.getByRole("button", { name: "moveToAccepted" });
    fireEvent.click(moveButton);

    await waitFor(() => {
      expect(mockManagedFetch).toHaveBeenCalledWith(
        "/api/admin/1",
        expect.objectContaining({
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "accepted", currentStatus: "unhandled" }),
        }),
      );
      expect(mockRefresh).toHaveBeenCalledTimes(1);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("alerts update error for non-conflict failures", async () => {
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => undefined);
    mockManagedFetch.mockRejectedValueOnce(new APIError(500, {} as Response, {}));

    const { container } = render(<ApplicationCard applicationFullInformation={mockApplication} />);
    const trigger = container.querySelector('[data-slot="dialog-trigger"]');
    fireEvent.click(trigger!);
    fireEvent.click(screen.getByRole("button", { name: "moveToAccepted" }));

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("updateError");
      expect(mockRefresh).not.toHaveBeenCalled();
    });
  });

  it("disables action buttons while status update request is in progress", async () => {
    let resolveFetch: ((value: unknown) => void) | undefined;

    mockManagedFetch.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        }),
    );

    const { container } = render(<ApplicationCard applicationFullInformation={mockApplication} />);
    const trigger = container.querySelector('[data-slot="dialog-trigger"]');
    fireEvent.click(trigger!);
    fireEvent.click(screen.getByRole("button", { name: "moveToAccepted" }));

    const actionButtons = screen.getAllByRole("button", { name: /moveTo/i });
    expect(actionButtons[0]).toBeDisabled();
    expect(actionButtons[1]).toBeDisabled();

    resolveFetch?.({});

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });
  });
});
