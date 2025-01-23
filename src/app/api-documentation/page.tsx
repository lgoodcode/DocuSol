import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import "./docs.css";

export const metadata: Metadata = {
  title: "API Documentation | Document Management",
  description:
    "Documentation for the Document Management API including endpoints, database schema, and utilities",
};

const CodeBlock = ({
  title,
  children,
}: {
  title: string;
  children: string;
}) => (
  <div className="code-container">
    <div className="code-header">
      {title}
      <button className="copy-button">Copy</button>
    </div>
    <pre className="code-content">
      <code>{children}</code>
    </pre>
  </div>
);

const dbSchema = `CREATE TABLE documents (
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
);`;

const uploadExample = `// Using fetch API
const form = new FormData();
form.append('file', file);
form.append('password', password); // Optional

const response = await fetch('/api/docs/new', {
method: 'POST',
body: form
});`;

const searchExample = `const response = await fetch('/api/docs/search', {
method: 'POST',
headers: {
  'Content-Type': 'application/json'
},
body: JSON.stringify({
  hash: 'documentHash',
  password: 'optional'
})
});`;

const utilityExample = `// Send memo transaction
import { sendMemoTransaction } from './utils/solana';

const signature = await sendMemoTransaction('Your memo message');
console.log('Transaction Signature:', signature);`;

