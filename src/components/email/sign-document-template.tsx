import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface SignDocumentTemplateProps {
  recipient: {
    email: string;
    name: string;
  };
  sender: {
    name: string;
    email: string;
  };
  senderMessage?: string;
  signLink: string;
  documentName: string;
}

export const SignDocumentTemplate: React.FC<
  Readonly<SignDocumentTemplateProps>
> = ({ recipient, sender, senderMessage, signLink, documentName }) => (
  <Html>
    <Head />
    <Preview>{`Document "${documentName}" requires your signature`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>
          {`Signature Request for "${documentName}"`}
        </Heading>
        <Text style={paragraph}>
          Hello {recipient.name},<br />
          <br />
          {`${sender.name} has requested your signature on the document titled "${documentName}".`}
        </Text>
        {senderMessage && (
          <Section style={messageSection}>
            <Text style={paragraph}>
              <strong>Message from {sender.name}:</strong>
            </Text>
            <Text style={messageText}>{senderMessage}</Text>
          </Section>
        )}
        <Section style={buttonContainer}>
          <Link style={button} href={signLink}>
            Review & Sign Document
          </Link>
        </Section>
        <Text style={paragraph}>
          If you are having trouble clicking the button, copy and paste the URL
          below into your web browser:
        </Text>
        <Text style={linkText}>{signLink}</Text>
        <Hr style={hr} />
        <Text style={footer}>
          Sent via DocuSol | If you were not expecting this document, please
          ignore this email or contact the sender.
        </Text>
      </Container>
    </Body>
  </Html>
);

// Basic styles for the email template
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
  padding: "0 20px",
};

const messageSection = {
  backgroundColor: "#f8f9fa",
  border: "1px solid #dee2e6",
  borderRadius: "4px",
  margin: "20px",
  padding: "10px 20px",
};

const messageText = {
  ...paragraph,
  padding: "0", // Remove padding for message text
  fontStyle: "italic",
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
