import { SupabaseClient } from "@supabase/supabase-js";

export const getUser = async (supabase: SupabaseClient) => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error("User not found");
  return {
    id: user.id,
    email: user.email as string,
    firstName: user.user_metadata.first_name as string,
    lastName: user.user_metadata.last_name as string,
  };
};
