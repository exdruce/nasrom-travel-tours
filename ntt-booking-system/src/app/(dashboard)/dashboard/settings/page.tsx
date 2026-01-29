import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SettingsPageClient } from "./client";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get business data
  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user.id)
    .single();

  if (!business) redirect("/onboarding");

  return <SettingsPageClient business={business} />;
}
