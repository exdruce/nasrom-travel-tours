import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

/**
 * Auto-Cancel Worker - Supabase Edge Function
 *
 * This function runs periodically to cancel expired pending bookings
 * and release their capacity back to availability slots.
 *
 * Can be triggered via:
 * 1. Supabase scheduled cron job (pg_cron extension)
 * 2. External cron service (e.g., Vercel Cron, cron-job.org)
 * 3. Manual invocation
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get Supabase client using service role for admin operations
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Call the cancel_expired_bookings function we created in the migration
    const { data, error } = await supabase.rpc("cancel_expired_bookings");

    if (error) {
      console.error("Error cancelling expired bookings:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const cancelledCount = data ?? 0;
    console.log(`Auto-cancel complete: ${cancelledCount} bookings cancelled`);

    return new Response(
      JSON.stringify({
        success: true,
        cancelled_count: cancelledCount,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
