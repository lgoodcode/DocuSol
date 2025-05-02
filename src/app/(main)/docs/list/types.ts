import type { SignatureStatus } from "@/lib/types/stamp";

export interface ViewDocument {
  id: string;
  name: string;
  password: boolean;
  status: SignatureStatus;
  txSignature: string; // Retrieved from latest doc version
  expires: string;
  created: string;
  updated: string;
  versionNumber: number;
}
