import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Clock, Calendar, Users } from "lucide-react";
import { BookingListClient } from "./booking-list-client";

type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

export default async function BookingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get business
  const { data: businessData } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!businessData) redirect("/onboarding");

  const business = businessData as { id: string };

  // Get bookings with service info
  const { data: bookingsRaw } = await supabase
    .from("bookings")
    .select(
      `
      *,
      services (name)
    `,
    )
    .eq("business_id", business.id)
    .order("booking_date", { ascending: false })
    .order("start_time", { ascending: false })
    .limit(50);

  const bookings = (bookingsRaw || []) as Array<{
    id: string;
    ref_code: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    booking_date: string;
    start_time: string;
    pax: number;
    status: BookingStatus;
    total_amount: number;
    created_at: string;
    services: { name: string } | null;
  }>;

  const today = new Date().toISOString().split("T")[0];

  // Stats
  const pendingCount = bookings.filter((b) => b.status === "pending").length;
  const todayBookings = bookings.filter(
    (b) => b.booking_date === today && b.status !== "cancelled",
  );
  const upcomingBookings = bookings.filter(
    (b) => b.booking_date > today && b.status !== "cancelled",
  );

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-bold tracking-tight">
            Bookings
          </h2>
          <p className="text-sm md:text-base text-gray-500">
            Manage customer bookings
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="flex overflow-x-auto pb-4 gap-4 md:grid md:grid-cols-3 md:pb-0 hide-scrollbar -mx-4 px-4 md:mx-0 md:px-0 snap-x snap-mandatory">
        <Card className="min-w-[240px] md:min-w-0 snap-center border-none shadow-none bg-transparent xs:border xs:shadow-sm xs:bg-card">
          <CardContent className="p-4 md:pt-6 bg-white rounded-xl border shadow-sm md:border-none md:shadow-none">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg shrink-0">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Pending</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="min-w-[240px] md:min-w-0 snap-center border-none shadow-none bg-transparent xs:border xs:shadow-sm xs:bg-card">
          <CardContent className="p-4 md:pt-6 bg-white rounded-xl border shadow-sm md:border-none md:shadow-none">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-teal-100 rounded-lg shrink-0">
                <Calendar className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Today</p>
                <p className="text-2xl font-bold">{todayBookings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="min-w-[240px] md:min-w-0 snap-center border-none shadow-none bg-transparent xs:border xs:shadow-sm xs:bg-card">
          <CardContent className="p-4 md:pt-6 bg-white rounded-xl border shadow-sm md:border-none md:shadow-none">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg shrink-0">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Upcoming</p>
                <p className="text-2xl font-bold">{upcomingBookings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bookings List Client Component */}
      <div className="space-y-4">
        <BookingListClient initialBookings={bookings} />
      </div>
    </div>
  );
}
