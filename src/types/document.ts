export interface Document {
  id: string;
  name: string;
  createdAt: string;
  expiresAt: string | null;
  status: "pending" | "signed" | "expired";
  password: string | null;
  size: number;
}
