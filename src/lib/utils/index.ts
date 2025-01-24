export const previewBlob = (blob: Blob) => {
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
};

// Convert Buffer/ArrayBuffer to hex string for BYTEA
export const bufferToHex = (buffer: Buffer) => "\\x" + buffer.toString("hex");

export const hexToBuffer = (hex: string): Uint8Array => {
  if (!hex.startsWith("\\x")) {
    throw new Error("Invalid hex string format - must start with \\x");
  }
  // Ignore the TS error - it's fine
  return new Uint8Array(Buffer.from(hex.slice(2), "hex"));
};

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("AppStorage", 3);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("documents")) {
        db.createObjectStore("documents", { keyPath: "id" });
      }
    };
  });
};

export const storeDocument = async (
  document: StoredDocument
): Promise<void> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["documents"], "readwrite");
    const store = transaction.objectStore("documents");
    const request = store.put(document);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
};

export const getStoredDocument = async (
  id: string
): Promise<StoredDocument | null> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["documents"], "readonly");
    const store = transaction.objectStore("documents");
    const request = store.get(id);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
};

export const getAllStoredDocuments = async (): Promise<StoredDocument[]> => {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(["documents"], "readonly");
    const store = transaction.objectStore("documents");
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
};
