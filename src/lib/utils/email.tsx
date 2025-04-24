import { Resend } from "resend";
import * as React from "react";

import { SignDocumentTemplate } from "@/components/email/sign-document-template";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = "noreply@mail.docusol.app";

type ToEmail = {
  email: string;
  name: string;
  link: string;
};

type Sender = {
  name: string;
  email: string;
};

const createPayload = (
  recipient: ToEmail,
  sender: Sender,
  subject: string,
  signLink: string,
  documentName: string,
  senderMessage?: string,
) => {
  return {
    from: `DocuSol <${FROM_EMAIL}>`,
    to: recipient.email,
    subject,
    react: (
      <SignDocumentTemplate
        recipient={recipient}
        sender={sender}
        signLink={signLink}
        documentName={documentName}
        senderMessage={senderMessage}
      />
    ),
  };
};

/**
 * Sends an email using Resend with the SignDocumentTemplate.
 *
 * @param to The recipient's email address and name.
 * @param subject The subject line of the email.
 * @param signLink The link for the recipient to sign the document.
 * @param documentName The name of the document being sent.
 * @param senderEmail The email address of the person sending the request (defaults to FROM_EMAIL).
 * @param senderMessage An optional message from the sender.
 * @throws Throws an error if the email fails to send.
 * @returns The response data from the Resend API.
 */
export async function sendEmail(
  recipient: ToEmail,
  sender: Sender,
  subject: string,
  signLink: string,
  documentName: string,
  senderMessage?: string,
) {
  const { data, error } = await resend.emails.send(
    createPayload(
      recipient,
      sender,
      subject,
      signLink,
      documentName,
      senderMessage,
    ),
  );

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
}

export async function sendEmails(
  recipients: ToEmail[],
  sender: Sender,
  subject: string,
  documentName: string,
) {
  const { data, error } = await resend.batch.send(
    recipients.map((recipient) =>
      createPayload(recipient, sender, subject, recipient.link, documentName),
    ),
  );

  if (error) {
    throw new Error(`Failed to send emails: ${error.message}`);
  }

  return data;
}
