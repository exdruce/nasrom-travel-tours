"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Availability } from "@/types";

// ============================================
// VALIDATION SCHEMAS
// ============================================

const timeSlotSchema = z.object({
  service_id: z.string().uuid().optional().nullable(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
  capacity: z.coerce.number().min(1, "Capacity must be at least 1"),
  notes: z.string().optional(),
});

const recurringSlotSchema = z.object({
  service_id: z.string().uuid().optional().nullable(),
  days_of_week: z.array(z.number().min(0).max(6)), // 0 = Sunday, 6 = Saturday
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
  capacity: z.coerce.number().min(1),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

// Type definitions for Supabase query results
interface BusinessRow {
  id: string;
}

interface AvailabilitySlotRow {
  capacity: number;
  booked_count: number;
  is_blocked: boolean;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

async function getBusinessId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!business) {
    throw new Error("Business not found");
  }

  return (business as BusinessRow).id;
}

// ============================================
// GET AVAILABILITY
// ============================================

export async function getAvailabilityForMonth(year: number, month: number) {
  const businessId = await getBusinessId();
  const supabase = await createClient();

  // Calculate first and last day of month
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const { data, error } = await supabase
    .from("availability")
    .select("*, services(name)")
    .eq("business_id", businessId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Get availability error:", error);
    throw new Error(error.message);
  }

  return data as (Availability & { services: { name: string } | null })[];
}

export async function getAvailabilityForDate(date: string) {
  const businessId = await getBusinessId();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("availability")
    .select("*, services(name)")
    .eq("business_id", businessId)
    .eq("date", date)
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Get availability for date error:", error);
    throw new Error(error.message);
  }

  return data as (Availability & { services: { name: string } | null })[];
}

// ============================================
// CREATE TIME SLOT
// ============================================

export async function createTimeSlot(formData: FormData) {
  const businessId = await getBusinessId();
  const supabase = await createClient();

  const rawData = {
    service_id: formData.get("service_id") || null,
    date: formData.get("date") as string,
    start_time: formData.get("start_time") as string,
    end_time: formData.get("end_time") as string,
    capacity: formData.get("capacity"),
    notes: formData.get("notes") || "",
  };

  const validated = timeSlotSchema.safeParse(rawData);

  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors };
  }

  const { service_id, date, start_time, end_time, capacity, notes } =
    validated.data;

  // Check for overlapping slots
  const { data: existing } = await supabase
    .from("availability")
    .select("id")
    .eq("business_id", businessId)
    .eq("date", date)
    .eq("start_time", start_time)
    .maybeSingle();

  if (existing) {
    return { error: { _form: ["A slot already exists at this time"] } };
  }

  const { error } = await supabase.from("availability").insert({
    business_id: businessId,
    service_id: service_id || null,
    date,
    start_time,
    end_time,
    capacity,
    booked_count: 0,
    is_blocked: false,
    notes: notes || null,
  } as never);

  if (error) {
    console.error("Create time slot error:", error);
    return { error: { _form: [error.message] } };
  }

  revalidatePath("/dashboard/calendar");
  return { success: true };
}

// ============================================
// CREATE RECURRING SLOTS
// ============================================

function getWeekOfMonth(date: Date): number {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  const dayOfMonth = date.getDate();
  const dayOfWeek = firstDay.getDay();
  return Math.ceil((dayOfMonth + dayOfWeek) / 7);
}

function isLastWeekOfMonth(date: Date): boolean {
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return lastDay.getDate() - date.getDate() < 7;
}

export async function createRecurringSlots(formData: FormData) {
  const businessId = await getBusinessId();
  const supabase = await createClient();

  const patternType = (formData.get("pattern_type") as string) || "weekly";
  const daysOfWeekStr = formData.get("days_of_week") as string;
  const daysOfWeek = daysOfWeekStr ? JSON.parse(daysOfWeekStr) : [];
  const monthlyWeek = (formData.get("monthly_week") as string) || "all";
  const customDatesStr = formData.get("custom_dates") as string;
  const customDates = customDatesStr ? JSON.parse(customDatesStr) : [];

  const serviceId = formData.get("service_id") as string;
  const startTime = formData.get("start_time") as string;
  const endTime = formData.get("end_time") as string;
  const capacityStr = formData.get("capacity") as string;
  const capacity = parseInt(capacityStr, 10);

  if (!startTime || !endTime || isNaN(capacity) || capacity < 1) {
    return { error: { _form: ["Invalid time or capacity"] } };
  }

  const slots: {
    business_id: string;
    service_id: string | null;
    date: string;
    start_time: string;
    end_time: string;
    capacity: number;
    booked_count: number;
    is_blocked: boolean;
  }[] = [];

  if (patternType === "custom") {
    // Custom pattern: use specific dates
    for (const dateStr of customDates) {
      slots.push({
        business_id: businessId,
        service_id: serviceId || null,
        date: dateStr,
        start_time: startTime,
        end_time: endTime,
        capacity,
        booked_count: 0,
        is_blocked: false,
      });
    }
  } else {
    // Weekly or Monthly pattern
    const startDate = formData.get("start_date") as string;
    const endDate = formData.get("end_date") as string;

    if (!startDate || !endDate) {
      return { error: { _form: ["Start and end dates are required"] } };
    }

    const current = new Date(startDate);
    const end = new Date(endDate);

    while (current <= end) {
      const dayOfWeek = current.getDay();

      if (daysOfWeek.includes(dayOfWeek)) {
        let includeDate = true;

        // For monthly pattern, check week of month
        if (patternType === "monthly" && monthlyWeek !== "all") {
          const weekNum = getWeekOfMonth(current);
          switch (monthlyWeek) {
            case "first":
              includeDate = weekNum === 1;
              break;
            case "second":
              includeDate = weekNum === 2;
              break;
            case "third":
              includeDate = weekNum === 3;
              break;
            case "fourth":
              includeDate = weekNum === 4;
              break;
            case "last":
              includeDate = isLastWeekOfMonth(current);
              break;
          }
        }

        if (includeDate) {
          const dateStr = current.toISOString().split("T")[0];
          slots.push({
            business_id: businessId,
            service_id: serviceId || null,
            date: dateStr,
            start_time: startTime,
            end_time: endTime,
            capacity,
            booked_count: 0,
            is_blocked: false,
          });
        }
      }
      current.setDate(current.getDate() + 1);
    }
  }

  if (slots.length === 0) {
    return { error: { _form: ["No matching dates found"] } };
  }

  // Insert slots, ignoring conflicts
  const { error } = await supabase
    .from("availability")
    .upsert(slots as never[], {
      onConflict: "business_id,service_id,date,start_time",
      ignoreDuplicates: true,
    });

  if (error) {
    console.error("Create recurring slots error:", error);
    return { error: { _form: [error.message] } };
  }

  revalidatePath("/dashboard/calendar");
  return { success: true, count: slots.length };
}