export default function DocsPage() {
  return (
    <main className="min-h-screen py-12 bg-background">
      <Link href="/">
        <div className="flex items-center gap-4 justify-center mb-16">
          <div className="w-[64px] h-[64px] md:w-[92px] md:h-[92px] xl:w-[108px] xl:h-[108px] flex items-center justify-center">
            <Image
              src="/img/docusol_icon.webp"
              alt="DocuSol Logo"
              width={120}
              height={48}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <h1 className="text-5xl lg:text-7xl font-bold bg-gradient-to-br from-primary to-black/45 dark:to-primary-foreground bg-clip-text text-transparent">
            DocuSol
          </h1>
        </div>
      </Link>

      <div className="container max-w-4xl mx-auto px-4">
        <h1 className="text-4xl text-center font-bold mb-6">
          📄 DocuSol API Documentation
        </h1>

        <p className="text-muted-foreground mb-12">
          Welcome to the DocuSol API documentation. This API allows you to
          manage documents, including uploading new documents, signing existing
          ones, and searching for documents based on their hashes. The system
          leverages SQLite for database management and the Solana blockchain for
          transaction handling.
        </p>

        <section className="mb-12" id="database-schema">
          <h2 className="text-2xl font-semibold mb-6">📚 Database Schema</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted border-b">
                  <th className="text-left p-4">Field</th>
                  <th className="text-left p-4">Type</th>
                  <th className="text-left p-4">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-4">id</td>
                  <td className="p-4">INTEGER PRIMARY KEY AUTOINCREMENT</td>
                  <td className="p-4">Unique identifier for each document.</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">unsigned_hash</td>
                  <td className="p-4">TEXT NOT NULL UNIQUE</td>
                  <td className="p-4">
                    SHA-256 hash of the unsigned document.
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">signed_hash</td>
                  <td className="p-4">TEXT UNIQUE</td>
                  <td className="p-4">SHA-256 hash of the signed document.</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">password</td>
                  <td className="p-4">TEXT</td>
                  <td className="p-4">
                    Password required to access the document, if any.
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">created_at</td>
                  <td className="p-4">
                    {`INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))`}
                  </td>
                  <td className="p-4">
                    Timestamp of when the document was created (Unix epoch).
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">unsigned_transaction_signature</td>
                  <td className="p-4">TEXT</td>
                  <td className="p-4">
                    Solana transaction signature for the unsigned document.
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">signed_transaction_signature</td>
                  <td className="p-4">TEXT</td>
                  <td className="p-4">
                    Solana transaction signature for the signed document.
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">unsigned_document</td>
                  <td className="p-4">BLOB NOT NULL</td>
                  <td className="p-4">Binary data of the unsigned document.</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">signed_document</td>
                  <td className="p-4">BLOB</td>
                  <td className="p-4">Binary data of the signed document.</td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">original_filename</td>
                  <td className="p-4">TEXT NOT NULL</td>
                  <td className="p-4">
                    Original filename of the uploaded document.
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="p-4">is_signed</td>
                  <td className="p-4">BOOLEAN DEFAULT FALSE</td>
                  <td className="p-4">
                    Indicates whether the document has been signed.
                  </td>
                </tr>
                <tr>
                  <td className="p-4">signed_at</td>
                  <td className="p-4">INTEGER</td>
                  <td className="p-4">
                    Timestamp of when the document was signed (Unix epoch).
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <CodeBlock title="documents Table Schema">{dbSchema}</CodeBlock>
        </section>

        <section className="mb-12" id="api-endpoints">
          <h2 className="text-2xl font-semibold mb-6">🚀 API Endpoints</h2>

          <div className="mb-8 border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-primary px-2 py-1 text-sm rounded text-primary-foreground">
                POST
              </span>
              <h3 className="text-xl font-medium">/api/docs/new</h3>
            </div>

            <p className="mb-4">Upload a new document to the system.</p>

            <h4 className="font-medium mt-6 mb-2">Request Parameters</h4>
            <p className="mb-2">
              <strong>Content-Type:</strong> <code>multipart/form-data</code>
            </p>
            <table className="w-full border-collapse mb-6">
              <thead>
                <tr className="bg-muted border-b">
                  <th className="text-left p-4">Parameter</th>
                  <th className="text-left p-4">Type</th>
                  <th className="text-left p-4">Description</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-4">file</td>
                  <td className="p-4">File</td>
                  <td className="p-4">The document file to upload</td>
                </tr>
                <tr>
                  <td className="p-4">password</td>
                  <td className="p-4">String (optional)</td>
                  <td className="p-4">Password to protect the document</td>
                </tr>
              </tbody>
            </table>

            <h4 className="font-medium mb-2">Response</h4>
            <p className="mb-2">
              <strong>Content-Type:</strong> <code>application/json</code>
            </p>
            <ul className="list-disc pl-6 mb-6">
              <li>
                <code>success</code> (Boolean): Indicates if the operation was
                successful
              </li>
              <li>
                <code>transactionUrl</code> (String): URL to view the Solana
                transaction on the explorer
              </li>
              <li>
                <code>hash</code> (String): SHA-256 hash of the uploaded
                document
              </li>
              <li>
                <code>error</code> (String): Error message, if any
              </li>
              <li>
                <code>message</code> (String): Detailed error message, if any
              </li>
            </ul>

            <CodeBlock title="New Document Upload Example">
              {uploadExample}
            </CodeBlock>
          </div>

          <div className="mb-8 border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-primary px-2 py-1 text-sm rounded text-primary-foreground">
                POST
              </span>
              <h3 className="text-xl font-medium">/api/docs/search</h3>
            </div>

            <p className="mb-4">Search for a document by its hash.</p>

            <h4 className="font-medium mt-6 mb-2">Request Parameters</h4>
            <p className="mb-2">
              <strong>Content-Type:</strong> <code>application/json</code>
            </p>
            <ul className="list-disc pl-6 mb-6">
              <li>
                <code>hash</code>{" "}
                <span className="text-xs bg-primary/10 px-2 py-1 rounded">
                  Required
                </span>
                : SHA-256 hash of the document to search for
              </li>
              <li>
                <code>password</code>{" "}
                <span className="text-xs bg-primary/10 px-2 py-1 rounded">
                  Optional
                </span>
                : Password for accessing the document, if protected
              </li>
            </ul>

            <CodeBlock title="Search Document Example">
              {searchExample}
            </CodeBlock>
          </div>

          <div className="mb-8 border rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="bg-primary px-2 py-1 text-sm rounded text-primary-foreground">
                POST
              </span>
              <h3 className="text-xl font-medium">/api/docs/sign</h3>
            </div>

            <p className="mb-4">Sign an existing document.</p>

            <h4 className="font-medium mt-6 mb-2">Request Parameters</h4>
            <p className="mb-2">
              <strong>Content-Type:</strong> <code>multipart/form-data</code>
            </p>
            <ul className="list-disc pl-6 mb-6">
              <li>
                <code>file</code>{" "}
                <span className="text-xs bg-primary/10 px-2 py-1 rounded">
                  Required
                </span>
                : The signed document file
              </li>
              <li>
                <code>hash</code>{" "}
                <span className="text-xs bg-primary/10 px-2 py-1 rounded">
                  Required
                </span>
                : SHA-256 hash of the unsigned document
              </li>
              <li>
                <code>password</code>{" "}
                <span className="text-xs bg-primary/10 px-2 py-1 rounded">
                  Optional
                </span>
                : Password for accessing the document, if protected
              </li>
            </ul>
          </div>
        </section>

        <section className="mb-12" id="utilities">
          <h2 className="text-2xl font-semibold mb-6">🔧 Utilities</h2>
          <CodeBlock title="Solana Transaction Utility">
            {utilityExample}
          </CodeBlock>
        </section>

        <section className="mb-12" id="error-codes">
          <h2 className="text-2xl font-semibold mb-6">⚠️ Error Codes</h2>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-muted border-b">
                <th className="text-left p-4">Status Code</th>
                <th className="text-left p-4">Description</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="p-4">400</td>
                <td className="p-4">
                  Bad Request - Invalid or missing input data
                </td>
              </tr>
              <tr className="border-b">
                <td className="p-4">401</td>
                <td className="p-4">Unauthorized - Authentication failed</td>
              </tr>
              <tr className="border-b">
                <td className="p-4">404</td>
                <td className="p-4">Not Found - Resource does not exist</td>
              </tr>
              <tr className="border-b">
                <td className="p-4">409</td>
                <td className="p-4">Conflict - Resource state conflict</td>
              </tr>
              <tr>
                <td className="p-4">500</td>
                <td className="p-4">Internal Server Error</td>
              </tr>
            </tbody>
          </table>
        </section>

        <footer className="text-center text-sm text-muted-foreground pt-8 border-t">
          <p>© 2025 Document Management API. All rights reserved.</p>
        </footer>
      </div>
    </main>
  );
}
