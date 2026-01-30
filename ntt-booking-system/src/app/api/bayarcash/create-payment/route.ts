/**
 * Bayarcash Create Payment API Route
 * POST /api/bayarcash/create-payment
 *
 * Creates a payment intent and returns the checkout URL
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import {
  createPaymentIntent,
  type PaymentChannel,
  PRIMARY_CHANNELS,
} from "@/lib/bayarcash";

// Type definitions for database responses
interface BookingRecord {
  id: string;
  ref_code: string;
  status: string;
  total_amount: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
}

interface PaymentRecord {
  id: string;
  status: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      bookingId,
      paymentChannel,
    }: {
      bookingId: string;
      paymentChannel: PaymentChannel;
    } = body;

    if (!bookingId) {
      return NextResponse.json(
        { error: "Booking ID is required" },
        { status: 400 },
      );
    }

    if (!paymentChannel || !PRIMARY_CHANNELS.includes(paymentChannel)) {
      return NextResponse.json(
        { error: "Invalid payment channel" },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    // Fetch booking details
    const { data: bookingData, error: bookingError } = await supabase
      .from("bookings")
      .select(
        "id, ref_code, status, total_amount, customer_name, customer_email, customer_phone",
      )
      .eq("id", bookingId)
      .single();

    if (bookingError || !bookingData) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const booking = bookingData as unknown as BookingRecord;

    // Check if booking is in pending status
    if (booking.status !== "pending") {
      return NextResponse.json(
        { error: "Booking is not in pending status" },
        { status: 400 },
      );
    }

    // Check for existing pending payment
    const { data: existingPaymentData } = await supabase
      .from("payments")
      .select("id, status")
      .eq("booking_id", bookingId)
      .eq("status", "pending")
      .single();

    let paymentId: string;

    if (existingPaymentData) {
      const existingPayment = existingPaymentData as unknown as PaymentRecord;
      paymentId = existingPayment.id;
    } else {
      // Create payment record

      const { data: newPaymentData, error: paymentError } = await supabase
        .from("payments")
        .insert({
          booking_id: bookingId,
          amount: booking.total_amount,
          currency: "MYR",
          status: "pending",
          payment_gateway: "bayarcash",
          method: paymentChannel.toLowerCase(),
        } as never)
        .select("id")
        .single();

      if (paymentError || !newPaymentData) {
        console.error("Failed to create payment record:", paymentError);
        return NextResponse.json(
          {
            error:
              "Failed to create payment record: " +
              (paymentError?.message || "Unknown error"),
          },
          { status: 500 },
        );
      }

      const newPayment = newPaymentData as unknown as PaymentRecord;
      paymentId = newPayment.id;
    }

    // Build return URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const returnUrl = `${appUrl}/api/bayarcash/return?payment_id=${paymentId}`;

    // Create payment intent with Bayarcash
    const result = await createPaymentIntent({
      orderNumber: booking.ref_code,
      amount: booking.total_amount,
      payerName: booking.customer_name,
      payerEmail: booking.customer_email,
      payerPhone: booking.customer_phone || "",
      paymentChannel,
      returnUrl,
    });

    if (!result.success || !result.url) {
      // Update payment status to failed
      await supabase
        .from("payments")
        .update({ status: "failed" } as never)
        .eq("id", paymentId);

      return NextResponse.json(
        { error: result.error || "Failed to create payment" },
        { status: 500 },
      );
    }

    // Update payment with gateway session ID
    await supabase
      .from("payments")
      .update({
        gateway_session_id: result.paymentIntentId,
        status: "processing",
      } as never)
      .eq("id", paymentId);

    return NextResponse.json({
      success: true,
      checkoutUrl: result.url,
      paymentId,
    });
  } catch (error) {
    console.error("Create payment error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