// ============================================
// UPDATE TIME SLOT
// ============================================

export async function updateTimeSlot(slotId: string, formData: FormData) {
  const supabase = await createClient();
  const businessId = await getBusinessId();

  const rawData = {
    service_id: formData.get("service_id") || null,
    date: formData.get("date") as string,
    start_time: formData.get("start_time") as string,
    end_time: formData.get("end_time") as string,
    capacity: formData.get("capacity"),
    notes: formData.get("notes") || "",
  };

  const validated = timeSlotSchema.safeParse(rawData);

  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors };
  }

  const { service_id, date, start_time, end_time, capacity, notes } =
    validated.data;

  const { error } = await supabase
    .from("availability")
    .update({
      service_id: service_id || null,
      date,
      start_time,
      end_time,
      capacity,
      notes: notes || null,
    } as never)
    .eq("id", slotId)
    .eq("business_id", businessId);

  if (error) {
    console.error("Update time slot error:", error);
    return { error: { _form: [error.message] } };
  }

  revalidatePath("/dashboard/calendar");
  return { success: true };
}

// ============================================
// DELETE TIME SLOT
// ============================================

export async function deleteTimeSlot(slotId: string) {
  const supabase = await createClient();
  const businessId = await getBusinessId();

  // Check if slot has bookings
  const { data: slot } = await supabase
    .from("availability")
    .select("booked_count")
    .eq("id", slotId)
    .single();

  if (slot && (slot as { booked_count: number }).booked_count > 0) {
    return { error: "Cannot delete slot with existing bookings" };
  }

  const { error } = await supabase
    .from("availability")
    .delete()
    .eq("id", slotId)
    .eq("business_id", businessId);

  if (error) {
    console.error("Delete time slot error:", error);
    return { error: error.message };
  }

  revalidatePath("/dashboard/calendar");
  return { success: true };
}

// ============================================
// TOGGLE BLOCK DATE
// ============================================

export async function toggleBlockDate(date: string, blocked: boolean) {
  const businessId = await getBusinessId();
  const supabase = await createClient();

  if (blocked) {
    // Block all slots on this date
    const { error } = await supabase
      .from("availability")
      .update({ is_blocked: true } as never)
      .eq("business_id", businessId)
      .eq("date", date);

    if (error) {
      console.error("Block date error:", error);
      return { error: error.message };
    }

    // If no slots exist, create a blocked placeholder slot
    const { data: existing } = await supabase
      .from("availability")
      .select("id")
      .eq("business_id", businessId)
      .eq("date", date)
      .limit(1);

    if (!existing || existing.length === 0) {
      await supabase.from("availability").insert({
        business_id: businessId,
        service_id: null,
        date,
        start_time: "00:00",
        end_time: "23:59",
        capacity: 0,
        booked_count: 0,
        is_blocked: true,
        notes: "Blocked date",
      } as never);
    }
  } else {
    // Unblock all slots on this date
    const { error } = await supabase
      .from("availability")
      .update({ is_blocked: false } as never)
      .eq("business_id", businessId)
      .eq("date", date);

    if (error) {
      console.error("Unblock date error:", error);
      return { error: error.message };
    }
  }

  revalidatePath("/dashboard/calendar");
  return { success: true };
}

// ============================================
// CHECK SLOT CAPACITY (For booking validation)
// ============================================

export async function checkSlotCapacity(slotId: string, requestedPax: number) {
  const supabase = await createClient();

  const { data: slot, error } = await supabase
    .from("availability")
    .select("capacity, booked_count, is_blocked")
    .eq("id", slotId)
    .single();

  if (error || !slot) {
    return { available: false, error: "Slot not found" };
  }

  const typedSlot = slot as AvailabilitySlotRow;

  if (typedSlot.is_blocked) {
    return { available: false, remaining: 0, error: "This date is blocked" };
  }

  const remaining = typedSlot.capacity - typedSlot.booked_count;
  const available = remaining >= requestedPax;

  return {
    available,
    remaining,
    error: available ? null : "Not enough capacity",
  };
}

// ============================================
// GET SERVICES FOR DROPDOWN
// ============================================

export async function getServicesForAvailability() {
  const businessId = await getBusinessId();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("services")
    .select("id, name, duration_minutes, max_capacity")
    .eq("business_id", businessId)
    .eq("is_active", true)
    .order("name");

  if (error) {
    console.error("Get services error:", error);
    return [];
  }

  return data as {
    id: string;
    name: string;
    duration_minutes?: number;
    max_capacity?: number;
  }[];
}
