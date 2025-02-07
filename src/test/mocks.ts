/* eslint-disable @typescript-eslint/no-explicit-any */

import { vi } from "vitest";
import { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/lib/supabase/database";

export class MockFormData extends FormData {
  private data: Record<string, any> = {};

  append(key: string, value: any) {
    if (!this.data[key]) {
      this.data[key] = [];
    }
    this.data[key].push(value);
  }

  delete(key: string) {
    delete this.data[key];
  }

  get(key: string) {
    const values = this.data[key];
    return values ? values[0] : null;
  }

  getAll(key: string) {
    return this.data[key] || [];
  }

  has(key: string) {
    return key in this.data;
  }

  set(key: string, value: any) {
    this.data[key] = [value];
  }

  forEach(callback: (value: any, key: string, parent: FormData) => void) {
    Object.entries(this.data).forEach(([key, values]) => {
      values.forEach((value: any) => callback(value, key, this));
    });
  }

  entries() {
    const entries: [string, any][] = [];
    Object.entries(this.data).forEach(([key, values]) => {
      values.forEach((value: any) => entries.push([key, value]));
    });
    return entries[Symbol.iterator]();
  }

  keys() {
    return Object.keys(this.data)[Symbol.iterator]();
  }

  values() {
    const values: any[] = [];
    Object.values(this.data).forEach((valueArray) => {
      values.push(...valueArray);
    });
    return values[Symbol.iterator]();
  }
}

export class MockBlob extends Blob {
  private _size: number;
  private _type: string;

  constructor(content: any[], options: any = {}) {
    super(content, options);
    const buffer = Buffer.from(content.join(""));
    // @ts-expect-error - Length does exist
    this._size = buffer.length;
    this._type = options.type || "";
  }

  get size() {
    return this._size;
  }

  get type() {
    return this._type;
  }
}

export class MockFile extends File {
  private _name: string;
  private _lastModified: number;

  constructor(content: any[], filename: string, options: any = {}) {
    super(content, filename, options);
    this._name = filename;
    this._lastModified = options.lastModified || Date.now();
  }

  get name() {
    return this._name;
  }

  get lastModified() {
    return this._lastModified;
  }

  arrayBuffer() {
    return Promise.resolve(new ArrayBuffer(this.size));
  }
}

export const mockCreateClient = vi
  .fn()
  .mockImplementation(() => createTypedSupabaseMock());

export const mockCreateServerClient = vi
  .fn()
  .mockImplementation(() => Promise.resolve(createTypedSupabaseMock()));

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
