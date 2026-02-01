import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SettingsPageClient } from "./client";

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get profile data
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Get business data
  const { data: business } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user.id)
    .single();

  if (!business) redirect("/onboarding");

  // Check role permission - Settings is restricted for staff
  const userProfile = profile as { role: string } | null; // profile is already fetched above
  if (
    !userProfile ||
    (userProfile.role !== "admin" && userProfile.role !== "owner")
  ) {
    redirect("/dashboard");
  }

  return <SettingsPageClient business={business} profile={profile} />;
}
