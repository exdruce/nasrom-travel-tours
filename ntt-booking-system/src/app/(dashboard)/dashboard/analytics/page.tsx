import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, Calendar, DollarSign } from "lucide-react";
import {
  ChartAreaInteractive,
  ChartDataPoint,
} from "@/components/chart-area-interactive";

export default async function AnalyticsPage() {
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

  // Check role permission
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const userProfile = profile as { role: string } | null;

  if (
    !userProfile ||
    (userProfile.role !== "admin" && userProfile.role !== "owner")
  ) {
    redirect("/dashboard");
  }

  const business = businessData as { id: string };

  // Get basic stats
  const today = new Date().toISOString().split("T")[0];

  // Total bookings
  const { count: totalBookings } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("business_id", business.id);

  // Today's bookings
  const { count: todayBookings } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("business_id", business.id)
    .eq("booking_date", today);

  // This month's bookings
  const startOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  )
    .toISOString()
    .split("T")[0];
  const { count: monthBookings } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("business_id", business.id)
    .gte("booking_date", startOfMonth);

  // Total revenue
  const { data: revenueRaw } = await supabase
    .from("bookings")
    .select("total_amount")
    .eq("business_id", business.id)
    .in("status", ["confirmed", "completed"]);

  const revenueData = (revenueRaw || []) as { total_amount: number | null }[];
  const totalRevenue = revenueData.reduce(
    (sum, b) => sum + (b.total_amount || 0),
    0,
  );

  // Active services
  const { count: activeServices } = await supabase
    .from("services")
    .select("*", { count: "exact", head: true })
    .eq("business_id", business.id)
    .eq("is_active", true);

  // ========== Chart Data: Daily aggregates for the last 90 days ==========
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
  const startDate = ninetyDaysAgo.toISOString().split("T")[0];

  const { data: dailyBookingsRaw } = await supabase
    .from("bookings")
    .select("booking_date, total_amount, status")
    .eq("business_id", business.id)
    .gte("booking_date", startDate)
    .order("booking_date", { ascending: true });

  // Type assertion for daily bookings
  const dailyBookings = (dailyBookingsRaw || []) as {
    booking_date: string;
    total_amount: number | null;
    status: string;
  }[];

  // Aggregate by date
  const dailyAggregates: Record<string, { revenue: number; bookings: number }> =
    {};

  for (const booking of dailyBookings) {
    const date = booking.booking_date;
    if (!dailyAggregates[date]) {
      dailyAggregates[date] = { revenue: 0, bookings: 0 };
    }
    dailyAggregates[date].bookings += 1;
    // Only count revenue from confirmed/completed bookings
    if (booking.status === "confirmed" || booking.status === "completed") {
      dailyAggregates[date].revenue += booking.total_amount || 0;
    }
  }

  // Convert to array for the chart
  const chartData: ChartDataPoint[] = Object.entries(dailyAggregates)
    .map(([date, values]) => ({
      date,
      revenue: values.revenue,
      bookings: values.bookings,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("ms-MY", {
      style: "currency",
      currency: "MYR",
    }).format(amount);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        <p className="text-gray-500">Track your business performance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-600">
              {formatCurrency(totalRevenue)}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              From confirmed bookings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Total Bookings
            </CardTitle>
            <Calendar className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBookings || 0}</div>
            <p className="text-xs text-gray-500 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              This Month
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthBookings || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Bookings this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">
              Today
            </CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayBookings || 0}</div>
            <p className="text-xs text-gray-500 mt-1">Bookings today</p>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Chart Section */}
      <div className="w-full">
        <ChartAreaInteractive data={chartData} />
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-teal-600">
              {activeServices || 0}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Services available for booking
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Average Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-teal-600">
              {totalBookings && totalBookings > 0
                ? formatCurrency(totalRevenue / totalBookings)
                : formatCurrency(0)}
            </div>
            <p className="text-sm text-gray-500 mt-1">Per booking</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
