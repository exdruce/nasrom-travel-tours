import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { BookingDetailClient } from "./client";

interface BookingDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function BookingDetailPage({
  params,
}: BookingDetailPageProps) {
  const { id } = await params;

  const supabase = await createClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user's business
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!business) {
    redirect("/onboarding");
  }

  // Type assertion for business
  const typedBusiness = business as { id: string };

  // Fetch booking with full details
  const { data: booking, error } = await supabase
    .from("bookings")
    .select(
      `
      *,
      services (id, name, description, duration_minutes),
      availability (date, start_time, end_time),
      booking_items (*),
      passengers (*)
    `,
    )
    .eq("id", id)
    .eq("business_id", typedBusiness.id)
    .single();

  if (error || !booking) {
    notFound();
  }

  // Fetch payment info
  const { data: payment } = await supabase
    .from("payments")
    .select("*")
    .eq("booking_id", id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Fetch business settings
  const { data: settings } = await supabase
    .from("business_settings")
    .select("boat_name, boat_reg_no, default_destination")
    .eq("business_id", typedBusiness.id)
    .single();

  return (
    <BookingDetailClient
      booking={booking}
      payment={payment}
      businessSettings={settings}
    />
  );
}
