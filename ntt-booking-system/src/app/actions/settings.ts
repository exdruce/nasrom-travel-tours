"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

interface UpdateBusinessInput {
  name: string;
  slug: string;
  description: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  branding: {
    primary_color: string;
    secondary_color: string;
  };
}

export async function updateBusiness(
  businessId: string,
  data: UpdateBusinessInput,
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Verify ownership
  const { data: businessData } = await supabase
    .from("businesses")
    .select("owner_id")
    .eq("id", businessId)
    .single();

  const business = businessData as { owner_id: string } | null;
  if (!business || business.owner_id !== user.id) {
    return { error: "Not authorized to update this business" };
  }

  // Check slug uniqueness if changed
  const { data: existingSlug } = await supabase
    .from("businesses")
    .select("id")
    .eq("slug", data.slug)
    .neq("id", businessId)
    .single();

  if (existingSlug) {
    return { error: "This URL slug is already taken" };
  }

  // Update business
  const { error } = await supabase
    .from("businesses")
    .update({
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      contact_email: data.contact_email || null,
      contact_phone: data.contact_phone || null,
      address: data.address || null,
      branding: data.branding,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", businessId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function toggleBusinessPublish(businessId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Get current status
  const { data: businessData2 } = await supabase
    .from("businesses")
    .select("is_published, owner_id")
    .eq("id", businessId)
    .single();

  const business = businessData2 as {
    is_published: boolean;
    owner_id: string;
  } | null;
  if (!business || business.owner_id !== user.id) {
    return { error: "Not authorized" };
  }

  const { error } = await supabase
    .from("businesses")
    .update({
      is_published: !business.is_published,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", businessId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");
  return { success: true, isPublished: !business.is_published };
}
