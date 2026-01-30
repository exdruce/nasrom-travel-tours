"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface UpdateProfileInput {
  full_name?: string;
  phone?: string;
  avatar_url?: string;
}

export async function updateProfile(userId: string, data: UpdateProfileInput) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== userId) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: data.full_name,
      phone: data.phone,
      avatar_url: data.avatar_url,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", userId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { success: true };
}
