import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import ApplyPage from "../../app/[locale]/apply/page";
import { AuthStatus } from "@/components/AuthProvider";

const { mockPush, mockReplace, mockUseAuth, mockUseApplyPageData } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockReplace: vi.fn(),
  mockUseAuth: vi.fn(),
  mockUseApplyPageData: vi.fn(),
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "en-US",
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

vi.mock("@/components/AuthProvider", async () => {
  const actual = await vi.importActual<typeof import("@/components/AuthProvider")>("@/components/AuthProvider");
  return {
    ...actual,
    useAuth: mockUseAuth,
  };
});

vi.mock("../../app/[locale]/apply/useApplyPageData", () => ({
  useApplyPageData: mockUseApplyPageData,
}));

const createHookState = () => ({
  userData: {
    firstName: "Jane",
    lastName: "Doe",
    username: "janedoe",
    email: "jane@example.com",
    pnr: "19900101-1234",
  },
  selectableCompetences: [
    { id: 1, name: "Comp1" },
    { id: 2, name: "Comp2" },
  ],
  isLoadingData: false,
  hasLoadError: false,
  isSavingCompetence: false,
  isSavingAvailability: false,
  isSubmittingApplication: false,
  submittedApplication: null,
  selectedCompetenceID: null,
  setSelectedCompetenceID: vi.fn(),
  yearsInput: "",
  setYearsInput: vi.fn(),
  addedCompetences: [],
  selectedAvailability: undefined,
  setSelectedAvailability: vi.fn(),
  availabilityRanges: [],
  addCompetence: vi.fn(),
  removeCompetence: vi.fn(),
  handleCompetenceYearsBlur: vi.fn(),
  updateCompetenceYears: vi.fn(),
  getCompetenceName: vi.fn().mockReturnValue("Java"),
  addAvailabilityRange: vi.fn(),
  removeAvailabilityRange: vi.fn(),
  submitApplication: vi.fn(),
  clearApplication: vi.fn().mockResolvedValue(undefined),
});

describe("ApplyPage", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockReplace.mockReset();
    mockUseAuth.mockReset();
    mockUseApplyPageData.mockReset();

    mockUseAuth.mockReturnValue({
      status: AuthStatus.Authenticated,
      userData: null,
      refreshAuth: vi.fn(),
    });
    mockUseApplyPageData.mockReturnValue(createHookState());
    vi.spyOn(window, "alert").mockImplementation(() => undefined);
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders loading message while auth status is loading", () => {
    mockUseAuth.mockReturnValue({
      status: AuthStatus.Loading,
      userData: null,
      refreshAuth: vi.fn(),
    });

    render(<ApplyPage />);

    expect(screen.getByText("loadingData")).toBeInTheDocument();
  });

  it("redirects unauthenticated users to login and renders no page content", async () => {
    mockUseAuth.mockReturnValue({
      status: AuthStatus.Unauthenticated,
      userData: null,
      refreshAuth: vi.fn(),
    });

    const { container } = render(<ApplyPage />);

    expect(container.firstChild).toBeNull();
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith("/login");
    });
  });

  it("passes locale, messages and status to useApplyPageData", () => {
    render(<ApplyPage />);

    expect(mockUseApplyPageData).toHaveBeenCalledWith(
      expect.objectContaining({
        locale: "en-US",
        status: AuthStatus.Authenticated,
        onUnauthorized: expect.any(Function),
        messages: {
          competenceInvalidInput: "errors.competenceInvalidInput",
          availabilityInvalidInput: "errors.availabilityInvalidInput",
          loadingError: "errors.loadingError",
        },
      }),
    );
  });

  it("renders loaded contact information values", () => {
    render(<ApplyPage />);

    expect(screen.getByLabelText("contactInformation.firstName")).toHaveValue("Jane");
    expect(screen.getByLabelText("contactInformation.lastName")).toHaveValue("Doe");
    expect(screen.getByLabelText("contactInformation.username")).toHaveValue("janedoe");
    expect(screen.getByLabelText("contactInformation.email")).toHaveValue("jane@example.com");
    expect(screen.getByLabelText("contactInformation.pnr")).toHaveValue("19900101-1234");
  });

  it("renders submitted application status and hides updated time when it is null", () => {
    mockUseApplyPageData.mockReturnValue(
      Object.assign(createHookState(), {
        submittedApplication: {
          status: "accepted",
          createdAt: "not-a-valid-date",
          updatedAt: null,
        },
      }),
    );

    render(<ApplyPage />);

    expect(screen.getByText("applicationStatus.title")).toBeInTheDocument();
    expect(screen.getByText("applicationStatus.statuses.accepted")).toBeInTheDocument();
    expect(screen.getByText("not-a-valid-date")).toBeInTheDocument();
    expect(screen.queryByText("applicationStatus.updatedAtLabel")).not.toBeInTheDocument();
  });

  it("runs clearApplication and navigates home when cancel is clicked", async () => {
    const clearApplication = vi.fn().mockResolvedValue(undefined);
    mockUseApplyPageData.mockReturnValue(
      Object.assign(createHookState(), {
        clearApplication,
      }),
    );

    const user = userEvent.setup();
    render(<ApplyPage />);

    await user.click(screen.getByRole("button", { name: "cancelButton" }));

    await waitFor(() => {
      expect(clearApplication).toHaveBeenCalledTimes(1);
    });
    expect(window.alert).toHaveBeenCalledWith("cancelApplication");
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("uses onUnauthorized callback to alert, refresh auth and redirect", () => {
    const refreshAuth = vi.fn();
    mockUseAuth.mockReturnValue({
      status: AuthStatus.Authenticated,
      userData: null,
      refreshAuth,
    });

    render(<ApplyPage />);

    const firstCallArgs = mockUseApplyPageData.mock.calls[0][0];
    firstCallArgs.onUnauthorized();

    expect(window.alert).toHaveBeenCalledWith("errors.invalidSessionError");
    expect(refreshAuth).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith("/login");
  });
});
