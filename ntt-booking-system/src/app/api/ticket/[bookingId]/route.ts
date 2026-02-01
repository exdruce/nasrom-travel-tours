/**
 * Ticket PDF Download API
 * Generates and serves PDF ticket for a booking
 */

import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@/lib/supabase/server";
import { TicketDocument, TicketData } from "@/lib/ticket";
import { generateQRCodeDataUrl } from "@/lib/qrcode";
import React from "react";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> },
) {
  try {
    const { bookingId } = await params;
    const supabase = await createClient();

    // Fetch booking with related data
    const { data: bookingData, error: bookingError } = await supabase
      .from("bookings")
      .select(
        `
        *,
        services (name),
        businesses (name, address)
      `,
      )
      .eq("id", bookingId)
      .single();

    if (bookingError || !bookingData) {
      console.error("Booking error:", bookingError);
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Explicit Type assertion
    const booking = bookingData as {
      id: string;
      business_id: string; // Ensure we have this
      ref_code: string;
      booking_date: string;
      start_time: string;
      pax: number;
      services: { name: string } | null;
      businesses: { name: string; address: string | null } | null;
    };

    // Fetch business settings separately
    const { data: settingsData } = (await supabase
      .from("business_settings")
      .select("boat_name, default_destination")
      .eq("business_id", booking.business_id)
      .single()) as {
      data: {
        boat_name: string | null;
        default_destination: string | null;
      } | null;
    };

    // Fetch passengers
    const { data: passengers } = await supabase
      .from("passengers")
      .select("full_name, passenger_type, ic_passport")
      .eq("booking_id", bookingId)
      .order("sort_order", { ascending: true });

    // Generate QR code
    const baseUrl =
      request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "";
    const verificationUrl = `${baseUrl}/verify/${booking.ref_code}`;
    const qrCodeDataUrl = await generateQRCodeDataUrl(verificationUrl, {
      size: 150, // Slightly larger for ticket
    });

    // Build ticket data
    const ticketData: TicketData = {
      bookingRef: booking.ref_code,
      bookingDate: booking.booking_date,
      bookingTime: booking.start_time,

      serviceName: booking.services?.name || "Ferry Service",
      destination: settingsData?.default_destination || "Pulau Perhentian",
      boatName: settingsData?.boat_name || undefined,

      pax: booking.pax,
      passengers: (passengers || []).map((p: any) => ({
        full_name: p.full_name,
        passenger_type: p.passenger_type,
        ic_passport: p.ic_passport,
      })),

      businessName: booking.businesses?.name || "Nasrom Travel & Tours",
      businessAddress: booking.businesses?.address || undefined,

      qrCodeDataUrl,
    };

    // Generate PDF buffer
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pdfBuffer = await renderToBuffer(
      React.createElement(TicketDocument, { data: ticketData }) as any,
    );

    // Return PDF response
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="ticket-${booking.ref_code}.pdf"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("Error generating ticket:", error);
    return NextResponse.json(
      { error: "Failed to generate ticket" },
      { status: 500 },
    );
  }
}
