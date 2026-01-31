/**
 * Receipt PDF Download API
 * Generates and serves PDF receipt for a booking
 */

import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { ReceiptDocument, ReceiptData } from "@/lib/receipt";
import { generateQRCodeDataUrl } from "@/lib/qrcode";
import React from "react";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> },
) {
  try {
    const { bookingId } = await params;

    // Get Supabase client
    const supabase = await createClient();

    // Fetch booking with related data
    const { data: bookingData, error: bookingError } = await supabase
      .from("bookings")
      .select(
        `
        *,
        services (name, description),
        businesses (name, contact_email, contact_phone, address)
      `,
      )
      .eq("id", bookingId)
      .single();

    if (bookingError || !bookingData) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Type assertion for booking data
    const booking = bookingData as {
      id: string;
      ref_code: string;
      booking_date: string;
      start_time: string;
      created_at: string;
      status: string;
      customer_name: string;
      customer_email: string;
      customer_phone: string | null;
      pax: number;
      subtotal: number;
      addons_total: number;
      total_amount: number;
      services: { name: string; description: string | null } | null;
      businesses: {
        name: string;
        contact_email: string | null;
        contact_phone: string | null;
        address: string | null;
      } | null;
    };

    // Fetch booking items
    const { data: items } = await supabase
      .from("booking_items")
      .select("*")
      .eq("booking_id", bookingId)
      .order("type", { ascending: true });

    // Fetch passengers
    const { data: passengers } = await supabase
      .from("passengers")
      .select("full_name, passenger_type")
      .eq("booking_id", bookingId)
      .order("sort_order", { ascending: true });

    // Generate QR code
    const baseUrl =
      request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "";
    const verificationUrl = `${baseUrl}/verify/${booking.ref_code}`;
    const qrCodeDataUrl = await generateQRCodeDataUrl(verificationUrl, {
      size: 100,
    });

    // Build receipt data
    const receiptData: ReceiptData = {
      bookingRef: booking.ref_code,
      bookingDate: booking.booking_date,
      bookingTime: booking.start_time,
      createdAt: booking.created_at,
      status: booking.status,

      customerName: booking.customer_name,
      customerEmail: booking.customer_email,
      customerPhone: booking.customer_phone || "",

      serviceName: booking.services?.name || "Service",
      serviceDescription: booking.services?.description || undefined,
      pax: booking.pax,

      passengers: (passengers || []).map(
        (p: { full_name: string; passenger_type: string }) => ({
          full_name: p.full_name,
          passenger_type: p.passenger_type as "adult" | "child" | "infant",
        }),
      ),

      items: (items || []).map(
        (item: {
          name: string;
          quantity: number;
          unit_price: number;
          total_price: number;
          type: string;
        }) => ({
          name: item.name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price,
          type: item.type as "variant" | "addon",
        }),
      ),

      subtotal: booking.subtotal,
      addonsTotal: booking.addons_total,
      totalAmount: booking.total_amount,

      businessName: booking.businesses?.name || "Nasrom Travel & Tours",
      businessEmail: booking.businesses?.contact_email || undefined,
      businessPhone: booking.businesses?.contact_phone || undefined,
      businessAddress: booking.businesses?.address || undefined,

      qrCodeDataUrl,
    };

    // Generate PDF buffer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer = await renderToBuffer(
      React.createElement(ReceiptDocument, { data: receiptData }) as any,
    );

    // Return PDF response
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="receipt-${booking.ref_code}.pdf"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error generating receipt:", error);
    return NextResponse.json(
      { error: "Failed to generate receipt" },
      { status: 500 },
    );
  }
}
