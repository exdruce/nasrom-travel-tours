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

  // Generate unique reference code
  const refCode = generateRefCode();

  // Create booking
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
    } as never)
    .select()
    .single();

  if (bookingError) {
    console.error("Create booking error:", bookingError);
    return { error: { _form: [bookingError.message] } };
  }

  const typedBooking = booking as { id: string; ref_code: string };

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
