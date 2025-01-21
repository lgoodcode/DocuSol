export interface Document {
  id: string;
  name: string;
  createdAt: string;
  expiresAt: string | null;
  status: "pending" | "signed" | "expired";
  isPublic: boolean;
  isPasswordProtected: boolean;
  size: number;
}
