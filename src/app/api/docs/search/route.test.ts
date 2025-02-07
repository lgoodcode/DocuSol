/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, expect, it, vi, beforeEach } from "vitest";

import { createServerClient } from "@/lib/supabase/server";
import { getHashFromTransactionSignature } from "@/lib/utils/solana";

import { POST } from "./route";

const TEST_SIGNATURE =
  "4r7MBNRG1Z6eXXJt2danToeXX2BYRVU3G4pDBgTnh9nou8xQ47RibdkriDiMTRJoxhkjccCchUiSALYzm4ov67Re";

vi.mock("@/lib/utils/solana", () => ({
  getHashFromTransactionSignature: vi.fn().mockResolvedValue("a".repeat(64)),
  isTransactionSignature: vi
    .fn()
    .mockImplementation((val) => val === TEST_SIGNATURE),
}));

const mockDocument: DocumentDetails = {
  id: "doc-1",
  name: "Test Document",
  created_at: "2024-01-01T00:00:00Z",
  unsigned_hash: "a".repeat(64),
  signed_hash: "b".repeat(64),
  password: false,
};

const createTestRequest = (body: object) => {
  const request = new Request("http://localhost/api/docs/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  return request;
};

describe("POST /api/docs/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock successful database response
    vi.mocked(createServerClient).mockResolvedValue({
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      or: vi.fn().mockResolvedValue({
        data: [mockDocument],
        error: null,
      }),
    } as unknown as any);
  });

  it("should successfully find document by hash", async () => {
    const request = createTestRequest({ value: TEST_SIGNATURE });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      ...mockDocument,
      password: false,
    });
  });

  it("should successfully find document by transaction signature", async () => {
    const request = createTestRequest({ value: TEST_SIGNATURE });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      ...mockDocument,
      password: false,
    });
  });

  it("should return 400 for missing value", async () => {
    const request = createTestRequest({});
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Missing required field: value");
  });

  it("should return 400 for invalid hash format", async () => {
    const request = createTestRequest({ value: "invalid-hash" });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe(
      "Invalid value: must be a valid hash or transaction signature",
    );
  });

  it("should return 400 for invalid transaction signature", async () => {
    vi.mocked(getHashFromTransactionSignature).mockResolvedValue(null);

    const request = createTestRequest({ value: "5".repeat(87) });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe(
      "Invalid value: must be a valid hash or transaction signature",
    );
  });

  it("should return 404 when document not found", async () => {
    vi.mocked(createServerClient).mockResolvedValue({
      from: () => ({
        select: () => ({
          or: () => ({
            data: [],
            error: null,
          }),
        }),
      }),
    } as unknown as any);

    const request = createTestRequest({ value: "a".repeat(64) });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Document not found");
  });

  it("should return 401 when password is required but not provided", async () => {
    vi.mocked(createServerClient).mockResolvedValue({
      from: () => ({
        select: () => ({
          or: () => ({
            data: [{ ...mockDocument, password: "secret" }],
            error: null,
          }),
        }),
      }),
    } as unknown as any);

    const request = createTestRequest({ value: "a".repeat(64) });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Password required for this document");
  });

  it("should return 403 when password is incorrect", async () => {
    vi.mocked(createServerClient).mockResolvedValue({
      from: () => ({
        select: () => ({
          or: () => ({
            data: [{ ...mockDocument, password: "secret" }],
            error: null,
          }),
        }),
      }),
    } as unknown as any);

    const request = createTestRequest({
      value: "a".repeat(64),
      password: "wrong",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe("Invalid password");
  });

  it("should return 500 on database error", async () => {
    vi.mocked(createServerClient).mockResolvedValue({
      from: () => ({
        select: () => ({
          or: () => ({
            data: null,
            error: { message: "Fetch failed" },
          }),
        }),
      }),
    } as unknown as any);

    const request = createTestRequest({ value: "a".repeat(64) });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Database error: Fetch failed");
  });
});
