"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  Mail,
  Phone,
  Download,
  FileText,
  CheckCircle,
  XCircle,
  Loader2,
  CreditCard,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { updateBookingStatus } from "@/app/actions/bookings";

// Types
interface BookingItem {
  id: string;
  type: "variant" | "addon";
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

interface Passenger {
  id: string;
  full_name: string;
  ic_passport: string;
  gender: "L" | "P";
  nationality: string;
  passenger_type: "adult" | "child" | "infant";
  calculated_age: number;
}

interface Service {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  method: string | null;
  created_at: string;
}

interface BusinessSettings {
  boat_name: string | null;
  boat_reg_no: string | null;
  default_destination: string | null;
}

interface Booking {
  id: string;
  ref_code: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  booking_date: string;
  start_time: string;
  pax: number;
  status: "pending" | "confirmed" | "completed" | "cancelled" | "no_show";
  subtotal: number;
  addons_total: number;
  total_amount: number;
  notes: string | null;
  internal_notes: string | null;
  created_at: string;
  expires_at: string | null;
  cancelled_at: string | null;
  cancelled_reason: string | null;
  services: Service | null;
  booking_items: BookingItem[];
  passengers: Passenger[];
}

interface BookingDetailClientProps {
  booking: Booking;
  payment: Payment | null;
  businessSettings: BusinessSettings | null;
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
  confirmed: "bg-green-100 text-green-800 border-green-300",
  completed: "bg-blue-100 text-blue-800 border-blue-300",
  cancelled: "bg-red-100 text-red-800 border-red-300",
  no_show: "bg-gray-100 text-gray-800 border-gray-300",
};

const paymentStatusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  succeeded: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  refunded: "bg-purple-100 text-purple-800",
};

