import { z } from "zod";

import { DocumentContentHashSchema } from "@/lib/pdf-editor/document-types";

export type SignRequestForm = z.infer<typeof SignRequestFormSchema>;

export const SignRequestFormSchema = DocumentContentHashSchema.extend({
  documentId: z.string().uuid({ message: "Invalid Document ID format" }),
  documentName: z.string(),
  token: z.string().uuid({ message: "Invalid Token format" }),
  versionNumber: z.number(),
  participantId: z.string().uuid({ message: "Invalid Participant ID format" }),
  isLastSigner: z.boolean(),
  password: z.string().optional(),
  creatorUserId: z.string().uuid({ message: "Invalid Creator User ID format" }),
  signerEmail: z.string().email({ message: "Invalid Signer Email format" }),
});
