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

// ===========================================
// BUSINESS SETTINGS (Configuration Engine)
// ===========================================

interface UpdateBusinessSettingsInput {
  payment_gateway: string;
  payment_gateway_enabled: boolean;
  auto_cancel_timeout: number;
  auto_cancel_enabled: boolean;
  email_notifications: boolean;
  whatsapp_notifications: boolean;
  notification_phone?: string;
  boat_name?: string;
  boat_reg_no?: string;
  default_destination?: string;
  crew_count?: number;
}

export async function getBusinessSettings(businessId: string) {
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
    return { error: "Not authorized" };
  }

  // Get settings
  const { data: settings, error } = await supabase
    .from("business_settings")
    .select("*")
    .eq("business_id", businessId)
    .single();

  if (error) {
    // Settings might not exist yet, return defaults
    return {
      settings: {
        payment_gateway: "bayarcash",
        payment_gateway_enabled: true,
        auto_cancel_timeout: 30,
        auto_cancel_enabled: true,
        email_notifications: true,
        whatsapp_notifications: false,
        notification_phone: null,
        boat_name: "NASROM CABIN 01",
        boat_reg_no: "TRK 1234",
        default_destination: "JETI TOK BALI - PULAU PERHENTIAN",
        crew_count: 2,
      },
    };
  }

  return { settings };
}

export async function updateBusinessSettings(
  businessId: string,
  data: UpdateBusinessSettingsInput,
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
    return { error: "Not authorized to update settings" };
  }

  // Upsert settings
  const { error } = await supabase.from("business_settings").upsert(
    {
      business_id: businessId,
      payment_gateway: data.payment_gateway,
      payment_gateway_enabled: data.payment_gateway_enabled,
      auto_cancel_timeout: data.auto_cancel_timeout,
      auto_cancel_enabled: data.auto_cancel_enabled,
      email_notifications: data.email_notifications,
      whatsapp_notifications: data.whatsapp_notifications,
      notification_phone: data.notification_phone || null,
      boat_name: data.boat_name || null,
      boat_reg_no: data.boat_reg_no || null,
      default_destination: data.default_destination || null,
      crew_count: data.crew_count || 2,
      updated_at: new Date().toISOString(),
    } as never,
    { onConflict: "business_id" },
  );

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/dashboard/settings");
  return { success: true };
}
