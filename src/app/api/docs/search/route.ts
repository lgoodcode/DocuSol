import { captureException } from "@sentry/nextjs";

import { supabase } from "@/lib/supabase/client";

export async function POST(request: Request) {
  try {
    const { hash, password } = await request.json();

    if (!hash) {
      return Response.json(
        { error: "Missing required field: hash" },
        { status: 400 }
      );
    }

    // Get full document details
    const { error, data: document } = await supabase
      .from("documents")
      .select("*")
      .eq("unsigned_hash", hash)
      .eq("signed_hash", hash)
      .single();

    if (error) {
      throw error;
    } else if (!document) {
      return Response.json({ error: "Document not found" }, { status: 404 });
    }

    // Verify password if required
    if (document.password) {
      if (!password) {
        return Response.json(
          { error: "Password required for this document" },
          { status: 401 }
        );
      } else if (password !== document.password) {
        return Response.json({ error: "Invalid password" }, { status: 401 });
      }
    }

    // Prepare metadata
    const metadata = {
      id: document.id,
      name: document.name,
      unsignedHash: document.unsigned_hash,
      signedHash: document.signed_hash || null,
      createdAt: document.created_at,
      unsignedTransactionSignature: document.unsigned_transaction_signature,
      signedTransactionSignature: document.signed_transaction_signature || null,
      isSigned: Boolean(document.is_signed),
      signedAt: document.signed_at || null,
      hasPassword: Boolean(document.password),
      originalFilename: document.original_filename,
    };

    // Create FormData and append files and metadata
    const formData = new FormData();

    // Append metadata as JSON
    formData.append("metadata", JSON.stringify(metadata));

    // Append unsigned document
    formData.append(
      "unsignedDocument",
      new Blob([document.unsigned_document], {
        type: "application/octet-stream",
      }),
      document.original_filename
    );

    // Append signed document if it exists
    if (document.is_signed && document.signed_document) {
      formData.append(
        "signedDocument",
        new Blob([document.signed_document], {
          type: "application/octet-stream",
        }),
        `signed_${document.original_filename}`
      );
    }

    return new Response(formData);
  } catch (err) {
    const error = err as Error;
    console.error(error);
    captureException(error);
    return Response.json(
      {
        error: "Internal server error",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
