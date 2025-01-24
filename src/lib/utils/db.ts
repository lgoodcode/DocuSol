import { createServerClient } from "@/lib/supabase/server";
import { type Database } from "@/lib/supabase/database";

type Document = Database["public"]["Tables"]["documents"]["Row"];

/**
 * Checks if a document exists with the given hash
 *
 * @param hash - The document hash to check
 * @returns Promise resolving to the document if found, null otherwise
 * @throws {Error} If database query fails
 */
export async function checkDocumentExists(hash: string): Promise<boolean> {
  const supabase = await createServerClient();
  const { error, data } = await supabase
    .from("documents")
    .select("id")
    .or(`unsigned_hash.eq.${hash},signed_hash.eq.${hash}`)
    .single();

  if (error) throw new Error(`Failed to check document: ${error.message}`);
  return !!data;
}

/**
 * Inserts a new document into the database
 *
 * @param hash - The document's unsigned hash
 * @param password - Optional password for the document
 * @param transactionSignature - The transaction signature
 * @param documentBuffer - The document's binary data
 * @param originalFilename - The original filename
 * @returns Promise resolving to the inserted document's ID
 * @throws {Error} If document insertion fails
 */
export async function insertDocument(
  newDocument: InsertNewDocument
): Promise<string> {
  const supabase = await createServerClient();
  const { error, data } = await supabase
    .from("documents")
    .insert({
      name: newDocument.name,
      password: newDocument.password,
      unsigned_hash: newDocument.unsigned_hash,
      unsigned_transaction_signature:
        newDocument.unsigned_transaction_signature,
      original_document: newDocument.original_document,
      unsigned_document: newDocument.unsigned_document,
      original_filename: newDocument.original_filename,
      mime_type: newDocument.mime_type,
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to insert document: ${error.message}`);
  return data.id;
}

/**
 * Updates a document with its signed version
 *
 * @param unsignedHash - The original unsigned hash
 * @param signedHash - The new signed hash
 * @param transactionSignature - The transaction signature
 * @param signedDocumentBuffer - The signed document's binary data
 * @returns Promise resolving to the number of affected rows
 * @throws {Error} If document update fails
 */
export async function updateDocumentSignature(
  unsignedHash: string,
  signedHash: string,
  transactionSignature: string,
  signedDocumentBuffer: Buffer
): Promise<number> {
  const supabase = await createServerClient();
  const { error, count } = await supabase
    .from("documents")
    .update({
      is_signed: true,
      signed_hash: signedHash,
      signed_transaction_signature: transactionSignature,
      signed_document: signedDocumentBuffer.toString("base64"),
      signed_at: new Date().toISOString(),
    })
    .eq("unsigned_hash", unsignedHash);

  if (error)
    throw new Error(`Failed to update document signature: ${error.message}`);
  return count ?? 0;
}

/**
 * Retrieves a signed document with the given hash
 *
 * @param hash - The signed document hash to check
 * @returns Promise resolving to the document if found, null otherwise
 * @throws {Error} If database query fails
 */
export async function getSignedDocument(
  hash: string
): Promise<Document | null> {
  const supabase = await createServerClient();
  const { error, data } = await supabase
    .from("documents")
    .select("*")
    .eq("signed_hash", hash)
    .single();

  if (error) throw new Error(`Failed to get signed document: ${error.message}`);
  return data;
}

/**
 * Retrieves an unsigned document with the given hash
 *
 * @param hash - The unsigned document hash to check
 * @returns Promise resolving to the document if found, null otherwise
 * @throws {Error} If database query fails
 */
export async function getUnsignedDocument(
  hash: string
): Promise<Document | null> {
  const supabase = await createServerClient();
  const { error, data } = await supabase
    .from("documents")
    .select("*")
    .eq("unsigned_hash", hash)
    .single();

  if (error)
    throw new Error(`Failed to get unsigned document: ${error.message}`);
  return data;
}

export async function removeDocument(id: string): Promise<number> {
  const supabase = await createServerClient();
  const { error, count } = await supabase
    .from("documents")
    .delete()
    .eq("id", id);

  if (error) throw new Error(`Failed to remove document: ${error.message}`);
  return count ?? 0;
}
