import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface AvailabilitySlot {
  capacity: number;
  booked_count: number;
  is_blocked: boolean;
  date: string;
  start_time: string;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slotId = searchParams.get("slot_id");
  const pax = parseInt(searchParams.get("pax") || "1", 10);

  if (!slotId) {
    return NextResponse.json({ error: "slot_id is required" }, { status: 400 });
  }

  if (isNaN(pax) || pax < 1) {
    return NextResponse.json(
      { error: "pax must be a positive number" },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("availability")
    .select("capacity, booked_count, is_blocked, date, start_time")
    .eq("id", slotId)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { available: false, error: "Slot not found" },
      { status: 404 },
    );
  }

  const slot = data as AvailabilitySlot;

  if (slot.is_blocked) {
    return NextResponse.json({
      available: false,
      remaining: 0,
      error: "This date is blocked",
    });
  }

  // Check if slot date is in the past
  const slotDate = new Date(`${slot.date}T${slot.start_time}`);
  if (slotDate < new Date()) {
    return NextResponse.json({
      available: false,
      remaining: 0,
      error: "This slot is in the past",
    });
  }

  const remaining = slot.capacity - slot.booked_count;
  const available = remaining >= pax;

  return NextResponse.json({
    available,
    remaining,
    capacity: slot.capacity,
    booked: slot.booked_count,
    error: available ? null : "Not enough capacity",
  });
}
