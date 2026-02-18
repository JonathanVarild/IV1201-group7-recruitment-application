import { beforeEach, describe, expect, it, vi } from "vitest";
import { authenticateUser, registerUser } from "../../server/services/authenticationService";
import { InvalidFormDataError } from "../../lib/errors/generalErrors";
import { ConflictingSignupDataError } from "../../lib/errors/signupErrors";
import { InvalidCredentialsError } from "../../lib/errors/authErrors";
import { DatabaseError } from "pg";
import type { SessionData } from "../../lib/types/sessionType";

type MockDbClient = {
  query: ReturnType<typeof vi.fn>;
  release: ReturnType<typeof vi.fn>;
};

const { getDatabaseClientMock, generateSessionMock, hashSyncMock, compareSyncMock } = vi.hoisted(() => ({
  getDatabaseClientMock: vi.fn(),
  generateSessionMock: vi.fn(),
  hashSyncMock: vi.fn(),
  compareSyncMock: vi.fn(),
}));

vi.mock("@/lib/database", () => ({
  getDatabaseClient: getDatabaseClientMock,
}));

vi.mock("@/lib/session", () => ({
  generateSession: generateSessionMock,
}));

vi.mock("bcrypt", () => ({
  default: {
    hashSync: hashSyncMock,
    compareSync: compareSyncMock,
  },
}));

