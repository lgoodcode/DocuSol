/* eslint-disable @typescript-eslint/no-explicit-any */

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

// Set up globals
global.FormData = MockFormData as any;
global.Blob = MockBlob as any;
global.File = MockFile as any;
