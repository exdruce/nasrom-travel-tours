import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * API Route: Auto-Cancel Cron Endpoint
 *
 * Designed for use with cron-job.org (free tier) or similar services.
 *
 * Setup Instructions for cron-job.org:
 * 1. Go to https://cron-job.org and create free account
 * 2. Create new cron job with URL: https://your-domain.vercel.app/api/cron/auto-cancel
 * 3. Set schedule: Every 1-5 minutes (recommended: every 2 minutes)
 * 4. Request method: GET
 * 5. (Optional) Add header: x-api-key = your-secret-key
 *
 * Environment Variables (optional but recommended for production):
 * - CRON_SECRET: Secret key for authenticating cron requests
 */

export async function GET(request: NextRequest) {
  // Check for authorization - supports multiple header formats
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    // Check x-api-key header (cron-job.org style)
    const apiKey = request.headers.get("x-api-key");
    // Check Authorization header (Vercel Cron style)
    const authHeader = request.headers.get("authorization");
    const bearerToken = authHeader?.replace("Bearer ", "");

    if (apiKey !== cronSecret && bearerToken !== cronSecret) {
      console.warn(
        "Unauthorized cron attempt from:",
        request.headers.get("x-forwarded-for"),
      );
      return NextResponse.json(
        { error: "Unauthorized", message: "Invalid or missing API key" },
        { status: 401 },
      );
    }
  }

  const supabase = createAdminClient();
  const startTime = Date.now();

  try {
    // Call the cancel_expired_bookings function
    const { data, error } = await supabase.rpc("cancel_expired_bookings");

    if (error) {
      console.error("Error cancelling expired bookings:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    const cancelledCount = data ?? 0;
    const duration = Date.now() - startTime;

    console.log(
      `[CRON] Auto-cancel complete: ${cancelledCount} cancelled in ${duration}ms`,
    );

    return NextResponse.json({
      success: true,
      cancelled_count: cancelledCount,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Unexpected cron error:", err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// Support both GET and POST for flexibility with different cron services
export async function POST(request: NextRequest) {
  return GET(request);
}
