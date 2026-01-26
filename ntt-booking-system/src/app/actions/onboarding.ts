"use server";

import { createClient } from "@/lib/supabase/server";
import { businessSchema, serviceSchema } from "@/lib/schemas/onboarding";
import { redirect } from "next/navigation";
import type {
  BusinessFormValues,
  ServiceFormValues,
} from "@/lib/schemas/onboarding";

export async function createBusiness(data: BusinessFormValues) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  // Validate data
  const validated = businessSchema.safeParse(data);
  if (!validated.success) {
    throw new Error("Invalid data");
  }

  // Create business
  const { data: business, error } = await (supabase.from("businesses") as any)
    .insert({
      owner_id: user.id,
      name: validated.data.name,
      slug: validated.data.slug,
      description: validated.data.description || null,
      contact_phone: validated.data.contact_phone,
      contact_email: validated.data.contact_email,
      logo_url: null,
      banner_url: null,
      address: null,
      branding: {
        primary_color: "#168D95",
        secondary_color: "#DE7F21",
      },
      is_published: false,
    } as any)
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      // Unique violation for slug
      throw new Error("Business URL is already taken");
    }
    throw new Error(error.message);
  }

  return business;
}

export async function createFirstService(
  businessId: string,
  data: ServiceFormValues,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const validated = serviceSchema.safeParse(data);
  if (!validated.success) {
    throw new Error("Invalid data");
  }

  // Verify ownership
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("id", businessId)
    .eq("owner_id", user.id)
    .single();

  if (!business) {
    throw new Error("Unauthorized");
  }

  // Create service
  const { error } = await (supabase.from("services") as any).insert({
    business_id: businessId,
    name: validated.data.name,
    description: validated.data.description || null,
    price: validated.data.price,
    duration_minutes: validated.data.duration_minutes,
    max_capacity: validated.data.max_capacity,
    images: [],
    sort_order: 0,
    is_active: true,
  } as any);

  if (error) {
    throw new Error(error.message);
  }

  // Publish business
  await (supabase.from("businesses") as any)
    .update({ is_published: true } as any)
    .eq("id", businessId);

  redirect("/dashboard");
}
