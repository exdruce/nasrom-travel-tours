/**
 * Bayarcash Callback API Route
 * POST /api/bayarcash/callback
 *
 * Handles webhooks from Bayarcash for payment status updates
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyCallbackChecksum, mapBayarcashStatus } from "@/lib/bayarcash";

// Use service role client for webhook handling (no user session)
function getServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, serviceRoleKey);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const secretKey = process.env.BAYARCASH_API_SECRET_KEY;
    if (!secretKey) {
      console.error("Bayarcash secret key not configured");
      return NextResponse.json(
        { error: "Configuration error" },
        { status: 500 },
      );
    }

    // Verify checksum
    const receivedChecksum = body.checksum;
    if (!verifyCallbackChecksum(secretKey, body, receivedChecksum)) {
      console.error("Invalid checksum received");
      return NextResponse.json({ error: "Invalid checksum" }, { status: 400 });
    }

    const {
      order_number,
      transaction_id,
      exchange_reference_number,
      status,
      payer_bank_name,
      amount,
    } = body;

    const supabase = getServiceClient();

    // Find booking by order number (ref_code)
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id")
      .eq("ref_code", order_number)
      .single();

    if (bookingError || !booking) {
      console.error("Booking not found for order:", order_number);
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Find the payment record
    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("id")
      .eq("booking_id", booking.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (paymentError || !payment) {
      console.error("Payment not found for booking:", booking.id);
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Map Bayarcash status to our status
    const paymentStatus = mapBayarcashStatus(parseInt(status));

    // Update payment record
    await supabase
      .from("payments")
      .update({
        gateway_payment_id: transaction_id,
        exchange_ref_number: exchange_reference_number,
        payer_bank_code: payer_bank_name,
        status: paymentStatus,
        metadata: body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    // Update booking status based on payment result
    if (paymentStatus === "succeeded") {
      await supabase
        .from("bookings")
        .update({
          status: "confirmed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", booking.id);
    }

    // Log successful callback processing
    console.log(
      `Payment callback processed: order=${order_number}, status=${paymentStatus}, amount=${amount}`,
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Callback processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
