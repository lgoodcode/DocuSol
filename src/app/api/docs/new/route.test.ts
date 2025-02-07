/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest } from "next/server";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { MockFile } from "@/test/mocks";
import { createServerClient } from "@/lib/supabase/server";
import { getLatestBlockSlot, sendMemoTransaction } from "@/lib/utils/solana";

import { POST } from "./route";

vi.mock("@/lib/utils/solana", () => ({
  getLatestBlockSlot: vi.fn(),
  sendMemoTransaction: vi.fn(),
}));

describe("POST /api/docs/new", () => {
  const mockFile = new MockFile(["test"], "test.pdf", {
    type: "application/pdf",
  });
  const mockFormData = new FormData();

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default form data
    mockFormData.set("name", "Test Document");
    mockFormData.set("password", "test123");
    mockFormData.set("original_filename", "test.pdf");
    mockFormData.set("mime_type", "application/pdf");
    mockFormData.set("original_document", mockFile);
    mockFormData.set("unsigned_document", mockFile);

    // Mock default successful responses
    vi.mocked(getLatestBlockSlot).mockResolvedValue(123456);
    vi.mocked(sendMemoTransaction).mockResolvedValue("mock-tx-signature");
    vi.mocked(createServerClient).mockResolvedValue({
      from: () => ({
        insert: () => ({
          select: () => ({
            single: () => ({
              data: { id: "mock-id" },
              error: null,
            }),
          }),
        }),
      }),
    } as unknown as any);
  });

  it("should successfully process a valid document upload", async () => {
    const request = new NextRequest("http://localhost/api/docs/new", {
      method: "POST",
      body: mockFormData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({
      id: "mock-id",
      txSignature: "mock-tx-signature",
      unsignedHash: expect.any(String),
    });
  });

  it("should return 400 for invalid content type", async () => {
    const request = new NextRequest("http://localhost/api/docs/new", {
      method: "POST",
      body: JSON.stringify({}),
      headers: {
        "content-type": "application/json",
      },
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe(
      "Invalid content type. Expected multipart/form-data",
    );
  });

  it("should return 400 for missing required fields", async () => {
    const invalidFormData = new FormData();
    invalidFormData.set("name", "Test Document");
    const request = new NextRequest("http://localhost/api/docs/new", {
      method: "POST",
      body: invalidFormData,
    });
    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBeTruthy();
  });

  it("should return 500 when transaction fails", async () => {
    vi.mocked(sendMemoTransaction).mockRejectedValue(
      new Error("Transaction failed"),
    );

    const request = new NextRequest("http://localhost/api/docs/new", {
      method: "POST",
      body: mockFormData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain("Transaction failed");
  });

  it("should return 500 on database operation errors", async () => {
    vi.mocked(createServerClient).mockResolvedValue({
      from: () => ({
        insert: () => ({
          select: () => ({
            single: () => ({
              error: new Error("Database error"),
            }),
          }),
        }),
      }),
    } as any);

    const request = new NextRequest("http://localhost/api/docs/new", {
      method: "POST",
      body: mockFormData,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toContain("Database error");
  });
});
