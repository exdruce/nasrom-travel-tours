"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { z } from "zod";
import { nanoid } from "nanoid";

// Validation schemas
const bookingItemSchema = z.object({
  type: z.enum(["variant", "addon"]),
  itemId: z.string().uuid(),
  name: z.string(),
  quantity: z.number().min(1),
  unitPrice: z.number().min(0),
});

const passengerSchema = z.object({
  full_name: z.string().min(1),
  ic_passport: z.string().min(1),
  dob: z.string().nullable().optional(),
  calculated_age: z.number().min(0),
  gender: z.enum(["L", "P"]),
  nationality: z.string().min(1),
  passenger_type: z.enum(["adult", "child", "infant"]),
});

const createBookingSchema = z.object({
  businessId: z.string().uuid(),
  serviceId: z.string().uuid(),
  availabilityId: z.string().uuid(),
  customerName: z.string().min(1, "Name is required"),
  customerEmail: z.string().email("Invalid email"),
  customerPhone: z.string().min(1, "Phone is required"),
  bookingDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  startTime: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  pax: z.number().min(1),
  items: z.array(bookingItemSchema),
  passengers: z.array(passengerSchema).optional(),
  subtotal: z.number().min(0),
  addonsTotal: z.number().min(0),
  totalAmount: z.number().min(0),
  notes: z.string().optional(),
});

export type CreateBookingInput = z.infer<typeof createBookingSchema>;

