import type { SignatureStatus } from "@/lib/types/stamp";

export interface ViewDocument {
  id: string;
  name: string;
  hasPassword: boolean;
  status: SignatureStatus;
  txSignature: string; // Retrieved from latest doc version
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}
