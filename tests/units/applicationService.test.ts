import { beforeEach, describe, expect, it, vi } from "vitest";
import { getDatabaseClient, pool } from "@/lib/database";
import { logUserActivity } from "@/lib/logging";
import {
  deleteUserAvailability,
  deleteUserCompetence,
  getAllCompetences,
  getFullUserData,
  getSubmittedApplication,
  getUserAvailability,
  getUserCompetences,
  hasUnhandledApplication,
  insertUserAvailability,
  registerApplication,
  setUserCompetence,
  validateNoUnhandledApplication,
} from "@/server/services/applicationService";
import { ConflictingApplicationError } from "@/lib/errors/applicationErrors";
import { InvalidFormDataError } from "@/lib/errors/generalErrors";

vi.mock("@/lib/database", () => ({
  getDatabaseClient: vi.fn(),
  pool: {
    query: vi.fn(),
  },
}));

vi.mock("@/lib/logging", () => ({
  LogType: {
    INFO: "INFO",
    ERROR: "ERROR",
    DEBUG: "DEBUG",
  },
  logUserActivity: vi.fn(),
}));

type MockClient = {
  query: ReturnType<typeof vi.fn>;
  release: ReturnType<typeof vi.fn>;
};

const mockedGetDatabaseClient = getDatabaseClient as unknown as ReturnType<typeof vi.fn>;
const mockedPoolQuery = pool.query as unknown as ReturnType<typeof vi.fn>;
const mockedLogUserActivity = logUserActivity as unknown as ReturnType<typeof vi.fn>;

