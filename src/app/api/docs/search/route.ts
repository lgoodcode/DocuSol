import path from "path";
import { Database } from "sqlite3";
import { captureException } from "@sentry/nextjs";

// Types
type DocumentRow = {
  id: number;
  unsigned_hash: string;
  signed_hash: string | null;
  password: string | null;
  created_at: number;
  unsigned_transaction_signature: string | null;
  signed_transaction_signature: string | null;
  unsigned_document: Buffer;
  signed_document: Buffer | null;
  original_filename: string;
  is_signed: boolean;
  signed_at: number | null;
};

const dbPath = path.join(process.cwd(), "db", "documents.db");

/**
 * Initializes and returns a new SQLite database connection
 *
 * @returns Promise<Database> The database connection
 * @throws Error if database connection fails
 */
function initializeDatabase(): Promise<Database> {
  return new Promise((resolve, reject) => {
    const db = new Database(dbPath, (err) => {
      if (err) {
        captureException(err);
        reject(new Error("Failed to connect to database"));
      }
    });

    db.serialize(() => {
      db.run(`
        CREATE TABLE IF NOT EXISTS documents (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          unsigned_hash TEXT NOT NULL UNIQUE,
          signed_hash TEXT UNIQUE,
          password TEXT,
          created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
          unsigned_transaction_signature TEXT,
          signed_transaction_signature TEXT,
          unsigned_document BLOB NOT NULL,
          signed_document BLOB,
          original_filename TEXT NOT NULL,
          is_signed BOOLEAN DEFAULT FALSE,
          signed_at INTEGER
        )
      `);
    });

    resolve(db);
  });
}

/**
 * Checks if a document exists in the database
 *
 * @param db - The database connection
 * @param hash - The document hash to check
 * @returns Promise<DocumentRow | undefined>
 * @throws Error if database query fails
 */
async function checkDocumentExists(
  db: Database,
  hash: string
): Promise<DocumentRow | undefined> {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT * FROM documents WHERE unsigned_hash = ? OR signed_hash = ?",
      [hash, hash],
      (err, row) => {
        if (err) {
          captureException(err);
          reject(new Error("Failed to check document existence"));
        }
        resolve(row as DocumentRow | undefined);
      }
    );
  });
}

/**
 * Inserts a new document into the database
 *
 * @param db - The database connection
 * @param hash - The document hash
 * @param password - Optional password for the document
 * @param transactionSignature - The transaction signature
 * @param documentBuffer - The document buffer
 * @param originalFilename - The original filename
 * @returns Promise<number> The ID of the inserted document
 * @throws Error if insertion fails
 */
async function insertDocument(
  db: Database,
  hash: string,
  password: string | null,
  transactionSignature: string,
  documentBuffer: Buffer,
  originalFilename: string
): Promise<number> {
  return new Promise((resolve, reject) => {
    const currentEpoch = Math.floor(Date.now() / 1000);
    db.run(
      `INSERT INTO documents (
        unsigned_hash,
        password,
        unsigned_transaction_signature,
        unsigned_document,
        original_filename,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        hash,
        password,
        transactionSignature,
        documentBuffer,
        originalFilename,
        currentEpoch,
      ],
      function (err) {
        if (err) {
          captureException(err);
          reject(new Error("Failed to insert document"));
        }
        resolve(this.lastID);
      }
    );
  });
}

/**
 * Updates a document with signature information
 *
 * @param db - The database connection
 * @param unsignedHash - The original document hash
 * @param signedHash - The signed document hash
 * @param transactionSignature - The transaction signature
 * @param signedDocumentBuffer - The signed document buffer
 * @returns Promise<number> The number of affected rows
 * @throws Error if update fails
 */
async function updateDocumentSignature(
  db: Database,
  unsignedHash: string,
  signedHash: string,
  transactionSignature: string,
  signedDocumentBuffer: Buffer
): Promise<number> {
  return new Promise((resolve, reject) => {
    const currentEpoch = Math.floor(Date.now() / 1000);
    db.run(
      `UPDATE documents
       SET is_signed = TRUE,
           signed_hash = ?,
           signed_transaction_signature = ?,
           signed_document = ?,
           signed_at = ?
       WHERE unsigned_hash = ?`,
      [
        signedHash,
        transactionSignature,
        signedDocumentBuffer,
        currentEpoch,
        unsignedHash,
      ],
      function (err) {
        if (err) {
          captureException(err);
          reject(new Error("Failed to update document signature"));
        }
        resolve(this.changes);
      }
    );
  });
}

/**
 * Retrieves a document from the database
 *
 * @param db - The database connection
 * @param hash - The document hash
 * @param isSigned - Whether to retrieve the signed or unsigned version
 * @returns Promise<Pick<DocumentRow, 'unsigned_document' | 'signed_document' | 'original_filename' | 'password'> | undefined>
 * @throws Error if retrieval fails
 */
async function getDocument(
  db: Database,
  hash: string,
  isSigned = false
): Promise<
  | Pick<
      DocumentRow,
      "unsigned_document" | "signed_document" | "original_filename" | "password"
    >
  | undefined
> {
  return new Promise((resolve, reject) => {
    const field = isSigned ? "signed_document" : "unsigned_document";
    const hashField = isSigned ? "signed_hash" : "unsigned_hash";

    db.get(
      `SELECT ${field}, original_filename, password FROM documents WHERE ${hashField} = ?`,
      [hash],
      (err, row) => {
        if (err) {
          captureException(err);
          reject(new Error("Failed to retrieve document"));
        }
        resolve(
          row as
            | Pick<
                DocumentRow,
                | "unsigned_document"
                | "signed_document"
                | "original_filename"
                | "password"
              >
            | undefined
        );
      }
    );
  });
}

/**
 * Closes the database connection
 *
 * @param db - The database connection to close
 * @throws Error if closing fails
 */
async function closeDatabase(db: Database): Promise<void> {
  return new Promise((resolve, reject) => {
    db.close((err) => {
      if (err) {
        captureException(err);
        reject(new Error("Failed to close database connection"));
      }
      resolve();
    });
  });
}

export {
  initializeDatabase,
  checkDocumentExists,
  insertDocument,
  updateDocumentSignature,
  getDocument,
  closeDatabase,
  dbPath,
  type DocumentRow,
};
