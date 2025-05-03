import { createBrowserClient } from "@supabase/ssr";
import { type Database } from "@/lib/supabase/database";

export type BrowserSupabaseClient = ReturnType<typeof createClient>;

export const createClient = () =>
  createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
