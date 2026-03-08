import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcrypt";
import { getDatabaseClient } from "@/lib/database";
import { generateSession, getAuthenticatedUserData } from "@/lib/session";
import { logUserActivity } from "@/lib/logging";
import { authenticateUser, registerUser, requireRecruiter } from "@/server/services/authenticationService";
import { UnauthorizedError, InvalidCredentialsError } from "@/lib/errors/authErrors";
import { InvalidFormDataError } from "@/lib/errors/generalErrors";

vi.mock("@/lib/database", () => ({
  getDatabaseClient: vi.fn(),
}));

vi.mock("@/lib/session", () => ({
  generateSession: vi.fn(),
  getAuthenticatedUserData: vi.fn(),
}));

vi.mock("@/lib/logging", () => ({
  LogType: {
    INFO: "INFO",
    ERROR: "ERROR",
    DEBUG: "DEBUG",
  },
  logUserActivity: vi.fn(),
}));

vi.mock("bcrypt", () => ({
  default: {
    hashSync: vi.fn(),
    compare: vi.fn(),
  },
}));

type MockClient = {
  query: ReturnType<typeof vi.fn>;
  release: ReturnType<typeof vi.fn>;
};

const mockedGetDatabaseClient = getDatabaseClient as unknown as ReturnType<typeof vi.fn>;
const mockedGenerateSession = generateSession as unknown as ReturnType<typeof vi.fn>;
const mockedGetAuthenticatedUserData = getAuthenticatedUserData as unknown as ReturnType<typeof vi.fn>;
const mockedLogUserActivity = logUserActivity as unknown as ReturnType<typeof vi.fn>;
const mockedHashSync = bcrypt.hashSync as unknown as ReturnType<typeof vi.fn>;
const mockedCompare = bcrypt.compare as unknown as ReturnType<typeof vi.fn>;

const makeMockClient = (): MockClient => ({
  query: vi.fn(),
  release: vi.fn(),
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("authenticationService", () => {
  it("requireRecruiter returns authenticated recruiter", async () => {
    const user = { id: 1, username: "", roleID: 2, role: "recruiter" };
    mockedGetAuthenticatedUserData.mockResolvedValueOnce(user);

    await expect(requireRecruiter()).resolves.toEqual(user);
  });

  it("requireRecruiter throws UnauthorizedError for non-recruiter", async () => {
    mockedGetAuthenticatedUserData.mockResolvedValueOnce({ id: 1, username: "", roleID: 1, role: "applicant" });

    await expect(requireRecruiter()).rejects.toBeInstanceOf(UnauthorizedError);
  });

  it("registerUser throws InvalidFormDataError for invalid payload", async () => {
    const request = new Request("http://localhost/");

    await expect(registerUser({} as never, request)).rejects.toBeInstanceOf(InvalidFormDataError);
  });

  it("registerUser returns user and session data on success", async () => {
    const client = makeMockClient();
    const request = new Request("http://localhost/");
    const expiresAt = new Date();

    mockedHashSync.mockReturnValueOnce("hashed-password");
    mockedGenerateSession.mockReturnValueOnce({
      token: "plain-token",
      tokenHash: "hashed-token",
      expiresAt,
    });
    client.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ person_id: 11 }] })
      .mockResolvedValueOnce({ rows: [{ session_id: 22 }] })
      .mockResolvedValueOnce({});
    mockedGetDatabaseClient.mockResolvedValueOnce(client);

    const result = await registerUser(
      {
        name: "test",
        surname: "test",
        pnr: "20000101-1234",
        email: "test@test.com",
        password: "Qwerty123",
        username: "test",
      },
      request,
    );

    expect(result).toEqual({
      userID: 11,
      sessionData: {
        id: 22,
        personID: 11,
        token: "plain-token",
        expiresAt,
      },
    });
    expect(mockedLogUserActivity).toHaveBeenCalledWith(client, "INFO", "USER_SIGNUP", expect.any(String), request, 11);
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it("authenticateUser throws InvalidCredentialsError when user does not exist", async () => {
    const client = makeMockClient();
    const request = new Request("http://localhost/");
    client.query.mockResolvedValueOnce({}).mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({});
    mockedGetDatabaseClient.mockResolvedValueOnce(client);

    await expect(authenticateUser({ username: "missing", password: "password" }, request)).rejects.toBeInstanceOf(InvalidCredentialsError);
    expect(client.query).toHaveBeenNthCalledWith(3, "ROLLBACK");
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it("authenticateUser logs and throws InvalidCredentialsError on wrong password", async () => {
    const client = makeMockClient();
    const request = new Request("http://localhost/");

    client.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        rows: [
          {
            person_id: 7,
            password_hash: "stored-hash",
            username: "test",
            role_id: 1,
            role_name: "applicant",
          },
        ],
      })
      .mockResolvedValueOnce({});
    mockedCompare.mockResolvedValueOnce(false);
    mockedGetDatabaseClient.mockResolvedValueOnce(client);

    await expect(authenticateUser({ username: "test", password: "wrong" }, request)).rejects.toBeInstanceOf(InvalidCredentialsError);
    expect(mockedLogUserActivity).toHaveBeenCalledWith(client, "INFO", "USER_LOGIN_FAILED", expect.any(String), request, 7);
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it("authenticateUser returns user data and session data on success", async () => {
    const client = makeMockClient();
    const request = new Request("http://localhost/");
    const expiresAt = new Date("");

    client.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({
        rows: [
          {
            person_id: 7,
            password_hash: "stored-hash",
            username: "test",
            role_id: "1",
            role_name: "applicant",
          },
        ],
      })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ session_id: 44 }] })
      .mockResolvedValueOnce({});
    mockedCompare.mockResolvedValueOnce(true);
    mockedGenerateSession.mockReturnValueOnce({
      token: "session-token",
      tokenHash: "session-hash",
      expiresAt,
    });
    mockedGetDatabaseClient.mockResolvedValueOnce(client);

    const result = await authenticateUser({ username: "test", password: "correct" }, request);

    expect(result).toEqual({
      userData: {
        id: 7,
        username: "test",
        roleID: 1,
        role: "applicant",
      },
      sessionData: {
        id: 44,
        personID: 7,
        token: "session-token",
        expiresAt,
      },
    });
    expect(mockedLogUserActivity).toHaveBeenCalledWith(client, "INFO", "USER_LOGIN_SUCCESS", expect.any(String), request, 7);
    expect(client.release).toHaveBeenCalledTimes(1);
  });
});
