import { SupabaseClient } from "@supabase/supabase-js";
import { assert } from "node:console";

export const getUser = async (supabase: SupabaseClient) => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error) throw error;
  if (!user) throw new Error("User not found");
  const email = user.email as string;
  const firstName = user.user_metadata.first_name as string;
  const lastName = user.user_metadata.last_name as string;

  if (!email) throw new Error("Email is required");
  if (!firstName) throw new Error("First name is required");
  if (!lastName) throw new Error("Last name is required");

  return {
    id: user.id,
    email,
    firstName,
    lastName,
  };
};
