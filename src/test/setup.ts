import "@testing-library/jest-dom";
import { vi } from "vitest";
import { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("next-nprogress-bar", () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
  }),
}));

// Silence expected errors from the console
vi.stubGlobal("console", {
  ...console,
  error: vi.fn(),
});

// Mock FormData handling
vi.mock("next/server", async () => {
  const actual = await vi.importActual("next/server");
  return {
    ...actual,
    NextRequest: vi.fn().mockImplementation((url, init) => {
      return {
        ...new Request(url, init),
        formData: async () => init.body,
        headers: new Headers({
          "content-type":
            "multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW",
          ...init?.headers,
        }),
      };
    }),
  };
});

// Mock external dependencies
vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
}));

// Mock supabase
vi.mock("@/lib/supabase/server", () => ({
  createServerClient: createTypedSupabaseMock(),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: createTypedSupabaseMock(),
}));

export const createTypedSupabaseMock = () => {
  type TableName = keyof Database["public"]["Tables"];
  type Row<T extends TableName> = Database["public"]["Tables"][T]["Row"];

  const createMockQuery = <T>() => {
    const mockArrayResponse = Promise.resolve({ data: [] as T[], error: null });
    const mockSingleResponse = Promise.resolve({
      data: null as T | null,
      error: null,
    });

    const queryBuilder = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue(mockArrayResponse),
        neq: vi.fn().mockReturnValue(mockArrayResponse),
        gt: vi.fn().mockReturnValue(mockArrayResponse),
        lt: vi.fn().mockReturnValue(mockArrayResponse),
        gte: vi.fn().mockReturnValue(mockArrayResponse),
        lte: vi.fn().mockReturnValue(mockArrayResponse),
        like: vi.fn().mockReturnValue(mockArrayResponse),
        ilike: vi.fn().mockReturnValue(mockArrayResponse),
        is: vi.fn().mockReturnValue(mockArrayResponse),
        in: vi.fn().mockReturnValue(mockArrayResponse),
        contains: vi.fn().mockReturnValue(mockArrayResponse),
        containedBy: vi.fn().mockReturnValue(mockArrayResponse),
        range: vi.fn().mockReturnValue(mockArrayResponse),
        overlap: vi.fn().mockReturnValue(mockArrayResponse),
        match: vi.fn().mockReturnValue(mockArrayResponse),
        not: vi.fn().mockReturnValue(mockArrayResponse),
        or: vi.fn().mockReturnValue(mockArrayResponse),
        filter: vi.fn().mockReturnValue(mockArrayResponse),
        single: vi.fn().mockReturnValue(mockSingleResponse),
      }),
      insert: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue(mockSingleResponse),
      }),
      update: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue(mockSingleResponse),
        match: vi.fn().mockReturnValue(mockSingleResponse),
      }),
      delete: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue(mockSingleResponse),
        match: vi.fn().mockReturnValue(mockSingleResponse),
      }),
      upsert: vi.fn().mockReturnValue(mockSingleResponse),
    };

    return queryBuilder;
  };

  const mockAuthResponse = Promise.resolve({
    data: { user: null, session: null },
    error: null,
  });

  const mockClient = {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    from: <T extends TableName>(tableName: T) => createMockQuery<Row<T>>(),
    auth: {
      signUp: vi.fn().mockReturnValue(mockAuthResponse),
      signInWithPassword: vi.fn().mockReturnValue(mockAuthResponse),
      signInWithOAuth: vi.fn().mockReturnValue(mockAuthResponse),
      signOut: vi.fn().mockReturnValue(Promise.resolve({ error: null })),
      getSession: vi.fn().mockReturnValue(mockAuthResponse),
      getUser: vi.fn().mockReturnValue(mockAuthResponse),
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      onAuthStateChange: vi.fn().mockImplementation((callback) => ({
        data: { subscription: { unsubscribe: vi.fn() } },
        error: null,
      })),
    },
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi
          .fn()
          .mockReturnValue(
            Promise.resolve({ data: { path: "" }, error: null }),
          ),
        download: vi
          .fn()
          .mockReturnValue(Promise.resolve({ data: new Blob(), error: null })),
        remove: vi
          .fn()
          .mockReturnValue(Promise.resolve({ data: null, error: null })),
        list: vi
          .fn()
          .mockReturnValue(Promise.resolve({ data: [], error: null })),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: "" },
        }),
      }),
    },
  } as const;

  return mockClient as unknown as SupabaseClient<Database>;
};
