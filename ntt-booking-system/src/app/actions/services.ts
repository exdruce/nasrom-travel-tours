"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

// Validation schema for service
const serviceSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().optional(),
  price: z.coerce
    .number()
    .min(0, "Price must be positive")
    .optional()
    .default(0), // Price is now per variant
  duration_minutes: z.coerce
    .number()
    .min(0, "Duration must be a positive number")
    .optional()
    .nullable(),
  max_capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  images: z.array(z.string()).optional(),
  is_active: z.boolean().optional(),
});

export type ServiceFormState = {
  errors?: {
    name?: string[];
    description?: string[];
    price?: string[];
    duration_minutes?: string[];
    max_capacity?: string[];
    images?: string[];
    _form?: string[];
  };
  success?: boolean;
};

export async function createService(
  prevState: ServiceFormState,
  formData: FormData,
): Promise<ServiceFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { errors: { _form: ["Unauthorized"] } };
  }

  // Get user's business
  const { data: businessData } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  const business = businessData as { id: string } | null;

  if (!business) {
    return { errors: { _form: ["Business not found"] } };
  }

  // Parse form data
  const rawData = {
    name: formData.get("name"),
    description: formData.get("description") || "",
    price: formData.get("price") || 0, // Price is optional, defaults to 0 (pricing is per variant)
    duration_minutes: formData.get("duration_minutes"),
    max_capacity: formData.get("max_capacity"),
    is_active: formData.get("is_active") === "true",
  };

  // Validate
  const validatedFields = serviceSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const {
    name,
    description,
    price,
    duration_minutes,
    max_capacity,
    is_active,
  } = validatedFields.data;

  // Get next sort order
  const { count } = await supabase
    .from("services")
    .select("*", { count: "exact", head: true })
    .eq("business_id", business.id);

  // Create service
  const { error } = await supabase.from("services").insert({
    business_id: business.id,
    name,
    description,
    price,
    duration_minutes,
    max_capacity,
    images: [],
    is_active: is_active ?? true,
    sort_order: (count || 0) + 1,
  } as never);

  if (error) {
    console.error("Create service error:", error);
    return { errors: { _form: [error.message] } };
  }

  revalidatePath("/dashboard/services");
  redirect("/dashboard/services");
}

export async function updateService(
  serviceId: string,
  prevState: ServiceFormState,
  formData: FormData,
): Promise<ServiceFormState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { errors: { _form: ["Unauthorized"] } };
  }

  // Parse form data
  const rawData = {
    name: formData.get("name"),
    description: formData.get("description") || "",
    price: formData.get("price") || 0, // Price is optional, defaults to 0 (pricing is per variant)
    duration_minutes: formData.get("duration_minutes"),
    max_capacity: formData.get("max_capacity"),
    is_active: formData.get("is_active") === "true",
  };

  // Validate
  const validatedFields = serviceSchema.safeParse(rawData);

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const {
    name,
    description,
    price,
    duration_minutes,
    max_capacity,
    is_active,
  } = validatedFields.data;

  // Update service
  const { error } = await supabase
    .from("services")
    .update({
      name,
      description,
      price,
      duration_minutes,
      max_capacity,
      is_active: is_active ?? true,
    } as never)
    .eq("id", serviceId);

  if (error) {
    console.error("Update service error:", error);
    return { errors: { _form: [error.message] } };
  }

  revalidatePath("/dashboard/services");
  revalidatePath(`/dashboard/services/${serviceId}`);
  return { success: true };
}

export async function toggleServiceStatus(
  serviceId: string,
  isActive: boolean,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("services")
    .update({ is_active: isActive } as never)
    .eq("id", serviceId);

  if (error) {
    console.error("Toggle service error:", error);
    return { error: error.message };
  }

  revalidatePath("/dashboard/services");
  return { success: true };
}

export async function deleteService(serviceId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Check if service has bookings
  const { count } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("service_id", serviceId);

  if (count && count > 0) {
    return { error: "Cannot delete service with existing bookings" };
  }

  const { error } = await supabase
    .from("services")
    .delete()
    .eq("id", serviceId);

  if (error) {
    console.error("Delete service error:", error);
    return { error: error.message };
  }

  revalidatePath("/dashboard/services");
  return { success: true };
}

// Service Variants
export async function createVariant(
  serviceId: string,
  data: { name: string; price: number; description?: string },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Get next sort order
  const { count } = await supabase
    .from("service_variants")
    .select("*", { count: "exact", head: true })
    .eq("service_id", serviceId);

  const { error } = await supabase.from("service_variants").insert({
    service_id: serviceId,
    name: data.name,
    price: data.price,
    description: data.description || null,
    sort_order: (count || 0) + 1,
  } as never);

  if (error) {
    console.error("Create variant error:", error);
    return { error: error.message };
  }

  revalidatePath(`/dashboard/services/${serviceId}`);
  return { success: true };
}

export async function updateVariant(
  variantId: string,
  data: { name: string; price: number; description?: string },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("service_variants")
    .update({
      name: data.name,
      price: data.price,
      description: data.description || null,
    } as never)
    .eq("id", variantId);

  if (error) {
    console.error("Update variant error:", error);
    return { error: error.message };
  }

  revalidatePath("/dashboard/services");
  return { success: true };
}

export async function deleteVariant(variantId: string, serviceId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("service_variants")
    .delete()
    .eq("id", variantId);

  if (error) {
    console.error("Delete variant error:", error);
    return { error: error.message };
  }

  revalidatePath(`/dashboard/services/${serviceId}`);
  return { success: true };
}

// Service Addons
export async function createAddon(
  serviceId: string,
  data: { name: string; price: number; description?: string },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Get next sort order
  const { count } = await supabase
    .from("service_addons")
    .select("*", { count: "exact", head: true })
    .eq("service_id", serviceId);

  const { error } = await supabase.from("service_addons").insert({
    service_id: serviceId,
    name: data.name,
    price: data.price,
    description: data.description || null,
    is_active: true,
    sort_order: (count || 0) + 1,
  } as never);

  if (error) {
    console.error("Create addon error:", error);
    return { error: error.message };
  }

  revalidatePath(`/dashboard/services/${serviceId}`);
  return { success: true };
}

export async function updateAddon(
  addonId: string,
  data: {
    name: string;
    price: number;
    description?: string;
    is_active?: boolean;
  },
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("service_addons")
    .update({
      name: data.name,
      price: data.price,
      description: data.description || null,
      is_active: data.is_active ?? true,
    } as never)
    .eq("id", addonId);

  if (error) {
    console.error("Update addon error:", error);
    return { error: error.message };
  }

  revalidatePath("/dashboard/services");
  return { success: true };
}

export async function deleteAddon(addonId: string, serviceId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const { error } = await supabase
    .from("service_addons")
    .delete()
    .eq("id", addonId);

  if (error) {
    console.error("Delete addon error:", error);
    return { error: error.message };
  }

  revalidatePath(`/dashboard/services/${serviceId}`);
  return { success: true };
}
