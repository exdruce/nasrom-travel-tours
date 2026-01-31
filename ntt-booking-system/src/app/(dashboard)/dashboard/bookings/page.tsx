import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  Calendar,
  Users,
  Mail,
  Phone,
  Search,
  Filter,
  ChevronRight,
} from "lucide-react";

type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

const statusColors: Record<BookingStatus, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-green-100 text-green-800",
  completed: "bg-blue-100 text-blue-800",
  cancelled: "bg-red-100 text-red-800",
};

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

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("ms-MY", {
      style: "currency",
      currency: "MYR",
    }).format(amount);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Bookings</h2>
          <p className="text-gray-500">Manage customer bookings</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Pending</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-teal-100 rounded-lg">
                <Calendar className="h-5 w-5 text-teal-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Today</p>
                <p className="text-2xl font-bold">{todayBookings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Upcoming</p>
                <p className="text-2xl font-bold">{upcomingBookings.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bookings List */}
      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          {bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Calendar className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">
                No bookings yet
              </h3>
              <p className="text-gray-500 mt-1">
                When customers make bookings, they will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="min-w-[70px]">
                      <div className="text-sm font-medium text-gray-500">
                        {formatDate(booking.booking_date).split(",")[0]}
                      </div>
                      <div className="text-lg font-bold">
                        {new Date(booking.booking_date).getDate()}
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatTime(booking.start_time)}
                      </div>
                    </div>
                    <div className="border-l pl-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {booking.customer_name}
                        </span>
                        <Badge className={statusColors[booking.status]}>
                          {booking.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.services?.name || "Service"}
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {booking.pax} pax
                        </span>
                        <span className="font-mono">{booking.ref_code}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-teal-600">
                      {formatCurrency(booking.total_amount)}
                    </div>
                    <Link href={`/dashboard/bookings/${booking.id}`}>
                      <Button variant="ghost" size="sm" className="mt-1">
                        View
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
