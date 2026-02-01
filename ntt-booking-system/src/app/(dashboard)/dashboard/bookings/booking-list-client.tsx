"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  Filter,
  Users,
  Calendar,
  ChevronRight,
  MoreHorizontal,
  Eye,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

const statusColors: Record<BookingStatus, string> = {
  pending:
    "bg-yellow-100 text-yellow-800 hover:bg-yellow-100/80 border-yellow-200",
  confirmed:
    "bg-green-100 text-green-800 hover:bg-green-100/80 border-green-200",
  completed: "bg-blue-100 text-blue-800 hover:bg-blue-100/80 border-blue-200",
  cancelled: "bg-red-100 text-red-800 hover:bg-red-100/80 border-red-200",
};

interface Booking {
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
}

interface BookingListClientProps {
  initialBookings: Booking[];
}

export function BookingListClient({ initialBookings }: BookingListClientProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredBookings = initialBookings.filter((booking) => {
    const matchesSearch =
      booking.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.ref_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.customer_email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || booking.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

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

  const statuses = ["all", "pending", "confirmed", "completed", "cancelled"];

  return (
    <div className="space-y-4">
      {/* Mobile-Optimized Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between">
        <div className="relative flex-1 w-full md:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search bookings..."
            className="pl-9 w-full bg-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Mobile: Horizontal Scrollable Status Pills */}
        <div className="md:hidden w-[calc(100%+2rem)] -mx-4 px-4 overflow-x-auto pb-2 hide-scrollbar">
          <div className="flex gap-2">
            {statuses.map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? "default" : "outline"}
                size="sm"
                onClick={() => setStatusFilter(status)}
                className="capitalize whitespace-nowrap rounded-full h-8"
              >
                {status}
              </Button>
            ))}
          </div>
        </div>

        {/* Desktop: Standard Filter Button Group or Select (Stick to pills for consistency?) 
            Actually, let's use the same pills for desktop but wrapped or just the pills.
            Or keep the Select for Desktop? The Select was fine. 
            Let's keep Select for Desktop to save horizontal space if list is long.
        */}
        <div className="hidden md:block">
          {/* Reusing the pill design for desktop too as it's cleaner than a select for 5 items */}
          <div className="flex gap-2 bg-gray-100/50 p-1 rounded-lg border">
            {statuses.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium rounded-md transition-all capitalize",
                  statusFilter === status
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50",
                )}
              >
                {status === "all" ? "All" : status}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block border rounded-lg overflow-hidden bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50/50">
              <TableHead>Reference</TableHead>
              <TableHead>Date & Time</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Service</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBookings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No bookings found.
                </TableCell>
              </TableRow>
            ) : (
              filteredBookings.map((booking) => (
                <TableRow key={booking.id} className="hover:bg-gray-50/50">
                  <TableCell className="font-mono text-xs text-gray-500">
                    {booking.ref_code}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">
                        {formatDate(booking.booking_date)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(booking.start_time)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">
                        {booking.customer_name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {booking.pax} Pax
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {booking.services?.name || "Service"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={`${statusColors[booking.status]} border-0 capitalize`}
                    >
                      {booking.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(booking.total_amount)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <Link href={`/dashboard/bookings/${booking.id}`}>
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                        </Link>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Mobile Card View - Optimized */}
      <div className="md:hidden space-y-3">
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed text-sm">
            No bookings found matching your search.
          </div>
        ) : (
          filteredBookings.map((booking) => (
            <Link
              href={`/dashboard/bookings/${booking.id}`}
              key={booking.id}
              className="block group"
            >
              <Card className="overflow-hidden border shadow-sm active:scale-[0.99] transition-transform">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                        {booking.ref_code}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-500 font-medium">
                        {formatDate(booking.booking_date)}
                      </span>
                    </div>
                    <Badge
                      variant="outline"
                      className={`${statusColors[booking.status]} border-0 text-[10px] px-2 py-0.5 h-auto capitalize shrink-0`}
                    >
                      {booking.status}
                    </Badge>
                  </div>

                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-bold text-gray-900 line-clamp-1 text-base">
                      {booking.customer_name}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3 text-gray-600 min-w-0 flex-1 mr-2">
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Users className="h-3.5 w-3.5" />
                        <span className="text-xs font-medium">
                          {booking.pax}
                        </span>
                      </div>
                      <div className="h-3 w-px bg-gray-300 shrink-0"></div>
                      <div className="flex items-center gap-1.5 overflow-hidden min-w-0">
                        <span className="text-xs truncate">
                          {booking.services?.name}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-teal-600">
                        {formatCurrency(booking.total_amount)}
                      </span>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
