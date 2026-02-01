/**
 * Bayarcash Return URL Handler
 * GET/POST /api/bayarcash/return
 *
 * Handles redirect from Bayarcash after payment completion
 * Since Bayarcash can't reach localhost for callbacks, we query the API for status
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getPaymentIntentStatus, mapBayarcashStatus } from "@/lib/bayarcash";

// Type definitions for database responses
interface PaymentWithBooking {
  id: string;
  status: string;
  booking_id: string;
  gateway_session_id?: string; // This is where we store PaymentIntent ID
  bookings: {
    ref_code: string;
    business_id: string;
    businesses: {
      slug: string;
    };
  };
}

async function handleReturn(request: NextRequest) {
  console.log("=== BAYARCASH RETURN HANDLER CALLED ===");
  console.log("Method:", request.method);

  const searchParams = request.nextUrl.searchParams;
  let paymentId = searchParams.get("payment_id");

  // Initialize variables for status info
  let statusId: string | null =
    searchParams.get("status_id") || searchParams.get("status");
  let transactionId: string | null = searchParams.get("transaction_id");
  let exchangeRefNo: string | null = searchParams.get(
    "exchange_reference_number",
  );

  // Check POST body for data
  if (request.method === "POST") {
    try {
      // Bayarcash usually sends x-www-form-urlencoded
      const contentType = request.headers.get("content-type") || "";

      if (
        contentType.includes("application/x-www-form-urlencoded") ||
        contentType.includes("multipart/form-data")
      ) {
        const formData = await request.formData();
        console.log("POST FormData:", Object.fromEntries(formData.entries()));

        statusId =
          statusId ||
          formData.get("status_id")?.toString() ||
          formData.get("status")?.toString() ||
          null;
        transactionId =
          transactionId || formData.get("transaction_id")?.toString() || null;
        exchangeRefNo =
          exchangeRefNo ||
          formData.get("exchange_reference_number")?.toString() ||
          null;
        paymentId = paymentId || formData.get("payment_id")?.toString() || null;
      } else if (contentType.includes("application/json")) {
        const body = await request.json();
        console.log("POST JSON:", body);

        statusId = statusId || body.status_id || body.status;
        transactionId = transactionId || body.transaction_id;
        exchangeRefNo = exchangeRefNo || body.exchange_reference_number;
        paymentId = paymentId || body.payment_id;
      }
    } catch (e) {
      console.error("Error parsing POST body:", e);
    }
  }

  console.log("Extracted Info:", { paymentId, statusId, transactionId });

  if (!paymentId) {
    console.log("No payment ID - redirecting to home");
    return NextResponse.redirect(new URL("/", request.url));
  }

  const supabase = createAdminClient();

  // Fetch payment and associated booking
  const { data: paymentData, error: paymentError } = await supabase
    .from("payments")
    .select(
      `
      id,
      status,
      booking_id,
      gateway_session_id,
      bookings (
        ref_code,
        business_id,
        businesses (
          slug
        )
      )
    `,
    )
    .eq("id", paymentId)
    .single();

  if (paymentError || !paymentData) {
    console.error("Payment not found:", paymentId, paymentError);
    return NextResponse.redirect(new URL("/", request.url));
  }

  const payment = paymentData as unknown as PaymentWithBooking;
  console.log("Payment found:", {
    id: payment.id,
    status: payment.status,
    paymentIntentId: payment.gateway_session_id,
  });

  // Extract booking info
  const businessSlug = payment.bookings?.businesses?.slug;
  const refCode = payment.bookings?.ref_code;

  if (!businessSlug || !refCode) {
    console.log("Missing business slug or ref code");
    return NextResponse.redirect(new URL("/", request.url));
  }

  console.log("Booking info:", { businessSlug, refCode });

  const protocol = request.headers.get("x-forwarded-proto") || "http";
  const host = request.headers.get("host");
  const appUrl = host
    ? `${protocol}://${host}`
    : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // If payment is pending/processing, try to update status
  if (payment.status === "pending" || payment.status === "processing") {
    // 1. Try to use status from Return URL params / POST body
    if (statusId) {
      console.log(`Found status in return request: ${statusId}`);
      try {
        const newStatus = mapBayarcashStatus(parseInt(statusId));
        console.log(`Mapped status: ${newStatus}`);

        if (newStatus === "succeeded" || newStatus === "failed") {
          // Update DB immediately
          console.log(
            `Updating payment ${paymentId} status from return params: ${payment.status} -> ${newStatus}`,
          );
          const { error: updateError } = await supabase
            .from("payments")
            .update({
              status: newStatus,
              gateway_payment_id: transactionId || undefined,
              exchange_ref_number: exchangeRefNo || undefined,
              updated_at: new Date().toISOString(),
            } as never)
            .eq("id", paymentId);

          if (!updateError) {
            // If Success, update booking too
            if (newStatus === "succeeded") {
              await supabase
                .from("bookings")
                .update({
                  status: "confirmed",
                  updated_at: new Date().toISOString(),
                } as never)
                .eq("id", payment.booking_id);

              return NextResponse.redirect(
                `${appUrl}/book/${businessSlug}/confirmation?ref=${refCode}&payment=success`,
              );
            } else {
              return NextResponse.redirect(
                `${appUrl}/book/${businessSlug}?ref=${refCode}&payment=failed`,
              );
            }
          }
        }
      } catch (e) {
        console.error("Error processing return status:", e);
      }
    }

    // 2. If no status in return request, query Bayarcash API
    console.log(
      `Payment is ${payment.status} - querying Bayarcash for status...`,
    );

    // Use Payment Intent ID if available, otherwise fallback to order number query (which we know fails for some reason)
    // But since we are saving gateway_session_id, we should use that.

    if (payment.gateway_session_id) {
      console.log(`Querying Payment Intent ID: ${payment.gateway_session_id}`);
      const txnResult = await getPaymentIntentStatus(
        payment.gateway_session_id,
      );
      console.log(
        "Bayarcash payment intent query result:",
        JSON.stringify(txnResult, null, 2),
      );

      if (txnResult.success && txnResult.status) {
        const newStatus = txnResult.status;
        console.log(`Bayarcash says status is: ${newStatus}`);

        // Update payment record with status from Bayarcash
        console.log(
          `Updating payment ${paymentId} status: ${payment.status} -> ${newStatus}`,
        );

        const { error: updateError } = await supabase
          .from("payments")
          .update({
            status: newStatus,
            gateway_payment_id: txnResult.transactionId || undefined,
            exchange_ref_number: txnResult.exchangeRefNumber || undefined,
            updated_at: new Date().toISOString(),
          } as never)
          .eq("id", paymentId);

        if (updateError) {
          console.error("Error updating payment:", updateError);
        } else {
          console.log("Payment updated successfully");
        }

        // If payment succeeded, update booking status to confirmed
        if (newStatus === "succeeded") {
          console.log("Payment succeeded - updating booking to confirmed");
          await supabase
            .from("bookings")
            .update({
              status: "confirmed",
              updated_at: new Date().toISOString(),
            } as never)
            .eq("id", payment.booking_id);

          return NextResponse.redirect(
            `${appUrl}/book/${businessSlug}/confirmation?ref=${refCode}&payment=success`,
          );
        } else if (newStatus === "failed") {
          console.log("Payment failed");
          return NextResponse.redirect(
            `${appUrl}/book/${businessSlug}?ref=${refCode}&payment=failed`,
          );
        }
      } else {
        console.log(
          "Could not get payment intent status from Bayarcash:",
          txnResult.error,
        );
      }
    } else {
      console.log(
        "No Payment Intent ID (gateway_session_id) found on payment record - cannot query status.",
      );
    }
  }

  // Check current payment status (may have been updated above or by callback)
  if (payment.status === "succeeded") {
    return NextResponse.redirect(
      `${appUrl}/book/${businessSlug}/confirmation?ref=${refCode}&payment=success`,
    );
  } else if (payment.status === "failed") {
    return NextResponse.redirect(
      `${appUrl}/book/${businessSlug}?ref=${refCode}&payment=failed`,
    );
  }

  // Payment still pending - redirect to confirmation with pending status
  console.log("Payment still pending - redirecting with pending status");
  return NextResponse.redirect(
    `${appUrl}/book/${businessSlug}/confirmation?ref=${refCode}&payment=pending`,
  );
}

// Bayarcash may use GET or POST for return URL
export async function GET(request: NextRequest) {
  return handleReturn(request);
}

export async function POST(request: NextRequest) {
  return handleReturn(request);
}
