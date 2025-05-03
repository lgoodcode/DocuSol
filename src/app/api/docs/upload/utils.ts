import { createServerClient } from "@/lib/supabase/server";

const EXPIRATION_TIME = 24 * 60 * 60 * 1000; // 24 hours

// Helper function to generate and store verification token
async function generateAndStoreVerificationToken(
  email: string,
  documentId: string,
): Promise<string> {
  const supabase = await createServerClient({ useServiceRole: true });
  const expiresAt = new Date(Date.now() + EXPIRATION_TIME).toISOString();

  const { data, error } = await supabase
    .from("email_verification_tokens")
    .insert({
      email: email,
      document_id: documentId,
      expires_at: expiresAt,
    })
    .select("token")
    .single();

  if (error) {
    console.error("Error generating verification token:", error);
    // Throw error to be caught by the main handler's catch block
    throw new Error(`Failed to generate verification token: ${error.message}`);
  }

  if (!data?.token) {
    // This case should ideally not happen if insertion was successful and DB default works
    console.error("Verification token was not returned after insert.");
    throw new Error("Failed to retrieve generated verification token.");
  }

  return data.token;
}

async function generateSigningLink(
  email: string,
  documentId: string,
): Promise<string> {
  const token = await generateAndStoreVerificationToken(email, documentId);
  return `https://docusol.app/sign/${documentId}?token=${token}`;
}

export async function generateSigningLinkForParticipants(
  participants: { email: string; name: string }[],
  documentId: string,
): Promise<string[]> {
  return await Promise.all(
    participants.map((participant) =>
      generateSigningLink(participant.email, documentId),
    ),
  );
}
