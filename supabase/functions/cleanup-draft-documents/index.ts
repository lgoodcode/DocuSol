import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "@supabase/supabase-js";
import { StorageService } from "@/storage";
import type { Database } from "@/types";

const ABANDONMENT_THRESHOLD_DAYS = 1;

function getDateDaysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

/* To invoke locally:

  1. Ensure the Supabase docker container is running
  2. Serve the function locally:

    supabase functions serve cleanup-draft-documents --no-verify-jwt

  3. Make an HTTP request:

    curl --request POST 'http://127.0.0.1:54321/functions/v1/cleanup-draft-documents'

*/

// TODO: implement Sentry error monitoring
Deno.serve(async (req) => {
  if (Deno.env.get("NODE_ENV") === "production") {
    const authHeader = req.headers.get("Authorization");
    if (authHeader !== `Bearer ${Deno.env.get("CRON_SECRET")}`) {
      return new Response("Unauthorized", { status: 401 });
    }
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    }

    const supabaseAdmin = createClient<Database>(supabaseUrl, serviceRoleKey, {
      auth: {
        // Important: Use service role privileges
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const storageService = new StorageService(supabaseAdmin);
    const cutoffDate = getDateDaysAgo(ABANDONMENT_THRESHOLD_DAYS).toISOString();

    const { data: abandonedDocs, error: queryError } = await supabaseAdmin
      .from("documents")
      .select("id, user_id, name")
      .eq("status", "draft")
      .lt("updated_at", cutoffDate);

    if (queryError) {
      console.error("Error querying documents:", queryError);
      throw queryError;
    }

    if (!abandonedDocs || abandonedDocs.length === 0) {
      console.log("No abandoned draft documents found.");
      return new Response(
        JSON.stringify({ message: "No abandoned draft documents found." }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    console.log(
      `Found ${abandonedDocs.length} abandoned draft documents. Starting cleanup...`,
    );

    // 2. Collect file paths and document IDs in a single pass
    const filesToDelete: string[] = [];
    const docIdsToDelete: string[] = [];
    for (const doc of abandonedDocs) {
      const initialVersion = 0; // Initial draft is always version 0
      const filePath = storageService.getFilePath(
        doc.user_id,
        doc.name,
        initialVersion,
      );
      filesToDelete.push(filePath);
      docIdsToDelete.push(doc.id);
    }

    // 3. Attempt bulk deletion from Storage
    let storageDeletionError: string | null = null;
    if (filesToDelete.length > 0) {
      console.log(
        `Attempting to delete ${filesToDelete.length} files from storage...`,
      );
      try {
        await storageService.deleteFiles(filesToDelete);
        console.log("Successfully deleted files from storage.");
      } catch (err) {
        storageDeletionError =
          (err as Error).message || "Unknown storage error";
        console.error(
          "Error during bulk storage deletion:",
          storageDeletionError,
        );
        // Note: Even with storage errors, we proceed to delete DB records
        // as some storage files might have been deleted.
        console.warn(
          "Proceeding with database record deletion despite storage errors.",
        );
      }
    }

    // 4. Attempt bulk deletion from Database
    let dbDeletionError: string | null = null;
    if (docIdsToDelete.length > 0) {
      console.log(
        `Attempting to delete ${docIdsToDelete.length} database records...`,
      );
      try {
        // Use bulk delete with .in()
        const { error: bulkDbError, count } = await supabaseAdmin
          .from("documents")
          .delete()
          .in("id", docIdsToDelete);

        if (bulkDbError) {
          dbDeletionError = bulkDbError.message || "Unknown DB deletion error";
          console.error(
            "Error during bulk database deletion:",
            dbDeletionError,
          );
        } else {
          console.log(`Successfully deleted ${count} database records.`);
        }
      } catch (err) {
        dbDeletionError =
          (err as Error).message || "Unexpected DB error during bulk delete";
        console.error("Unexpected error during bulk database deletion:", err);
      }
    } else {
      console.log("No database records to delete.");
    }

    // 5. Report results
    console.log(
      `Cleanup finished. Attempted to delete ${docIdsToDelete.length} records.`,
    );
    const finalMessage = `Cleanup finished. Processed ${abandonedDocs.length} documents.`;
    const responsePayload: {
      message: string;
      storageError?: string | null;
      databaseError?: string | null;
    } = {
      message: finalMessage,
    };

    if (storageDeletionError) {
      console.error(
        "Storage deletion failed with error:",
        storageDeletionError,
      );
      responsePayload.storageError = storageDeletionError;
    }
    if (dbDeletionError) {
      console.error("Database deletion failed with error:", dbDeletionError);
      responsePayload.databaseError = dbDeletionError; // Report the bulk DB error
    }

    return new Response(JSON.stringify(responsePayload), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Cron job failed:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
