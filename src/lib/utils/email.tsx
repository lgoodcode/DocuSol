import { Resend } from "resend";
import * as React from "react";

import { CompletedDocumentTemplate } from "@/components/email/completed-document-template";
import { SignDocumentTemplate } from "@/components/email/sign-document-template";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = "noreply@mail.docusol.app";

type EmailRecipient = {
  email: string;
  name: string;
};

// Specific types for each email scenario
type SignEmailDetails = {
  type: "sign";
  recipient: EmailRecipient & { link: string }; // Sign needs a link
  sender: Sender;
  subject: string;
  documentName: string;
  senderMessage?: string;
};

type CompleteEmailDetails = {
  type: "complete" | "notify";
  creatorEmail: string;
  signerEmail?: string;
  subject: string;
  documentName: string;
};

// Union type for all possible email details
type EmailDetails = SignEmailDetails | CompleteEmailDetails;

type Sender = {
  name: string;
  email: string;
};

const createPayload = (details: EmailDetails) => {
  let reactElement: React.ReactElement;
  let recipientEmail: string;

  switch (details.type) {
    case "sign":
      reactElement = (
        <SignDocumentTemplate
          recipient={details.recipient}
          sender={details.sender}
          signLink={details.recipient.link}
          documentName={details.documentName}
          senderMessage={details.senderMessage}
        />
      );
      recipientEmail = details.recipient.email;
      break;
    case "notify":
      reactElement = (
        <CompletedDocumentTemplate
          type={details.type}
          documentName={details.documentName}
          signerEmail={details.signerEmail}
        />
      );
      recipientEmail = details.creatorEmail;
      break;
    case "complete":
      reactElement = (
        <CompletedDocumentTemplate
          type={details.type}
          documentName={details.documentName}
        />
      );
      recipientEmail = details.creatorEmail;
      break;
    default:
      // Enforce exhaustive check at compile time
      const exhaustiveCheck: never = details;
      throw new Error(`Unhandled email type: ${exhaustiveCheck}`);
  }

  return {
    from: `DocuSol <${FROM_EMAIL}>`,
    to: recipientEmail,
    subject: details.subject,
    react: reactElement,
  };
};

/**
 * Sends an email using Resend based on the provided details.
 *
 * @param details An object containing the necessary details for the email type ('sign' or 'complete').
 * @throws Throws an error if the email fails to send.
 * @returns The response data from the Resend API.
 */
export async function sendEmail(details: EmailDetails) {
  const payload = createPayload(details);
  const { data, error } = await resend.emails.send(payload);

  if (error) {
    // Log specific details for better debugging
    console.error(
      `Failed to send ${details.type} email to ${payload.to}: ${error.message}`,
    );
    throw new Error(`Failed to send email: ${error.message}`);
  }

  console.log(`Successfully sent ${details.type} email to ${payload.to}`);
  return data;
}

/**
 * Sends multiple signing request emails in batch.
 * Note: This function is currently specific to sending 'sign' emails.
 *
 * @param recipients An array of recipient details including email, name, and sign link.
 * @param sender The sender's details.
 * @param subject The subject line for the emails.
 * @param documentName The name of the document being sent.
 * @throws Throws an error if sending the batch fails.
 * @returns The response data from the Resend API.
 */
export async function sendEmails(
  recipients: (EmailRecipient & { link: string })[], // Ensure link is included
  sender: Sender,
  subject: string,
  documentName: string,
) {
  const payloads = recipients.map((recipient) =>
    createPayload({
      type: "sign", // Explicitly set type to 'sign'
      recipient: recipient,
      sender: sender,
      subject: subject,
      documentName: documentName,
      // senderMessage can be added here if needed for batch sends
    }),
  );

  const { data, error } = await resend.batch.send(payloads);

  if (error) {
    console.error(`Failed to send batch sign emails: ${error.message}`);
    throw new Error(`Failed to send batch emails: ${error.message}`);
  }

  console.log(
    `Successfully sent batch sign emails to ${recipients.length} recipients.`,
  );
  return data;
}
