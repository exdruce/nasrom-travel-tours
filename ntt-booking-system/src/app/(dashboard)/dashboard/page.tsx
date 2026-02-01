import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  Clock,
  DollarSign,
  Users,
  Globe,
  Copy,
  ExternalLink,
  Package,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { CopyButton } from "./copy-button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Get profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Get business
  const { data: businessData } = await supabase
    .from("businesses")
    .select("*")
    .eq("owner_id", user.id)
    .single();

  if (!businessData) redirect("/onboarding");

  const business = businessData as {
    id: string;
    slug: string;
    is_published: boolean;
    name: string;
  };

  // Get stats
  const today = new Date().toISOString().split("T")[0];
  const startOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  )
    .toISOString()
    .split("T")[0];

  // Bookings this month
  const { count: monthBookings } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("business_id", business.id)
    .gte("booking_date", startOfMonth);

  // Pending bookings
  const { count: pendingBookings } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("business_id", business.id)
    .eq("status", "pending");

  // Revenue this month
  const { data: revenueRaw } = await supabase
    .from("bookings")
    .select("total_amount")
    .eq("business_id", business.id)
    .in("status", ["confirmed", "completed"])
    .gte("booking_date", startOfMonth);

  const revenueData = (revenueRaw || []) as { total_amount: number | null }[];
  const monthRevenue = revenueData.reduce(
    (sum, b) => sum + (b.total_amount || 0),
    0,
  );

  // Unique customers
  const { data: customersRaw } = await supabase
    .from("bookings")
    .select("customer_email")
    .eq("business_id", business.id);

  const customersData = (customersRaw || []) as { customer_email: string }[];
  const uniqueCustomers = new Set(customersData.map((b) => b.customer_email))
    .size;

  // Services count
  const { count: servicesCount } = await supabase
    .from("services")
    .select("*", { count: "exact", head: true })
    .eq("business_id", business.id)
    .eq("is_active", true);

  // Availability count
  const { count: slotsCount } = await supabase
    .from("availability")
    .select("*", { count: "exact", head: true })
    .eq("business_id", business.id)
    .gte("date", today)
    .eq("is_blocked", false);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("ms-MY", {
      style: "currency",
      currency: "MYR",
    }).format(amount);

  const bookingUrl = "https://book.jetitokbali.com/book/nasrom-travel-tours";

  const stats = [
    {
      title: "Bookings",
      value: monthBookings?.toString() || "0",
      description: "This month",
      icon: CalendarDays,
    },
    {
      title: "Pending",
      value: pendingBookings?.toString() || "0",
      description: "Awaiting confirmation",
      icon: Clock,
    },
    {
      title: "Revenue",
      value: formatCurrency(monthRevenue),
      description: "This month",
      icon: DollarSign,
    },
    {
      title: "Customers",
      value: uniqueCustomers.toString(),
      description: "Total unique",
      icon: Users,
    },
  ];

  // Setup checklist
  const steps = [
    {
      title: "Create your business profile",
      description: "Set up your business name, logo, and details",
      done: true,
      href: "/dashboard/settings",
    },
    {
      title: "Add your services",
      description: "Define what customers can book",
      done: (servicesCount || 0) > 0,
      href: "/dashboard/services/new",
    },
    {
      title: "Set availability",
      description: "Configure when customers can book",
      done: (slotsCount || 0) > 0,
      href: "/dashboard/calendar",
    },
  ];

  const allStepsComplete = steps.every((s) => s.done);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-4xl font-bold text-primary">
          Welcome back,{" "}
          {(profile as { full_name?: string | null } | null)?.full_name?.split(
            " ",
          )[0] || "there"}
          !
        </h1>
        <p className="text-gray-500 mt-1">
          Here&apos;s what&apos;s happening with your business today.
        </p>
      </div>

      {/* Booking URL Card - Prominent */}
      <Card className="border-2 border-primary/20 bg-linear-to-r from-primary/5 to-secondary/20 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/10 rounded-full blur-3xl -mr-16 -mt-16" />
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-teal-100 rounded-lg">
                <Globe className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <h3 className="font-semibold text-lg">Your Booking Page</h3>
                <p className="text-sm text-gray-500 mb-2">
                  Share this link with customers
                </p>
                <div className="flex items-center gap-2">
                  <code className="bg-white px-3 py-1.5 rounded border text-sm font-mono">
                    {bookingUrl}
                  </code>
                  <Badge
                    className={
                      business.is_published ? "bg-green-500" : "bg-yellow-500"
                    }
                  >
                    {business.is_published ? "Live" : "Draft"}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <CopyButton slug={business.slug} />
              <Button asChild>
                <Link href={bookingUrl} target="_blank">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Preview
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <CardDescription>{stat.description}</CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Setup Checklist */}
      {!allStepsComplete && (
        <Card>
          <CardHeader>
            <CardTitle>Getting Started</CardTitle>
            <CardDescription>
              Complete these steps to start accepting bookings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {steps.map((step, index) => (
                <Link
                  key={step.title}
                  href={step.href}
                  className={`flex items-center gap-4 p-4 rounded-lg transition-colors ${
                    step.done ? "bg-green-50" : "bg-gray-50 hover:bg-gray-100"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      step.done
                        ? "bg-green-500 text-white"
                        : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {step.done ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="flex-1">
                    <p
                      className={`font-medium ${
                        step.done ? "text-green-700" : "text-gray-900"
                      }`}
                    >
                      {step.title}
                    </p>
                    <p
                      className={`text-sm ${
                        step.done ? "text-green-600" : "text-gray-500"
                      }`}
                    >
                      {step.description}
                    </p>
                  </div>
                  {!step.done && (
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  )}
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <div className="grid md:grid-cols-3 gap-4">
        <Link href="/dashboard/services">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <Package className="h-8 w-8 text-teal-600" />
              <div>
                <p className="font-medium">Services</p>
                <p className="text-sm text-gray-500">
                  {servicesCount || 0} active
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/calendar">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <CalendarDays className="h-8 w-8 text-teal-600" />
              <div>
                <p className="font-medium">Availability</p>
                <p className="text-sm text-gray-500">
                  {slotsCount || 0} upcoming slots
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/dashboard/bookings">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6 flex items-center gap-4">
              <Clock className="h-8 w-8 text-teal-600" />
              <div>
                <p className="font-medium">Bookings</p>
                <p className="text-sm text-gray-500">View all bookings</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
