import type { Database } from "./database";

export type Document = Database["public"]["Tables"]["documents"]["Row"];

export type ViewDocument = {
  id: string;
  name: string;
  password: string | null;
  status: "signed" | "pending";
  createdAt: string;
};