function generateRefCode(): string {
  // Format: NTT-XXXXXX (uppercase alphanumeric)
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "NTT-";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export async function createBooking(input: CreateBookingInput) {
  const supabase = createAdminClient();

  // Validate input
  const validated = createBookingSchema.safeParse(input);
  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors };
  }

  const data = validated.data;

  // Verify the availability slot exists and has capacity
  const { data: slot, error: slotError } = await supabase
    .from("availability")
    .select("id, capacity, booked_count, is_blocked")
    .eq("id", data.availabilityId)
    .single();

  if (slotError || !slot) {
    return { error: { _form: ["Time slot not found"] } };
  }

  const typedSlot = slot as {
    id: string;
    capacity: number;
    booked_count: number;
    is_blocked: boolean;
  };

  if (typedSlot.is_blocked) {
    return { error: { _form: ["This date is blocked for bookings"] } };
  }

  const remaining = typedSlot.capacity - typedSlot.booked_count;
  if (remaining < data.pax) {
    return { error: { _form: [`Only ${remaining} spots remaining`] } };
  }

  // Fetch business settings for auto-cancel timeout
  let autoCancelMinutes = 30; // Default 30 minutes
  let autoCancelEnabled = true;

  const { data: settings } = await supabase
    .from("business_settings")
    .select("auto_cancel_timeout, auto_cancel_enabled")
    .eq("business_id", data.businessId)
    .single();

  if (settings) {
    const typedSettings = settings as {
      auto_cancel_timeout: number;
      auto_cancel_enabled: boolean;
    };
    autoCancelMinutes = typedSettings.auto_cancel_timeout;
    autoCancelEnabled = typedSettings.auto_cancel_enabled;
  }

  // Calculate expires_at based on business settings
  const expiresAt = autoCancelEnabled
    ? new Date(Date.now() + autoCancelMinutes * 60 * 1000).toISOString()
    : null;

  // Generate unique reference code
  const refCode = generateRefCode();

  // Create booking with expires_at
  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .insert({
      ref_code: refCode,
      business_id: data.businessId,
      service_id: data.serviceId,
      availability_id: data.availabilityId,
      customer_name: data.customerName,
      customer_email: data.customerEmail,
      customer_phone: data.customerPhone,
      booking_date: data.bookingDate,
      start_time: data.startTime,
      pax: data.pax,
      status: "pending",
      subtotal: data.subtotal,
      addons_total: data.addonsTotal,
      total_amount: data.totalAmount,
      notes: data.notes || null,
      expires_at: expiresAt,
    } as never)
    .select()
    .single();

  if (bookingError) {
    console.error("Create booking error:", bookingError);
    return { error: { _form: [bookingError.message] } };
  }

  const typedBooking = booking as { id: string; ref_code: string };

  // Insert passengers if provided
  if (data.passengers && data.passengers.length > 0) {
    const passengerRecords = data.passengers.map((p, index) => ({
      booking_id: typedBooking.id,
      full_name: p.full_name.toUpperCase(),
      ic_passport: p.ic_passport,
      dob: p.dob || null,
      calculated_age: p.calculated_age,
      gender: p.gender,
      nationality: p.nationality.toUpperCase(),
      passenger_type: p.passenger_type,
      sort_order: index,
    }));

    const { error: passengersError } = await supabase
      .from("passengers")
      .insert(passengerRecords as never[]);

    if (passengersError) {
      console.error("Create passengers error:", passengersError);
      // Don't fail the whole booking, passengers can be added later
    }
  }

  // Create booking items
  if (data.items.length > 0) {
    const bookingItems = data.items.map((item) => ({
      booking_id: typedBooking.id,
      type: item.type,
      item_id: item.itemId,
      name: item.name,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.unitPrice * item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from("booking_items")
      .insert(bookingItems as never[]);

    if (itemsError) {
      console.error("Create booking items error:", itemsError);
      // Don't fail the whole booking, items are supplementary
    }
  }

  // Update availability booked_count
  const { error: updateError } = await supabase
    .from("availability")
    .update({ booked_count: typedSlot.booked_count + data.pax } as never)
    .eq("id", data.availabilityId);

  if (updateError) {
    console.error("Update availability error:", updateError);
  }

  return {
    success: true,
    bookingId: typedBooking.id,
    refCode: typedBooking.ref_code,
  };
}

export async function getBookingByRef(refCode: string) {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("bookings")
    .select(
      `
      *,
      services (name, description, duration_minutes),
      businesses (name, contact_email, contact_phone)
    `,
    )
    .eq("ref_code", refCode)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export async function cancelBooking(bookingId: string, reason?: string) {
  const supabase = createAdminClient();

  // Get booking to check availability
  const { data: booking } = await supabase
    .from("bookings")
    .select("availability_id, pax, status")
    .eq("id", bookingId)
    .single();

  if (!booking) {
    return { error: "Booking not found" };
  }

  const typedBooking = booking as {
    availability_id: string | null;
    pax: number;
    status: string;
  };

  if (typedBooking.status === "cancelled") {
    return { error: "Booking is already cancelled" };
  }

  // Update booking status
  const { error: updateError } = await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      cancelled_reason: reason || null,
    } as never)
    .eq("id", bookingId);

  if (updateError) {
    return { error: updateError.message };
  }

  // Release capacity if availability exists
  if (typedBooking.availability_id) {
    const { data: slot } = await supabase
      .from("availability")
      .select("booked_count")
      .eq("id", typedBooking.availability_id)
      .single();

    if (slot) {
      const typedSlot = slot as { booked_count: number };
      await supabase
        .from("availability")
        .update({
          booked_count: Math.max(0, typedSlot.booked_count - typedBooking.pax),
        } as never)
        .eq("id", typedBooking.availability_id);
    }
  }

  return { success: true };
}

export async function updateBookingStatus(
  bookingId: string,
  newStatus: "pending" | "confirmed" | "completed" | "cancelled" | "no_show",
  reason?: string,
) {
  const supabase = createAdminClient();

  // Get current booking
  const { data: booking } = await supabase
    .from("bookings")
    .select("availability_id, pax, status")
    .eq("id", bookingId)
    .single();

  if (!booking) {
    return { error: "Booking not found" };
  }

  const typedBooking = booking as {
    availability_id: string | null;
    pax: number;
    status: string;
  };

  // If cancelling, use the existing cancelBooking logic (releases capacity)
  if (newStatus === "cancelled") {
    return cancelBooking(bookingId, reason);
  }

  // Build update object
  const updateData: Record<string, unknown> = {
    status: newStatus,
  };

  // If confirming, clear the expires_at so it doesn't get auto-cancelled
  if (newStatus === "confirmed" && typedBooking.status === "pending") {
    updateData.expires_at = null;
  }

  // Update booking
  const { error: updateError } = await supabase
    .from("bookings")
    .update(updateData as never)
    .eq("id", bookingId);

  if (updateError) {
    return { error: updateError.message };
  }

  return { success: true };
}
