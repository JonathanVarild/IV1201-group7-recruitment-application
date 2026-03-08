import { beforeEach, describe, expect, it, vi } from "vitest";
import { createHash } from "crypto";
import { getDatabaseClient, pool } from "@/lib/database";
import { InvalidResetTokenError } from "@/lib/errors/resetCredentialErrors";
import { logUserActivity } from "@/lib/logging";
import { deleteHashedResetToken, getPersonIdByEmail, getUserIdByToken, saveHashedResetToken, validateResetToken } from "@/server/services/resetCredentialsService";

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

describe("resetCredentialsService", () => {
  it("getPersonIdByEmail logs success when user exists", async () => {
    const client = makeMockClient();
    const request = new Request("http://localhost/");
    client.query.mockResolvedValueOnce({ rows: [{ person_id: 123 }] });
    mockedGetDatabaseClient.mockResolvedValueOnce(client);

    const personID = await getPersonIdByEmail("known@example.com", request);

    expect(personID).toBe(123);
    expect(mockedLogUserActivity).toHaveBeenCalledWith(client, "INFO", "RESET_CREDENTIALS_EMAIL_LOOKUP_SUCCESS", expect.any(String), request, 123);
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it("getPersonIdByEmail logs failure when user is missing", async () => {
    const client = makeMockClient();
    const request = new Request("http://localhost/");
    client.query.mockResolvedValueOnce({ rows: [] });
    mockedGetDatabaseClient.mockResolvedValueOnce(client);

    const personID = await getPersonIdByEmail("missing@example.com", request);

    expect(personID).toBeUndefined();
    expect(mockedLogUserActivity).toHaveBeenCalledWith(client, "INFO", "RESET_CREDENTIALS_EMAIL_LOOKUP_FAILED", expect.any(String), request, undefined);
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it("saveHashedResetToken logs success when token is created", async () => {
    const client = makeMockClient();
    const request = new Request("http://localhost/");
    client.query.mockResolvedValue({});
    mockedGetDatabaseClient.mockResolvedValueOnce(client);

    await saveHashedResetToken("hashed-token", 5, request);

    expect(client.query).toHaveBeenNthCalledWith(1, "BEGIN");
    expect(client.query).toHaveBeenNthCalledWith(2, expect.stringContaining("INSERT INTO password_reset_token"), [5, "hashed-token"]);
    expect(client.query).toHaveBeenNthCalledWith(3, "COMMIT");
    expect(mockedLogUserActivity).toHaveBeenCalledWith(client, "INFO", "RESET_CREDENTIALS_TOKEN_CREATED", expect.any(String), request, 5);
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it("saveHashedResetToken logs failure when token creation fails", async () => {
    const client = makeMockClient();
    const request = new Request("http://localhost/");
    const queryError = new Error("insert failed");
    client.query.mockResolvedValueOnce({}).mockRejectedValueOnce(queryError).mockResolvedValueOnce({});
    mockedGetDatabaseClient.mockResolvedValueOnce(client);

    await expect(saveHashedResetToken("hashed-token", 5, request)).rejects.toThrow("insert failed");

    expect(client.query).toHaveBeenNthCalledWith(3, "ROLLBACK");
    expect(mockedLogUserActivity).toHaveBeenCalledWith(null, "ERROR", "RESET_CREDENTIALS_TOKEN_CREATE_FAILED", expect.any(String), request, 5);
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it("deleteHashedResetToken logs deleted when row exists", async () => {
    const client = makeMockClient();
    const request = new Request("http://localhost/");
    client.query.mockResolvedValueOnce({}).mockResolvedValueOnce({ rowCount: 1 }).mockResolvedValueOnce({});
    mockedGetDatabaseClient.mockResolvedValueOnce(client);

    await deleteHashedResetToken(7, request);

    expect(mockedLogUserActivity).toHaveBeenCalledWith(client, "INFO", "RESET_CREDENTIALS_TOKEN_DELETED", expect.any(String), request, 7);
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it("deleteHashedResetToken logs miss when no row exists", async () => {
    const client = makeMockClient();
    const request = new Request("http://localhost/");
    client.query.mockResolvedValueOnce({}).mockResolvedValueOnce({ rowCount: 0 }).mockResolvedValueOnce({});
    mockedGetDatabaseClient.mockResolvedValueOnce(client);

    await deleteHashedResetToken(7, request);

    expect(mockedLogUserActivity).toHaveBeenCalledWith(client, "INFO", "RESET_CREDENTIALS_TOKEN_DELETE_MISS", expect.any(String), request, 7);
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it("deleteHashedResetToken logs failure when deletion fails", async () => {
    const client = makeMockClient();
    const request = new Request("http://localhost/");
    const queryError = new Error("delete failed");
    client.query.mockResolvedValueOnce({}).mockRejectedValueOnce(queryError).mockResolvedValueOnce({});
    mockedGetDatabaseClient.mockResolvedValueOnce(client);

    await expect(deleteHashedResetToken(7, request)).rejects.toThrow("delete failed");

    expect(client.query).toHaveBeenNthCalledWith(3, "ROLLBACK");
    expect(mockedLogUserActivity).toHaveBeenCalledWith(null, "ERROR", "RESET_CREDENTIALS_TOKEN_DELETE_FAILED", expect.any(String), request, 7);
    expect(client.release).toHaveBeenCalledTimes(1);
  });

  it("validateResetToken logs success when token exists", async () => {
    const token = "test-token";
    const request = new Request("http://localhost/");
    const hashedToken = createHash("sha256").update(token).digest("hex");
    mockedPoolQuery.mockResolvedValueOnce({ rows: [{ token_id: 42 }] });

    const tokenID = await validateResetToken(token, request);

    expect(tokenID).toBe(42);
    expect(mockedPoolQuery).toHaveBeenCalledWith(expect.stringContaining("SELECT token_id FROM password_reset_token"), [hashedToken]);
    expect(mockedLogUserActivity).toHaveBeenCalledWith(null, "INFO", "RESET_CREDENTIALS_TOKEN_VALIDATED", expect.any(String), request);
  });

  it("validateResetToken logs failure when token is missing/expired", async () => {
    const request = new Request("http://localhost/");
    mockedPoolQuery.mockResolvedValueOnce({ rows: [] });

    await expect(validateResetToken("missing", request)).rejects.toBeInstanceOf(InvalidResetTokenError);
    expect(mockedLogUserActivity).toHaveBeenCalledWith(null, "INFO", "RESET_CREDENTIALS_TOKEN_VALIDATION_FAILED", expect.any(String), request);
  });

  it("getUserIdByToken logs success when token exists", async () => {
    const token = "test-token";
    const request = new Request("http://localhost/");
    const hashedToken = createHash("sha256").update(token).digest("hex");
    mockedPoolQuery.mockResolvedValueOnce({ rows: [{ person_id: 99 }] });

    const userID = await getUserIdByToken(token, request);

    expect(userID).toBe(99);
    expect(mockedPoolQuery).toHaveBeenCalledWith(expect.stringContaining("SELECT person_id FROM password_reset_token"), [hashedToken]);
    expect(mockedLogUserActivity).toHaveBeenCalledWith(null, "INFO", "RESET_CREDENTIALS_USER_LOOKUP_BY_TOKEN_SUCCESS", expect.any(String), request, 99);
  });

  it("getUserIdByToken logs failure when token is missing or expired", async () => {
    const request = new Request("http://localhost/");
    mockedPoolQuery.mockResolvedValueOnce({ rows: [] });

    await expect(getUserIdByToken("missing", request)).rejects.toBeInstanceOf(InvalidResetTokenError);
    expect(mockedLogUserActivity).toHaveBeenCalledWith(null, "INFO", "RESET_CREDENTIALS_USER_LOOKUP_BY_TOKEN_FAILED", expect.any(String), request);
  });
});
