import { createServerClient as _createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { type Database } from "./database";

export async function createServerClient({
  useServiceRole = false,
}: {
  useServiceRole?: boolean;
}) {
  const cookieStore = await cookies();

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL");
  } else if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  // Create a server's supabase client with newly configured cookie,
  // which could be used to maintain user's session
  return _createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    useServiceRole
      ? process.env.SUPABASE_SERVICE_ROLE_KEY
      : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );
}
