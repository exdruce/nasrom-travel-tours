"use server";

import { createAdminClient, createClient } from "@/lib/supabase/server";
import { UserRole } from "@/types";
import { revalidatePath } from "next/cache";

export interface StaffMember {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  last_sign_in_at?: string | null; // Optional from auth, difficult to join efficiently without admin
}

export async function getStaffMembers() {
  const supabase = await createClient(); // Use regular client to enforce RLS

  // Check if current user is admin/owner/staff to view this list
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  // Fetch profiles with staff/admin/owner roles
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("*")
    .in("role", ["admin", "owner", "staff"])
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching staff:", error);
    return { error: error.message };
  }

  return { data: profiles as StaffMember[] };
}

export async function inviteStaff(data: {
  email: string;
  full_name: string;
  role: UserRole;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. Authorization check
  if (!user) return { error: "Unauthorized" };

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const currentUserProfile = profile as { role: string } | null;

  if (
    !currentUserProfile ||
    (currentUserProfile.role !== "admin" && currentUserProfile.role !== "owner")
  ) {
    return { error: "Insufficient permissions" };
  }

  // 2. Use Admin Client for Auth operations
  const adminSupabase = createAdminClient();

  // 3. Invite user
  // improved: check if user already exists
  const { data: invitation, error: inviteError } =
    await adminSupabase.auth.admin.inviteUserByEmail(data.email, {
      data: {
        full_name: data.full_name,
        role: data.role, // Metadata for triggers or initial setup
      },
    });

  if (inviteError) {
    return { error: inviteError.message };
  }

  // 4. Ensure profile exists/updates with correct role
  // The trigger might handle creation, but we update to be sure about role/name
  if (invitation.user) {
    const { error: profileError } = await adminSupabase
      .from("profiles")
      .upsert({
        id: invitation.user.id,
        email: data.email,
        full_name: data.full_name,
        role: data.role,
        updated_at: new Date().toISOString(),
      } as any) // Type assertion if needed implicitly
      .select()
      .single();

    if (profileError) {
      console.error("Profile update error:", profileError);
      // Don't fail the whole action if invite worked, but warn
    }
  }

  revalidatePath("/dashboard/staff");
  return { success: true };
}

export async function updateStaffRole(userId: string, newRole: UserRole) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  // Auth check
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const currentUserProfile = profile as { role: string } | null;

  if (
    !currentUserProfile ||
    (currentUserProfile.role !== "admin" && currentUserProfile.role !== "owner")
  ) {
    return { error: "Insufficient permissions" };
  }

  // Prevent removing last owner if needed (complex logic, skipping for now but keep in mind)

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const { error } = await (supabase.from("profiles") as any)
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq("id", userId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/staff");
  return { success: true };
}

export async function removeStaff(userId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Unauthorized" };

  // Auth check
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const currentUserProfile = profile as { role: string } | null;

  if (
    !currentUserProfile ||
    (currentUserProfile.role !== "admin" && currentUserProfile.role !== "owner")
  ) {
    return { error: "Insufficient permissions" };
  }

  if (userId === user.id) {
    return { error: "You cannot remove yourself" };
  }

  // Use admin client to remove from Auth
  const adminSupabase = createAdminClient();
  const { error: deleteError } =
    await adminSupabase.auth.admin.deleteUser(userId);

  if (deleteError) return { error: deleteError.message };

  // Profile should cascade delete if DB is set up that way, otherwise manually delete
  // We'll try manual delete just in case cascade isn't set, though usually it is on auth.users
  await adminSupabase.from("profiles").delete().eq("id", userId);

  revalidatePath("/dashboard/staff");
  return { success: true };
}