describe("authenticationService", () => {
  let dbClient: MockDbClient;

  beforeEach(() => {
    vi.resetAllMocks();
    dbClient = {
      query: vi.fn(),
      release: vi.fn(),
    };
    getDatabaseClientMock.mockResolvedValue(dbClient);
  });

  describe("registerUser", () => {
    it("Throws InvalidFormDataError for invalid payloads", async () => {
      const invalidData = { name: "", password: "" } as unknown as {
        name: string;
        surname: string;
        pnr: string;
        email: string;
        username: string;
        password: string;
      };

      await expect(registerUser(invalidData)).rejects.toBeInstanceOf(InvalidFormDataError);
      expect(getDatabaseClientMock).not.toHaveBeenCalled();
    });

    it("Registers a new user and returns session data", async () => {
      const validUser = {
        name: "Test",
        surname: "User",
        pnr: "20260101-2384",
        email: "test@example.com",
        username: "testuser",
        password: "password123",
      };

      const session = {
        token: "token",
        tokenHash: "token-hash",
        expiresAt: new Date("2024-01-01T00:00:00.000Z"),
      };

      hashSyncMock.mockReturnValue("hashed-password");
      generateSessionMock.mockReturnValue(session);

      dbClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ person_id: 123 }] }) // INSERT person
        .mockResolvedValueOnce({ rows: [{ session_id: 456 }] }) // INSERT session
        .mockResolvedValueOnce({}); // COMMIT

      const result = await registerUser(validUser);

      expect(hashSyncMock).toHaveBeenCalledWith(validUser.password, 10);
      expect(generateSessionMock).toHaveBeenCalledTimes(1);
      expect(dbClient.query).toHaveBeenNthCalledWith(1, "BEGIN");
      expect(dbClient.query).toHaveBeenNthCalledWith(2, expect.stringContaining("INSERT INTO person"), [
        validUser.name,
        validUser.surname,
        validUser.pnr,
        validUser.email,
        "hashed-password",
        validUser.username,
      ]);
      expect(dbClient.query).toHaveBeenNthCalledWith(3, expect.stringContaining("INSERT INTO session"), [123, session.tokenHash, session.expiresAt]);
      expect(dbClient.query).toHaveBeenNthCalledWith(4, "COMMIT");
      expect(dbClient.release).toHaveBeenCalledTimes(1);

      expect(result.userID).toBe(123);
      expect(result.sessionData).toEqual<SessionData>({
        id: 456,
        personID: 123,
        token: session.token,
        expiresAt: session.expiresAt,
      });
    });

    it("rolls back and throws ConflictingSignupDataError on duplicate data", async () => {
      const validUser = {
        name: "Test",
        surname: "User",
        pnr: "20260101-2384",
        email: "test@example.com",
        username: "testuser",
        password: "password123",
      };

      const dbError = Object.assign(Object.create(DatabaseError.prototype), {
        code: "23505",
        message: "duplicate key",
      }) as DatabaseError;

      dbClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockRejectedValueOnce(dbError) // INSERT person fails
        .mockResolvedValueOnce({}); // ROLLBACK

      await expect(registerUser(validUser)).rejects.toBeInstanceOf(ConflictingSignupDataError);
      expect(dbClient.query).toHaveBeenCalledWith("ROLLBACK");
      expect(dbClient.release).toHaveBeenCalledTimes(1);
    });
  });

  // Code doesn't check if password or username or password is empty
  describe("authenticateUser", () => {
    it("Throws InvalidFormDataError for invalid payloads", async () => {
      const invalidCredentials = { username: "" } as unknown as {
        username: string;
        password: string;
      };

      await expect(authenticateUser(invalidCredentials)).rejects.toBeInstanceOf(InvalidFormDataError);
      expect(getDatabaseClientMock).not.toHaveBeenCalled();
    });

    it("Throws InvalidCredentialsError when user does not exist", async () => {
      const credentials = { username: "missing", password: "password123" };

      dbClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [] }); // SELECT user

      await expect(authenticateUser(credentials)).rejects.toBeInstanceOf(InvalidCredentialsError);
      expect(compareSyncMock).not.toHaveBeenCalled();
    });

    it("Throws InvalidCredentialsError when password does not match", async () => {
      const credentials = { username: "testuser", password: "wrong" };

      dbClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({
          rows: [
            {
              person_id: 42,
              password_hash: "stored-hash",
              username: "testuser",
              role_id: 2,
              role_name: "applicant",
            },
          ],
        });

      compareSyncMock.mockReturnValue(false);

      await expect(authenticateUser(credentials)).rejects.toBeInstanceOf(InvalidCredentialsError);
      expect(compareSyncMock).toHaveBeenCalledWith(credentials.password, "stored-hash");
      expect(dbClient.query).toHaveBeenCalledTimes(2);
    });

    it("Authenticates and returns user data with session data", async () => {
      const credentials = { username: "testuser", password: "password123" };
      const session = {
        token: "token",
        tokenHash: "token-hash",
        expiresAt: new Date("2024-01-01T00:00:00.000Z"),
      };

      dbClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({
          rows: [
            {
              person_id: 42,
              password_hash: "stored-hash",
              username: "testuser",
              role_id: 2,
              role_name: "applicant",
            },
          ],
        })
        .mockResolvedValueOnce({ rows: [{ session_id: 99 }] }) // INSERT session
        .mockResolvedValueOnce({}); // COMMIT

      compareSyncMock.mockReturnValue(true);
      generateSessionMock.mockReturnValue(session);

      const result = await authenticateUser(credentials);

      expect(compareSyncMock).toHaveBeenCalledWith(credentials.password, "stored-hash");
      expect(generateSessionMock).toHaveBeenCalledTimes(1);
      expect(dbClient.query).toHaveBeenNthCalledWith(1, "BEGIN");
      expect(dbClient.query).toHaveBeenNthCalledWith(2, expect.stringContaining("SELECT"), [credentials.username]);
      expect(dbClient.query).toHaveBeenNthCalledWith(3, expect.stringContaining("INSERT INTO session"), [42, session.tokenHash, session.expiresAt]);
      expect(dbClient.query).toHaveBeenNthCalledWith(4, "COMMIT");
      expect(dbClient.release).toHaveBeenCalledTimes(1);

      expect(result.userData).toEqual({
        id: 42,
        username: "testuser",
        roleID: 2,
        role: "applicant",
      });
      expect(result.sessionData).toEqual<SessionData>({
        id: 99,
        personID: 42,
        token: session.token,
        expiresAt: session.expiresAt,
      });
    });
  });
});
