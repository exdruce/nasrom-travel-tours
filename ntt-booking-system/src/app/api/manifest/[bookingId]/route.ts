/**
 * API Route: Generate Manifest PDF
 *
 * GET /api/manifest/[bookingId]
 * Returns a PDF document for download
 */

import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createAdminClient } from "@/lib/supabase/server";
import { ManifestDocument, type ManifestData } from "@/lib/manifest";

interface RouteParams {
  params: Promise<{ bookingId: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { bookingId } = await params;
    const supabase = createAdminClient();

    // Fetch booking with related data
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(
        `
        *,
        services (name),
        businesses (name, contact_email, contact_phone),
        availability (start_time, end_time)
      `,
      )
      .eq("id", bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    // Fetch passengers for this booking
    const { data: passengersData, error: passengersError } = await supabase
      .from("passengers")
      .select("*")
      .eq("booking_id", bookingId)
      .order("sort_order", { ascending: true });

    if (passengersError) {
      console.error("Error fetching passengers:", passengersError);
    }

    const passengers = (passengersData || []) as Array<{
      full_name: string;
      ic_passport: string;
      gender: "L" | "P";
      calculated_age: number;
      nationality: string;
      passenger_type: "adult" | "child" | "infant";
    }>;

    // Fetch business settings for boat info
    const typedBooking = booking as {
      ref_code: string;
      booking_date: string;
      start_time: string;
      business_id: string;
      services: { name: string } | null;
      businesses: {
        name: string;
        contact_email: string | null;
        contact_phone: string | null;
      } | null;
      availability: { start_time: string; end_time: string } | null;
    };

    const { data: settingsData } = await supabase
      .from("business_settings")
      .select("boat_name, boat_reg_no, default_destination, crew_count")
      .eq("business_id", typedBooking.business_id)
      .single();

    const settings = settingsData as {
      boat_name: string | null;
      boat_reg_no: string | null;
      default_destination: string | null;
      crew_count: number;
    } | null;

    // Build manifest data
    const manifestData: ManifestData = {
      bookingRef: typedBooking.ref_code,
      tripDate: typedBooking.booking_date,
      tripTime:
        typedBooking.availability?.start_time || typedBooking.start_time,
      boatName: settings?.boat_name || "NASROM CABIN 01",
      boatRegNo: settings?.boat_reg_no || "TRK 1234",
      destination:
        settings?.default_destination || "JETI TOK BALI - PULAU PERHENTIAN",
      operator:
        typedBooking.businesses?.name || "NASROM TRAVEL & TOURS SDN BHD",
      crewCount: settings?.crew_count || 2,
      passengers: passengers.map((p) => ({
        full_name: p.full_name.toUpperCase(),
        ic_passport: p.ic_passport,
        gender: p.gender,
        calculated_age: p.calculated_age,
        nationality: p.nationality.toUpperCase(),
        passenger_type: p.passenger_type,
      })),
    };

    // Generate PDF
    const pdfBuffer = await renderToBuffer(
      ManifestDocument({ data: manifestData }),
    );

    // Return PDF as response - convert Buffer to Uint8Array for NextResponse
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="manifest-${typedBooking.ref_code}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Error generating manifest PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate manifest" },
      { status: 500 },
    );
  }
}