export function BookingDetailClient({
  booking,
  payment,
  businessSettings,
}: BookingDetailClientProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Format helpers
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ms-MY", {
      style: "currency",
      currency: "MYR",
    }).format(price);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-MY", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(":");
    const h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-MY", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Actions
  const handleConfirm = async () => {
    setIsConfirming(true);
    try {
      const result = await updateBookingStatus(booking.id, "confirmed");
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Booking confirmed successfully!");
        window.location.reload();
      }
    } catch {
      toast.error("Failed to confirm booking");
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }

    setIsCancelling(true);
    try {
      const result = await updateBookingStatus(
        booking.id,
        "cancelled",
        cancelReason,
      );
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Booking cancelled");
        setShowCancelDialog(false);
        window.location.reload();
      }
    } catch {
      toast.error("Failed to cancel booking");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleDownloadManifest = () => {
    window.open(`/api/manifest/${booking.id}`, "_blank");
  };

  const handleDownloadReceipt = () => {
    window.open(`/api/receipt/${booking.id}`, "_blank");
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/bookings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Booking Details</h1>
            <p className="text-muted-foreground font-mono text-lg">
              {booking.ref_code}
            </p>
          </div>
        </div>
        <Badge
          variant="outline"
          className={`text-sm px-3 py-1 ${statusColors[booking.status]}`}
        >
          {booking.status.toUpperCase()}
        </Badge>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Content - 2 columns */}
        <div className="md:col-span-2 space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Name</p>
                  <p className="font-medium">{booking.customer_name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {booking.customer_email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Phone</p>
                  <p className="font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {booking.customer_phone || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Passengers
                  </p>
                  <p className="font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    {booking.pax} person(s)
                  </p>
                </div>
              </div>
              {booking.notes && (
                <div className="pt-3 border-t">
                  <p className="text-sm text-muted-foreground">
                    Customer Notes
                  </p>
                  <p className="text-sm">{booking.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Booking Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Booking Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Service</p>
                  <p className="font-medium">{booking.services?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="font-medium">
                    {booking.services?.duration_minutes} minutes
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(booking.booking_date)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {formatTime(booking.start_time)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Passengers */}
          {booking.passengers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Passenger List ({booking.passengers.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-2">#</th>
                        <th className="text-left py-2 px-2">Name</th>
                        <th className="text-left py-2 px-2">IC/Passport</th>
                        <th className="text-left py-2 px-2">Type</th>
                        <th className="text-left py-2 px-2">Age</th>
                        <th className="text-left py-2 px-2">Gender</th>
                      </tr>
                    </thead>
                    <tbody>
                      {booking.passengers.map((p, i) => (
                        <tr key={p.id} className="border-b last:border-0">
                          <td className="py-2 px-2">{i + 1}</td>
                          <td className="py-2 px-2 font-medium">
                            {p.full_name}
                          </td>
                          <td className="py-2 px-2 font-mono">
                            {p.ic_passport}
                          </td>
                          <td className="py-2 px-2 capitalize">
                            {p.passenger_type}
                          </td>
                          <td className="py-2 px-2">{p.calculated_age}</td>
                          <td className="py-2 px-2">
                            {p.gender === "L" ? "Male" : "Female"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Pricing Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {booking.booking_items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center py-2 border-b last:border-0"
                  >
                    <div>
                      <p className="font-medium">
                        {item.name}
                        {item.type === "addon" && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            Add-on
                          </Badge>
                        )}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatPrice(item.unit_price)} × {item.quantity}
                      </p>
                    </div>
                    <p className="font-medium">
                      {formatPrice(item.total_price)}
                    </p>
                  </div>
                ))}
                <div className="pt-4 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal</span>
                    <span>{formatPrice(booking.subtotal)}</span>
                  </div>
                  {booking.addons_total > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Add-ons</span>
                      <span>{formatPrice(booking.addons_total)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-teal-600">
                    <span>Total</span>
                    <span>{formatPrice(booking.total_amount)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Status */}
              {payment && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Payment Status
                    </span>
                    <Badge className={paymentStatusColors[payment.status]}>
                      {payment.status.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Last updated: {formatDateTime(payment.created_at)}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Confirm Button - only for pending */}
              {booking.status === "pending" && (
                <Button
                  onClick={handleConfirm}
                  disabled={isConfirming}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isConfirming ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Confirm Booking
                </Button>
              )}

              {/* Cancel Button - for pending/confirmed */}
              {["pending", "confirmed"].includes(booking.status) && (
                <Dialog
                  open={showCancelDialog}
                  onOpenChange={setShowCancelDialog}
                >
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancel Booking
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Cancel Booking</DialogTitle>
                      <DialogDescription>
                        Are you sure you want to cancel booking{" "}
                        {booking.ref_code}? This action cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Label htmlFor="cancel-reason">
                        Reason for cancellation
                      </Label>
                      <Textarea
                        id="cancel-reason"
                        placeholder="Enter reason..."
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        className="mt-2"
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setShowCancelDialog(false)}
                      >
                        Keep Booking
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleCancel}
                        disabled={isCancelling}
                      >
                        {isCancelling ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : null}
                        Confirm Cancel
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              <hr />

              {/* Download Actions */}
              <Button
                variant="outline"
                onClick={handleDownloadReceipt}
                className="w-full"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Receipt
              </Button>

              <Button
                variant="outline"
                onClick={handleDownloadManifest}
                className="w-full"
              >
                <FileText className="h-4 w-4 mr-2" />
                Print Manifest (Form JL)
              </Button>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Booking Info</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{formatDateTime(booking.created_at)}</span>
              </div>
              {booking.expires_at && booking.status === "pending" && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expires</span>
                  <span className="text-orange-600">
                    {formatDateTime(booking.expires_at)}
                  </span>
                </div>
              )}
              {booking.cancelled_at && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cancelled</span>
                  <span className="text-red-600">
                    {formatDateTime(booking.cancelled_at)}
                  </span>
                </div>
              )}
              {booking.cancelled_reason && (
                <div className="pt-2 border-t">
                  <p className="text-muted-foreground">Cancellation Reason:</p>
                  <p className="text-red-600">{booking.cancelled_reason}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Vessel Info */}
          {businessSettings && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Vessel Info</CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Boat Name</span>
                  <span>{businessSettings.boat_name || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Registration</span>
                  <span>{businessSettings.boat_reg_no || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Destination</span>
                  <span className="text-right max-w-[150px]">
                    {businessSettings.default_destination || "-"}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
