import { getBookingByRef } from "@/app/actions/bookings";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle,
  Calendar,
  Clock,
  Users,
  Phone,
  Mail,
  Download,
  AlertCircle,
  Timer,
} from "lucide-react";

interface ConfirmationPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ref?: string; payment?: string }>;
}

export default async function ConfirmationPage({
  params,
  searchParams,
}: ConfirmationPageProps) {
  const { slug } = await params;
  const { ref, payment } = await searchParams;

  if (!ref) {
    notFound();
  }

  const booking = await getBookingByRef(ref);

  if (!booking) {
    notFound();
  }

  const typedBooking = booking as {
    id: string;
    ref_code: string;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    booking_date: string;
    start_time: string;
    pax: number;
    total_amount: number;
    status: string;
    notes: string | null;
    services: {
      name: string;
      description: string | null;
      duration_minutes: number;
    } | null;
    businesses: {
      name: string;
      contact_email: string | null;
      contact_phone: string | null;
    } | null;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ms-MY", {
      style: "currency",
      currency: "MYR",
    }).format(price);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${minutes} ${ampm}`;
  };

  const bookingDate = new Date(typedBooking.booking_date);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold bg-teal-600">
              {typedBooking.businesses?.name?.[0] || "N"}
            </div>
            <div>
              <h1 className="font-bold text-lg">
                {typedBooking.businesses?.name}
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-12">
        {/* Payment Status Banner */}
        {payment === "success" && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">Payment Successful</p>
              <p className="text-sm text-green-600">
                Your payment has been processed successfully.
              </p>
            </div>
          </div>
        )}
        {payment === "pending" && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-3">
            <Timer className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="font-medium text-yellow-800">Payment Pending</p>
              <p className="text-sm text-yellow-600">
                Your payment is being processed. We'll notify you once
                confirmed.
              </p>
            </div>
          </div>
        )}
        {payment === "failed" && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="font-medium text-red-800">Payment Failed</p>
              <p className="text-sm text-red-600">
                Your payment could not be processed. Please contact us for
                assistance.
              </p>
            </div>
          </div>
        )}

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            {payment === "success"
              ? "Booking Confirmed!"
              : payment === "pending"
                ? "Booking Received!"
                : payment === "failed"
                  ? "Booking Pending Payment"
                  : "Booking Confirmed!"}
          </h1>
          <p className="text-gray-500 mt-2">
            {payment === "pending"
              ? "Your booking is pending payment confirmation"
              : payment === "failed"
                ? "Please complete your payment to confirm booking"
                : "Your booking has been successfully submitted"}
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            {/* Reference Code */}
            <div className="text-center pb-6 border-b">
              <p className="text-sm text-gray-500 mb-1">Booking Reference</p>
              <p className="text-3xl font-mono font-bold text-teal-600">
                {typedBooking.ref_code}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                Please save this reference for your records
              </p>
            </div>

            {/* Booking Details */}
            <div className="py-6 space-y-4">
              <h3 className="font-semibold text-lg">
                {typedBooking.services?.name}
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium">
                      {bookingDate.toLocaleDateString("en-US", {
                        weekday: "short",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Time</p>
                    <p className="font-medium">
                      {formatTime(typedBooking.start_time)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Guests</p>
                    <p className="font-medium">
                      {typedBooking.pax} person
                      {typedBooking.pax !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="h-5 w-5 flex items-center justify-center text-gray-400 font-bold">
                    RM
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="font-bold text-teal-600">
                      {formatPrice(typedBooking.total_amount)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div className="py-6 border-t space-y-3">
              <h4 className="font-medium text-sm text-gray-500">
                Contact Details
              </h4>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <span>{typedBooking.customer_email}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span>{typedBooking.customer_phone}</span>
              </div>
            </div>

            {/* Notes */}
            {typedBooking.notes && (
              <div className="py-4 border-t">
                <h4 className="font-medium text-sm text-gray-500 mb-2">
                  Special Requests
                </h4>
                <p className="text-gray-700">{typedBooking.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Business Contact */}
        <Card className="mb-6 bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <p className="text-sm text-blue-800">
              <strong>Questions?</strong> Contact{" "}
              {typedBooking.businesses?.name}:
            </p>
            <div className="flex flex-wrap gap-4 mt-2 text-sm">
              {typedBooking.businesses?.contact_email && (
                <a
                  href={`mailto:${typedBooking.businesses.contact_email}`}
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Mail className="h-4 w-4" />
                  {typedBooking.businesses.contact_email}
                </a>
              )}
              {typedBooking.businesses?.contact_phone && (
                <a
                  href={`tel:${typedBooking.businesses.contact_phone}`}
                  className="text-blue-600 hover:underline flex items-center gap-1"
                >
                  <Phone className="h-4 w-4" />
                  {typedBooking.businesses.contact_phone}
                </a>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href={`/book/${slug}`} className="flex-1">
            <Button variant="outline" className="w-full">
              Book Another
            </Button>
          </Link>
          <Button className="flex-1 bg-teal-600 hover:bg-teal-700">
            <Download className="h-4 w-4 mr-2" />
            Download Receipt
          </Button>
        </div>

        <p className="text-center text-sm text-gray-500 mt-8">
          A confirmation email has been sent to {typedBooking.customer_email}
        </p>
      </main>
    </div>
  );
}
