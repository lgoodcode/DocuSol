import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Text,
} from "@react-email/components";
import * as React from "react";

interface CompletedDocumentTemplateProps {
  documentName: string;
  type: "complete" | "notify";
  signerEmail?: string;
}

export const CompletedDocumentTemplate: React.FC<
  Readonly<CompletedDocumentTemplateProps>
> = ({ documentName, type, signerEmail }) => {
  const previewText =
    type === "complete"
      ? `Document "${documentName}" has been completed`
      : `${signerEmail || "A participant"} has signed "${documentName}"`;

  const headingText =
    type === "complete"
      ? `🎉 Document Completed: "${documentName}"`
      : `✍️ Document Signed: "${documentName}"`;

  const paragraphText =
    type === "complete"
      ? `Good news! The document titled "${documentName}" has been successfully signed by all participants.`
      : `${
          signerEmail ? `${signerEmail} has` : "A participant has"
        } signed the document titled "${documentName}".`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>{headingText}</Heading>
          <Text style={paragraph}>{paragraphText}</Text>
          <Hr style={hr} />
          <Text style={footer}>Sent via DocuSol</Text>
        </Container>
      </Body>
    </Html>
  );
};

// --- Styles (similar to SignDocumentTemplate for consistency) ---

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  border: "1px solid #e6ebf1",
  borderRadius: "8px",
};

const heading = {
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "bold",
  textAlign: "center" as const,
  margin: "30px 0",
};

const paragraph = {
  color: "#3c4043",
  fontSize: "14px",
  lineHeight: "22px",
  padding: "0 35px", // Increased padding slightly
  marginBottom: "15px",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#007bff",
  borderRadius: "5px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "bold",
  textDecoration: "none",
  textAlign: "center" as const,
  padding: "12px 24px",
  display: "inline-block",
};

const linkText = {
  ...paragraph,
  color: "#007bff",
  textDecoration: "underline",
  wordBreak: "break-all" as const,
  padding: "0 35px", // Match paragraph padding
};

const hr = {
  borderColor: "#e6ebf1",
  margin: "20px 0",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  textAlign: "center" as const,
  padding: "0 20px",
};

export default CompletedDocumentTemplate;