const makeMockClient = (): MockClient => ({
  query: vi.fn(),
  release: vi.fn(),
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("applicationService", () => {
  it("registerApplication throws ConflictingApplicationError when user has unhandled application", async () => {
    const client = makeMockClient();
    const request = new Request("http://localhost/");
    client.query.mockResolvedValueOnce({}).mockResolvedValueOnce({ rowCount: 0, rows: [] }).mockResolvedValueOnce({});
    mockedGetDatabaseClient.mockResolvedValueOnce(client);

    await expect(registerApplication(5, request)).rejects.toBeInstanceOf(ConflictingApplicationError);
    expect(client.query).toHaveBeenNthCalledWith(3, "ROLLBACK");
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it("registerApplication returns id on success", async () => {
    const client = makeMockClient();
    const request = new Request("http://localhost/");
    client.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ application_id: 77 }] })
      .mockResolvedValueOnce({});
    mockedGetDatabaseClient.mockResolvedValueOnce(client);

    const applicationID = await registerApplication(5, request);

    expect(applicationID).toBe(77);
    expect(mockedLogUserActivity).toHaveBeenCalledWith(client, "INFO", "SUBMIT_APPLICATION", expect.any(String), request, 5);
    expect(client.query).toHaveBeenNthCalledWith(1, "BEGIN");
    expect(client.query).toHaveBeenNthCalledWith(3, "COMMIT");
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it("validateNoUnhandledApplication throws when unhandled application exists", async () => {
    mockedPoolQuery.mockResolvedValueOnce({ rowCount: 1 });

    await expect(validateNoUnhandledApplication(10)).rejects.toBeInstanceOf(ConflictingApplicationError);
  });

  it("hasUnhandledApplication returns false when none exist", async () => {
    mockedPoolQuery.mockResolvedValueOnce({ rowCount: 0 });

    const hasUnhandled = await hasUnhandledApplication(10);

    expect(hasUnhandled).toBe(false);
  });

  it("validateNoUnhandledApplication does not throw when no unhandled application exists", async () => {
    mockedPoolQuery.mockResolvedValueOnce({ rowCount: 0 });

    await expect(validateNoUnhandledApplication(10)).resolves.toBeUndefined();
  });

  it("insertUserAvailability returns inserted availability id", async () => {
    const client = makeMockClient();
    const request = new Request("http://localhost/");
    client.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rowCount: 1, rows: [{ availability_id: 12 }] })
      .mockResolvedValueOnce({});
    mockedGetDatabaseClient.mockResolvedValueOnce(client);

    const availabilityID = await insertUserAvailability(3, { fromDate: "2026-01-01", toDate: "2026-01-31" }, request);

    expect(availabilityID).toBe(12);
    expect(mockedLogUserActivity).toHaveBeenCalledWith(client, "INFO", "INSERT_USER_AVAILABILITY", expect.any(String), request, 3);
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it("deleteUserCompetence throws InvalidFormDataError when nothing is deleted", async () => {
    const client = makeMockClient();
    const request = new Request("http://localhost/");
    client.query.mockResolvedValueOnce({}).mockResolvedValueOnce({ rowCount: 0 }).mockResolvedValueOnce({});
    mockedGetDatabaseClient.mockResolvedValueOnce(client);

    await expect(deleteUserCompetence(2, 99, request)).rejects.toBeInstanceOf(InvalidFormDataError);
    expect(mockedLogUserActivity).toHaveBeenCalledWith(client, "INFO", "DELETE_USER_COMPETENCE", expect.any(String), request, 2);
    expect(client.query).toHaveBeenNthCalledWith(3, "ROLLBACK");
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it("getFullUserData returns user data", async () => {
    const client = makeMockClient();
    const request = new Request("http://localhost/");
    const row = {
      id: 4,
      username: "test",
      roleID: 1,
      email: "test@test.com",
      firstName: "test",
      lastName: "test",
      pnr: "20000101-1234",
    };
    client.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [row] })
      .mockResolvedValueOnce({});
    mockedGetDatabaseClient.mockResolvedValueOnce(client);

    const userData = await getFullUserData(4, request);

    expect(userData).toEqual(row);
    expect(mockedLogUserActivity).toHaveBeenCalledWith(client, "INFO", "FETCH_FULL_USER_DATA", expect.any(String), request, 4);
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it("getUserAvailability returns availability rows", async () => {
    const rows = [{ availabilityID: 1, fromDate: "2026-01-01", toDate: "2026-01-31" }];
    mockedPoolQuery.mockResolvedValueOnce({ rows });

    const availability = await getUserAvailability(4);

    expect(availability).toEqual(rows);
    expect(mockedPoolQuery).toHaveBeenCalledWith(expect.stringContaining("FROM availability"), [4]);
  });

  it("getUserCompetences returns competence rows", async () => {
    const client = makeMockClient();
    const request = new Request("http://localhost/");
    const rows = [{ id: 1, name: "ticket sales", yearsOfExperience: 2, competenceProfileID: 10 }];
    client.query.mockResolvedValueOnce({}).mockResolvedValueOnce({ rows }).mockResolvedValueOnce({});
    mockedGetDatabaseClient.mockResolvedValueOnce(client);

    const competences = await getUserCompetences(4, request);

    expect(competences).toEqual(rows);
    expect(mockedLogUserActivity).toHaveBeenCalledWith(client, "INFO", "FETCH_USER_COMPETENCES", expect.any(String), request, 4);
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it("setUserCompetence commits on success", async () => {
    const client = makeMockClient();
    const request = new Request("http://localhost/");
    client.query.mockResolvedValueOnce({}).mockResolvedValueOnce({ rowCount: 1 }).mockResolvedValueOnce({});
    mockedGetDatabaseClient.mockResolvedValueOnce(client);

    await setUserCompetence(3, { competenceID: 2, yearsOfExperience: 5 }, request);

    expect(mockedLogUserActivity).toHaveBeenCalledWith(client, "INFO", "SET_USER_COMPETENCE", expect.any(String), request, 3);
    expect(client.query).toHaveBeenNthCalledWith(3, "COMMIT");
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it("deleteUserAvailability throws InvalidFormDataError when nothing is deleted", async () => {
    const client = makeMockClient();
    const request = new Request("http://localhost/");
    client.query.mockResolvedValueOnce({}).mockResolvedValueOnce({ rowCount: 0 }).mockResolvedValueOnce({});
    mockedGetDatabaseClient.mockResolvedValueOnce(client);

    await expect(deleteUserAvailability(2, 99, request)).rejects.toBeInstanceOf(InvalidFormDataError);
    expect(mockedLogUserActivity).toHaveBeenCalledWith(client, "INFO", "DELETE_USER_AVAILABILITY", expect.any(String), request, 2);
    expect(client.query).toHaveBeenNthCalledWith(3, "ROLLBACK");
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it("getAllCompetences returns localized competence rows", async () => {
    const rows = [{ id: 1, name: "Biljettförsäljning" }];
    mockedPoolQuery.mockResolvedValueOnce({ rows });

    const competences = await getAllCompetences("sv");

    expect(competences).toEqual(rows);
    expect(mockedPoolQuery).toHaveBeenCalledWith(expect.stringContaining("FROM competence c"), ["sv"]);
  });

  it("getSubmittedApplication returns null when user has no applications", async () => {
    const client = makeMockClient();
    client.query.mockResolvedValueOnce({ rows: [] });
    mockedGetDatabaseClient.mockResolvedValueOnce(client);

    const application = await getSubmittedApplication(4);

    expect(application).toBeNull();
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it("getSubmittedApplication returns latest application when one exists", async () => {
    const client = makeMockClient();
    const row = { status: "unhandled", createdAt: new Date(), updatedAt: new Date() };
    client.query.mockResolvedValueOnce({ rows: [row] });
    mockedGetDatabaseClient.mockResolvedValueOnce(client);

    const application = await getSubmittedApplication(4);

    expect(application).toEqual(row);
    expect(client.release).toHaveBeenCalledTimes(1);
  });
});
