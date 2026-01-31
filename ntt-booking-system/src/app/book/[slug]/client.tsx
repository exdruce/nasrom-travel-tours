"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Clock,
  Users,
  ChevronRight,
  ChevronLeft,
  Package,
  Gift,
  Check,
  Loader2,
  Phone,
  Mail,
  User,
  CreditCard,
  Wallet,
  Building2,
  QrCode,
  UserCheck,
  AlertTriangle,
} from "lucide-react";
import { cn, getLocalDateString } from "@/lib/utils";
import { toast } from "sonner";
import { createBooking, type CreateBookingInput } from "@/app/actions/bookings";
import {
  PassengerForm,
  validatePassengers,
  type PassengerData,
} from "@/components/booking/PassengerForm";
import type {
  Business,
  Service,
  ServiceVariant,
  ServiceAddon,
  Availability,
} from "@/types";

interface ServiceWithExtras extends Service {
  variants: ServiceVariant[];
  addons: ServiceAddon[];
}

interface BookingPageClientProps {
  business: Business;
  services: ServiceWithExtras[];
  availability: Availability[];
  selectedServiceId?: string;
}

interface SelectedVariant {
  variantId: string;
  quantity: number;
}

interface SelectedAddon {
  addonId: string;
  quantity: number;
}

type BookingStep =
  | "service"
  | "datetime"
  | "details"
  | "passengers"
  | "review"
  | "payment";

type PaymentMethod =
  | "FPX"
  | "FPX_LINE_OF_CREDIT"
  | "DUITNOW_DOBW"
  | "DUITNOW_QR";

const PAYMENT_METHODS: {
  id: PaymentMethod;
  label: string;
  icon: React.ReactNode;
  description: string;
}[] = [
  {
    id: "FPX",
    label: "Online Banking (FPX)",
    icon: <Building2 className="h-5 w-5" />,
    description: "Pay via Malaysian bank",
  },
  {
    id: "FPX_LINE_OF_CREDIT",
    label: "FPX Line of Credit",
    icon: <CreditCard className="h-5 w-5" />,
    description: "Credit line via FPX",
  },
  {
    id: "DUITNOW_DOBW",
    label: "DuitNow Online Banking",
    icon: <Building2 className="h-5 w-5" />,
    description: "Pay with DuitNow via bank",
  },
  {
    id: "DUITNOW_QR",
    label: "DuitNow QR",
    icon: <QrCode className="h-5 w-5" />,
    description: "Scan & pay with any bank app",
  },
];

const MALAYSIAN_STATES = [
  "Johor",
  "Kedah",
  "Kelantan",
  "Melaka",
  "Negeri Sembilan",
  "Pahang",
  "Perak",
  "Perlis",
  "Pulau Pinang",
  "Sabah",
  "Sarawak",
  "Selangor",
  "Terengganu",
  "Wilayah Persekutuan (Kuala Lumpur)",
  "Wilayah Persekutuan (Labuan)",
  "Wilayah Persekutuan (Putrajaya)",
];

export function BookingPageClient({
  business,
  services,
  availability,
  selectedServiceId,
}: BookingPageClientProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<BookingStep>("service");
  const [selectedService, setSelectedService] =
    useState<ServiceWithExtras | null>(
      selectedServiceId
        ? services.find((s) => s.id === selectedServiceId) || null
        : null,
    );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<Availability | null>(null);
  const [selectedVariants, setSelectedVariants] = useState<SelectedVariant[]>(
    [],
  );
  const [selectedAddons, setSelectedAddons] = useState<SelectedAddon[]>([]);
  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    notes: "",
    address1: "",
    address2: "",
    postcode: "",
    city: "",
    state: "",
  });
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [passengers, setPassengers] = useState<PassengerData[]>([]);

  // Get branding colors
  const branding = business.branding as {
    primary_color?: string;
    secondary_color?: string;
  } | null;
  const primaryColor = branding?.primary_color || "#168D95";

  // Group availability by date
  const availabilityByDate = useMemo(() => {
    const map: Record<string, Availability[]> = {};
    for (const slot of availability) {
      // Filter by selected service if available
      if (
        selectedService &&
        slot.service_id &&
        slot.service_id !== selectedService.id
      ) {
        continue;
      }
      if (!slot.service_id || slot.service_id === selectedService?.id) {
        if (!map[slot.date]) map[slot.date] = [];
        // Only include slots with remaining capacity
        const remaining = slot.capacity - slot.booked_count;
        if (remaining > 0) {
          map[slot.date].push(slot);
        }
      }
    }
    return map;
  }, [availability, selectedService]);

  const availableDates = Object.keys(availabilityByDate).sort();

  // Calculate service availability stats for urgency badges
  const serviceAvailabilityStats = useMemo(() => {
    const stats: Record<
      string,
      { minSeats: number; nextDate: string | null; hasLowInventory: boolean }
    > = {};

    for (const service of services) {
      const serviceSlots = availability.filter(
        (slot) => !slot.service_id || slot.service_id === service.id,
      );

      // Get future dates only (use local timezone)
      const today = getLocalDateString();
      const futureSlots = serviceSlots.filter((slot) => slot.date >= today);

      if (futureSlots.length === 0) {
        stats[service.id] = {
          minSeats: 0,
          nextDate: null,
          hasLowInventory: false,
        };
        continue;
      }

      // Find the next available date and minimum seats across all future slots
      const sortedSlots = futureSlots.sort((a, b) =>
        a.date.localeCompare(b.date),
      );
      let minSeats = Infinity;
      let nextDate: string | null = null;

      for (const slot of sortedSlots) {
        const remaining = slot.capacity - slot.booked_count;
        if (remaining > 0) {
          if (!nextDate) nextDate = slot.date;
          if (remaining < minSeats) minSeats = remaining;
        }
      }

      stats[service.id] = {
        minSeats: minSeats === Infinity ? 0 : minSeats,
        nextDate,
        hasLowInventory: minSeats > 0 && minSeats <= 10,
      };
    }

    return stats;
  }, [availability, services]);

  // Calculate totals
  const totals = useMemo(() => {
    if (!selectedService) return { subtotal: 0, addonsTotal: 0, total: 0 };

    let subtotal = 0;

    if (selectedVariants.length > 0) {
      for (const sv of selectedVariants) {
        const variant = selectedService.variants.find(
          (v) => v.id === sv.variantId,
        );
        if (variant) {
          subtotal += variant.price * sv.quantity;
        }
      }
    } else {
      // Use base price if no variants selected
      subtotal = selectedService.price;
    }

    let addonsTotal = 0;
    for (const sa of selectedAddons) {
      const addon = selectedService.addons.find((a) => a.id === sa.addonId);
      if (addon) {
        addonsTotal += addon.price * sa.quantity;
      }
    }

    return { subtotal, addonsTotal, total: subtotal + addonsTotal };
  }, [selectedService, selectedVariants, selectedAddons]);

  const totalPax =
    selectedVariants.reduce((sum, v) => sum + v.quantity, 0) || 1;

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

  const handleServiceSelect = (service: ServiceWithExtras) => {
    setSelectedService(service);
    setSelectedDate(null);
    setSelectedSlot(null);
    setSelectedVariants([]);
    setSelectedAddons([]);
    setCurrentStep("datetime");
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedSlot(null);
  };

  const handleSlotSelect = (slot: Availability) => {
    setSelectedSlot(slot);
  };

  const handleVariantChange = (variantId: string, quantity: number) => {
    setSelectedVariants((prev) => {
      const existing = prev.find((v) => v.variantId === variantId);
      if (quantity === 0) {
        return prev.filter((v) => v.variantId !== variantId);
      }
      if (existing) {
        return prev.map((v) =>
          v.variantId === variantId ? { ...v, quantity } : v,
        );
      }
      return [...prev, { variantId, quantity }];
    });
  };

  const handleAddonToggle = (addonId: string, checked: boolean) => {
    if (checked) {
      setSelectedAddons((prev) => {
        if (prev.some((a) => a.addonId === addonId)) return prev;
        return [...prev, { addonId, quantity: totalPax }];
      });
    } else {
      setSelectedAddons((prev) => prev.filter((a) => a.addonId !== addonId));
    }
  };

  const canProceedToDetails =
    selectedSlot &&
    (selectedVariants.length > 0 || selectedService?.variants.length === 0);

  const handleProceedToDetails = () => {
    if (!canProceedToDetails) {
      toast.error("Please select a time slot and at least one pricing option");
      return;
    }
    setCurrentStep("details");
  };

  const handleProceedToReview = () => {
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone) {
      toast.error("Please fill in all required fields");
      return;
    }
    setCurrentStep("passengers");
  };

  const handleProceedFromPassengers = () => {
    const validation = validatePassengers(passengers);
    if (!validation.valid) {
      toast.error(validation.errors[0]);
      return;
    }
    setCurrentStep("review");
  };

  const handleProceedToPayment = () => {
    setCurrentStep("payment");
  };

  const handleSubmitBooking = async () => {
    if (!selectedService || !selectedSlot || !selectedPaymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    setIsSubmitting(true);
    try {
      // Build booking items for variants
      const items: CreateBookingInput["items"] = [];

      for (const sv of selectedVariants) {
        const variant = selectedService.variants.find(
          (v) => v.id === sv.variantId,
        );
        if (variant) {
          items.push({
            type: "variant",
            itemId: variant.id,
            name: variant.name,
            quantity: sv.quantity,
            unitPrice: variant.price,
          });
        }
      }

      // Build booking items for addons
      for (const sa of selectedAddons) {
        const addon = selectedService.addons.find((a) => a.id === sa.addonId);
        if (addon) {
          items.push({
            type: "addon",
            itemId: addon.id,
            name: addon.name,
            quantity: sa.quantity,
            unitPrice: addon.price,
          });
        }
      }

      // Step 1: Create the booking
      const result = await createBooking({
        businessId: business.id,
        serviceId: selectedService.id,
        availabilityId: selectedSlot.id,
        customerName: customerInfo.name,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
        bookingDate: selectedSlot.date,
        startTime: selectedSlot.start_time,
        pax: totalPax,
        items,
        passengers: passengers.map((p) => ({
          full_name: p.fullName,
          ic_passport: p.icPassport,
          dob: p.dob || null,
          calculated_age: p.calculatedAge,
          gender: p.gender,
          nationality: p.nationality,
          passenger_type: p.passengerType,
        })),
        subtotal: totals.subtotal,
        addonsTotal: totals.addonsTotal,
        totalAmount: totals.total,
        notes: `
${customerInfo.notes}

--- Address Details ---
Address: ${customerInfo.address1}
${customerInfo.address2 ? `Address 2: ${customerInfo.address2}` : ""}
Postcode: ${customerInfo.postcode}
City: ${customerInfo.city}
State: ${customerInfo.state}
`.trim(),
      });

      if ("error" in result) {
        const err = result.error as Record<string, string[] | undefined>;
        const errorMessage =
          err._form?.[0] ||
          Object.values(err)[0]?.[0] ||
          "Failed to create booking";
        toast.error(errorMessage);
        return;
      }

      // Step 2: Create payment intent and redirect to Bayarcash
      const paymentResponse = await fetch("/api/bayarcash/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: result.bookingId,
          paymentChannel: selectedPaymentMethod,
        }),
      });

      const paymentData = await paymentResponse.json();

      if (!paymentResponse.ok || !paymentData.success) {
        toast.error(paymentData.error || "Failed to initialize payment");
        // Still redirect to confirmation with pending status
        router.push(
          `/book/${business.slug}/confirmation?ref=${result.refCode}&payment=pending`,
        );
        return;
      }

      // Redirect to Bayarcash checkout
      toast.success("Redirecting to payment...");
      window.location.href = paymentData.checkoutUrl;
    } catch (error) {
      toast.error("Failed to submit booking. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const goBack = () => {
    if (currentStep === "datetime") setCurrentStep("service");
    else if (currentStep === "details") setCurrentStep("datetime");
    else if (currentStep === "passengers") setCurrentStep("details");
    else if (currentStep === "review") setCurrentStep("passengers");
    else if (currentStep === "payment") setCurrentStep("review");
  };

  const steps = [
    { id: "service", label: "Service" },
    { id: "datetime", label: "Date & Time" },
    { id: "details", label: "Details" },
    { id: "passengers", label: "Passengers" },
    { id: "review", label: "Review" },
    { id: "payment", label: "Payment" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50 transition-all duration-200">
        <div className="max-w-4xl mx-auto px-4 py-3 md:py-4">
          <div className="flex items-center gap-3">
            {business.logo_url ? (
              <Image
                src={business.logo_url}
                alt={business.name}
                width={40}
                height={40}
                className="rounded-lg w-8 h-8 md:w-10 md:h-10"
              />
            ) : (
              <img
                src="/logo.svg"
                alt={business.name}
                className="w-8 h-8 md:w-10 md:h-10 rounded-lg"
              />
            )}
            <div>
              <h1 className="font-serif font-bold text-lg md:text-xl leading-tight">
                {business.name}
              </h1>
              <p className="text-xs md:text-sm text-gray-500 hidden md:block">
                Book your experience
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white border-b sticky top-[57px] md:top-[73px] z-40 shadow-sm md:shadow-none overflow-x-auto no-scrollbar">
        <div className="max-w-4xl mx-auto px-4 py-3 md:py-4 min-w-max">
          <div className="flex items-center justify-between gap-4 md:gap-0">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center text-xs md:text-sm font-bold transition-colors",
                      index < currentStepIndex
                        ? "bg-green-500 text-white"
                        : index === currentStepIndex
                          ? "text-white"
                          : "bg-gray-200 text-gray-500",
                    )}
                    style={
                      index === currentStepIndex
                        ? { backgroundColor: primaryColor }
                        : {}
                    }
                  >
                    {index < currentStepIndex ? (
                      <Check className="h-3 w-3 md:h-4 md:w-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-xs md:text-sm font-medium whitespace-nowrap",
                      index === currentStepIndex
                        ? "text-gray-900"
                        : "text-gray-500",
                      // On mobile, only show current and next step label to save space
                      "block md:inline",
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className="w-8 md:w-24 h-px bg-gray-300 mx-2 hidden md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="w-full md:max-w-4xl mx-auto px-4 py-6 md:py-8 pb-32 md:pb-8">
        {/* Step 1: Select Service */}
        {currentStep === "service" && (
          <div className="space-y-6 booking-step-content">
            <div>
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-primary">
                Select a Service
              </h2>
              <p className="text-gray-500 text-sm md:text-base">
                Choose the experience you want to book
              </p>
            </div>
            <div className="grid gap-4">
              {services.map((service, index) => (
                <Card
                  key={service.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md booking-card animate-slide-up group active:scale-[0.98]",
                    selectedService?.id === service.id && "ring-2",
                    index === 0 && "stagger-1",
                    index === 1 && "stagger-2",
                    index === 2 && "stagger-3",
                  )}
                  style={
                    selectedService?.id === service.id
                      ? { borderColor: primaryColor }
                      : {}
                  }
                  onClick={() => handleServiceSelect(service)}
                >
                  <CardContent className="p-4 md:p-6">
                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Image - Full width on mobile if exists, else side block */}
                      <div className="w-full md:w-24 h-32 md:h-24 bg-gray-100 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                        {service.images?.[0] ? (
                          <Image
                            src={service.images[0]}
                            alt={service.name}
                            width={120}
                            height={120}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <Package className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h3 className="font-serif font-semibold text-lg md:text-xl text-primary leading-tight">
                            {service.name}
                          </h3>
                          <ChevronRight className="h-5 w-5 text-gray-400 md:hidden" />
                        </div>
                        {service.description && (
                          <p className="text-gray-500 text-xs md:text-sm line-clamp-2 mt-1">
                            {service.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-3 md:gap-4 mt-3 text-xs md:text-sm">
                          <div className="flex items-center gap-1 text-gray-500 bg-gray-50 px-2 py-1 rounded">
                            <Clock className="h-3 w-3 md:h-4 md:w-4" />
                            {service.duration_minutes} min
                          </div>
                          <div className="flex items-center gap-1 text-gray-500 bg-gray-50 px-2 py-1 rounded">
                            <Users className="h-3 w-3 md:h-4 md:w-4" />
                            Max {service.max_capacity}
                          </div>
                          {/* Low inventory urgency badge */}
                          {serviceAvailabilityStats[service.id]
                            ?.hasLowInventory && (
                            <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-semibold animate-pulse">
                              <AlertTriangle className="h-3 w-3" />
                              {
                                serviceAvailabilityStats[service.id].minSeats
                              }{" "}
                              Seats Left!
                            </div>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 self-center hidden md:block" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Select Date & Time */}
        {currentStep === "datetime" && selectedService && (
          <div className="space-y-6 booking-step-content pb-24 md:pb-0">
            <Button
              variant="ghost"
              onClick={goBack}
              className="mb-2 pl-0 hover:bg-transparent hover:text-primary"
            >
              <ChevronLeft className="h-5 w-5 mr-1" /> Back to Services
            </Button>

            <div>
              <h2 className="font-serif text-2xl md:text-3xl font-bold text-primary">
                Choose Date & Time
              </h2>
              <p className="text-gray-500 text-sm md:text-base">
                Select when you want to book {selectedService.name}
              </p>
            </div>

            <div className="flex flex-col md:grid md:grid-cols-2 gap-6">
              {/* Date Selection */}
              <Card className="border-0 shadow-none md:border md:shadow-sm">
                <CardHeader className="px-0 md:px-6 pt-0 md:pt-6">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Available Dates
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-0 md:px-6">
                  {availableDates.length > 0 ? (
                    <div className="flex overflow-x-auto pb-4 gap-2 no-scrollbar md:grid md:grid-cols-3 md:pb-0 snap-x snap-mandatory">
                      {availableDates.slice(0, 14).map((date) => {
                        const d = new Date(date);
                        const isSelected = date === selectedDate;
                        return (
                          <button
                            key={date}
                            onClick={() => handleDateSelect(date)}
                            className={cn(
                              "shrink-0 w-20 md:w-auto p-3 rounded-lg border text-center transition-all snap-center",
                              isSelected
                                ? "text-white border-transparent shadow-md transform scale-105"
                                : "hover:bg-gray-50 bg-white",
                            )}
                            style={
                              isSelected
                                ? { backgroundColor: primaryColor }
                                : {}
                            }
                          >
                            <div className="text-[10px] uppercase font-medium opacity-80">
                              {d.toLocaleDateString("en-US", {
                                weekday: "short",
                              })}
                            </div>
                            <div className="text-xl md:text-2xl font-bold my-1">
                              {d.getDate()}
                            </div>
                            <div className="text-xs">
                              {d.toLocaleDateString("en-US", {
                                month: "short",
                              })}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8 bg-gray-50 rounded-lg">
                      No available dates
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Time Slots */}
              <Card className="border-0 shadow-none md:border md:shadow-sm">
                <CardHeader className="px-0 md:px-6 pt-0 md:pt-6">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Available Times
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-0 md:px-6">
                  {selectedDate && availabilityByDate[selectedDate] ? (
                    <div className="grid grid-cols-2 gap-3">
                      {availabilityByDate[selectedDate].map((slot) => {
                        const isSelected = slot.id === selectedSlot?.id;
                        const remaining = slot.capacity - slot.booked_count;
                        return (
                          <button
                            key={slot.id}
                            onClick={() => handleSlotSelect(slot)}
                            className={cn(
                              "p-3 rounded-lg border text-left transition-all active:scale-95",
                              isSelected
                                ? "text-white border-transparent shadow-md"
                                : "hover:bg-gray-50 bg-white",
                            )}
                            style={
                              isSelected
                                ? { backgroundColor: primaryColor }
                                : {}
                            }
                          >
                            <div className="font-medium text-lg">
                              {formatTime(slot.start_time)}
                            </div>
                            <div
                              className={cn(
                                "text-xs flex items-center mt-1",
                                isSelected
                                  ? "text-white/80"
                                  : remaining <= 5
                                    ? "text-amber-600 font-semibold"
                                    : "text-gray-500",
                              )}
                            >
                              {remaining <= 5 && !isSelected && (
                                <AlertTriangle className="h-3 w-3 mr-1" />
                              )}
                              {remaining} spot{remaining !== 1 ? "s" : ""} left
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-gray-500 text-center py-12 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                      {selectedDate
                        ? "No times available for this date"
                        : "Please select a date above"}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Variants Selection */}
            {selectedService.variants.length > 0 && (
              <Card className="border-0 shadow-none md:border md:shadow-sm">
                <CardHeader className="px-0 md:px-6">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Select Guests
                  </CardTitle>
                  <CardDescription>
                    Choose the number of guests for each category
                  </CardDescription>
                </CardHeader>
                <CardContent className="px-0 md:px-6">
                  <div className="space-y-4">
                    {selectedService.variants.map((variant) => {
                      const selected = selectedVariants.find(
                        (v) => v.variantId === variant.id,
                      );
                      const quantity = selected?.quantity || 0;
                      return (
                        <div
                          key={variant.id}
                          className="flex items-center justify-between p-4 border rounded-lg bg-white"
                        >
                          <div>
                            <div className="font-medium">{variant.name}</div>
                            {variant.description && (
                              <div className="text-sm text-gray-500">
                                {variant.description}
                              </div>
                            )}
                            <div
                              className="font-bold mt-1"
                              style={{ color: primaryColor }}
                            >
                              {formatPrice(variant.price)}
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 md:h-10 md:w-10"
                              onClick={() =>
                                handleVariantChange(
                                  variant.id,
                                  Math.max(0, quantity - 1),
                                )
                              }
                              disabled={quantity === 0}
                            >
                              -
                            </Button>
                            <span className="w-8 text-center font-medium">
                              {quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 md:h-10 md:w-10"
                              onClick={() =>
                                handleVariantChange(variant.id, quantity + 1)
                              }
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Addons Selection */}
            {selectedService.addons.length > 0 && (
              <Card className="border-0 shadow-none md:border md:shadow-sm">
                <CardHeader className="px-0 md:px-6">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Gift className="h-5 w-5" />
                    Optional Add-ons
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-0 md:px-6">
                  <div className="space-y-3">
                    {selectedService.addons.map((addon) => {
                      const isSelected = selectedAddons.some(
                        (a) => a.addonId === addon.id,
                      );
                      return (
                        <div
                          key={addon.id}
                          className={cn(
                            "flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all active:scale-[0.99]",
                            isSelected && "border-2",
                            !isSelected && "bg-white",
                          )}
                          style={
                            isSelected
                              ? {
                                  borderColor: primaryColor,
                                  backgroundColor: `${primaryColor}10`,
                                }
                              : {}
                          }
                          onClick={() =>
                            handleAddonToggle(addon.id, !isSelected)
                          }
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) =>
                              handleAddonToggle(addon.id, !!checked)
                            }
                          />
                          <div className="flex-1">
                            <div className="font-medium">{addon.name}</div>
                            {addon.description && (
                              <div className="text-sm text-gray-500">
                                {addon.description}
                              </div>
                            )}
                          </div>
                          <div
                            className="font-bold whitespace-nowrap"
                            style={{ color: primaryColor }}
                          >
                            +{formatPrice(addon.price)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Summary & Continue */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-[0_-4px_10px_rgba(0,0,0,0.05)] md:relative md:bottom-auto md:left-auto md:right-auto md:p-0 md:border-0 md:shadow-none z-50 safe-area-bottom">
              <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="text-xs text-gray-500">Total</div>
                  <div
                    className="text-xl md:text-2xl font-bold leading-tight"
                    style={{ color: primaryColor }}
                  >
                    {formatPrice(totals.total)}
                  </div>
                  {totalPax > 0 && (
                    <div className="text-xs text-gray-500">
                      {totalPax} guest{totalPax !== 1 ? "s" : ""}
                    </div>
                  )}
                </div>
                <Button
                  size="lg"
                  className="flex-1 md:flex-none md:min-w-[200px]"
                  disabled={!canProceedToDetails}
                  onClick={handleProceedToDetails}
                  style={{ backgroundColor: primaryColor }}
                >
                  Continue
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Customer Details */}
        {currentStep === "details" && (
          <div className="space-y-6 booking-step-content pb-24 md:pb-0">
            <Button
              variant="ghost"
              onClick={goBack}
              className="mb-2 pl-0 hover:bg-transparent hover:text-primary"
            >
              <ChevronLeft className="h-5 w-5 mr-1" /> Back
            </Button>

            <div>
              <h2 className="text-2xl font-bold">Your Details</h2>
              <p className="text-gray-500">Tell us how to contact you</p>
            </div>

            <Card className="border-0 shadow-none md:border md:shadow-sm">
              <CardContent className="px-0 md:p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Full Name *
                  </Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={customerInfo.name}
                    className="h-12 text-base"
                    onChange={(e) =>
                      setCustomerInfo({ ...customerInfo, name: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Address *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john@example.com"
                    value={customerInfo.email}
                    className="h-12 text-base"
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        email: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Number *
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+60 12-345 6789"
                    value={customerInfo.phone}
                    className="h-12 text-base"
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        phone: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address1">Address Details</Label>
                  <Input
                    id="address1"
                    placeholder="Address Line 1"
                    value={customerInfo.address1}
                    className="h-12 text-base mb-2"
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        address1: e.target.value,
                      })
                    }
                  />
                  <Input
                    id="address2"
                    placeholder="Address Line 2 (Optional)"
                    value={customerInfo.address2}
                    className="h-12 text-base mb-2"
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        address2: e.target.value,
                      })
                    }
                  />
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <Input
                      id="postcode"
                      placeholder="Postcode"
                      value={customerInfo.postcode}
                      className="h-12 text-base"
                      onChange={(e) =>
                        setCustomerInfo({
                          ...customerInfo,
                          postcode: e.target.value,
                        })
                      }
                    />
                    <Input
                      id="city"
                      placeholder="City"
                      value={customerInfo.city}
                      className="h-12 text-base"
                      onChange={(e) =>
                        setCustomerInfo({
                          ...customerInfo,
                          city: e.target.value,
                        })
                      }
                    />
                  </div>
                  <Select
                    value={customerInfo.state}
                    onValueChange={(value) =>
                      setCustomerInfo({
                        ...customerInfo,
                        state: value,
                      })
                    }
                  >
                    <SelectTrigger className="h-12 text-base">
                      <SelectValue placeholder="Select State" />
                    </SelectTrigger>
                    <SelectContent>
                      {MALAYSIAN_STATES.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Special Requests (Optional)</Label>
                  <textarea
                    id="notes"
                    className="w-full min-h-[100px] px-3 py-2 border rounded-md resize-none text-base"
                    placeholder="Any special requirements or notes..."
                    value={customerInfo.notes}
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        notes: e.target.value,
                      })
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-[0_-4px_10px_rgba(0,0,0,0.05)] md:relative md:bottom-auto md:left-auto md:right-auto md:p-0 md:border-0 md:shadow-none z-50 safe-area-bottom">
              <div className="max-w-4xl mx-auto">
                <Button
                  size="lg"
                  className="w-full"
                  onClick={handleProceedToReview}
                  style={{ backgroundColor: primaryColor }}
                >
                  Passenger Details
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Passenger Details (Jabatan Laut Compliance) */}
        {currentStep === "passengers" && selectedSlot && (
          <div className="space-y-6 booking-step-content pb-24 md:pb-0">
            <Button
              variant="ghost"
              onClick={goBack}
              className="mb-2 pl-0 hover:bg-transparent hover:text-primary"
            >
              <ChevronLeft className="h-5 w-5 mr-1" /> Back
            </Button>

            <div>
              <h2 className="text-2xl font-bold">Passenger Details</h2>
              <p className="text-gray-500">
                Required by Jabatan Laut Malaysia for safety compliance
              </p>
            </div>

            <Card className="border-0 shadow-none md:border md:shadow-sm">
              <CardContent className="px-0 md:p-6">
                <PassengerForm
                  paxCount={totalPax}
                  tripDate={selectedSlot.date}
                  passengers={passengers}
                  onChange={setPassengers}
                />
              </CardContent>
            </Card>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-[0_-4px_10px_rgba(0,0,0,0.05)] md:relative md:bottom-auto md:left-auto md:right-auto md:p-0 md:border-0 md:shadow-none z-50 safe-area-bottom">
              <div className="max-w-4xl mx-auto">
                <Button
                  size="lg"
                  className="w-full text-lg h-12"
                  onClick={handleProceedFromPassengers}
                  style={{ backgroundColor: primaryColor }}
                >
                  Review Booking
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Review & Confirm */}
        {currentStep === "review" && selectedService && selectedSlot && (
          <div className="space-y-6 booking-step-content pb-24 md:pb-0">
            <Button
              variant="ghost"
              onClick={goBack}
              className="mb-2 pl-0 hover:bg-transparent hover:text-primary"
            >
              <ChevronLeft className="h-5 w-5 mr-1" /> Back
            </Button>

            <div>
              <h2 className="text-2xl font-bold">Review Your Booking</h2>
              <p className="text-gray-500">
                Please confirm your booking details
              </p>
            </div>

            <Card className="border-0 shadow-none md:border md:shadow-sm bg-transparent md:bg-white">
              <CardContent className="px-0 md:p-6 space-y-6">
                {/* Service */}
                <div className="flex items-start gap-4 pb-4 border-b bg-white p-4 rounded-lg md:bg-transparent md:p-0">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    <Package className="h-6 w-6 text-gray-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{selectedService.name}</h3>
                    <p className="text-sm text-gray-500">
                      {new Date(selectedSlot.date).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatTime(selectedSlot.start_time)} -{" "}
                      {formatTime(selectedSlot.end_time)}
                    </p>
                  </div>
                </div>

                {/* Guest Info */}
                <div className="pb-4 border-b bg-white p-4 rounded-lg md:bg-transparent md:p-0">
                  <h4 className="font-medium mb-2">Guest Information</h4>
                  <div className="text-sm space-y-1">
                    <p>
                      <span className="text-gray-500">Name:</span>{" "}
                      {customerInfo.name}
                    </p>
                    <p>
                      <span className="text-gray-500">Email:</span>{" "}
                      {customerInfo.email}
                    </p>
                    <p>
                      <span className="text-gray-500">Phone:</span>{" "}
                      {customerInfo.phone}
                    </p>
                    {customerInfo.notes && (
                      <p>
                        <span className="text-gray-500">Notes:</span>{" "}
                        {customerInfo.notes}
                      </p>
                    )}
                  </div>
                </div>

                {/* Pricing Breakdown */}
                <div className="space-y-2 bg-white p-4 rounded-lg md:bg-transparent md:p-0">
                  <h4 className="font-medium">Price Breakdown</h4>
                  {selectedVariants.map((sv) => {
                    const variant = selectedService.variants.find(
                      (v) => v.id === sv.variantId,
                    );
                    if (!variant) return null;
                    return (
                      <div
                        key={sv.variantId}
                        className="flex justify-between text-sm"
                      >
                        <span>
                          {variant.name} × {sv.quantity}
                        </span>
                        <span>{formatPrice(variant.price * sv.quantity)}</span>
                      </div>
                    );
                  })}
                  {selectedVariants.length === 0 && (
                    <div className="flex justify-between text-sm">
                      <span>{selectedService.name}</span>
                      <span>{formatPrice(selectedService.price)}</span>
                    </div>
                  )}
                  {selectedAddons.map((sa) => {
                    const addon = selectedService.addons.find(
                      (a) => a.id === sa.addonId,
                    );
                    if (!addon) return null;
                    return (
                      <div
                        key={sa.addonId}
                        className="flex justify-between text-sm"
                      >
                        <span>{addon.name}</span>
                        <span>+{formatPrice(addon.price * sa.quantity)}</span>
                      </div>
                    );
                  })}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span style={{ color: primaryColor }}>
                      {formatPrice(totals.total)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-[0_-4px_10px_rgba(0,0,0,0.05)] md:relative md:bottom-auto md:left-auto md:right-auto md:p-0 md:border-0 md:shadow-none z-50 safe-area-bottom">
              <div className="max-w-4xl mx-auto">
                <Button
                  size="lg"
                  className="w-full text-lg h-12"
                  onClick={handleProceedToPayment}
                  style={{ backgroundColor: primaryColor }}
                >
                  Continue to Payment
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Payment Method Selection */}
        {currentStep === "payment" && selectedService && selectedSlot && (
          <div className="space-y-6 booking-step-content pb-24 md:pb-0">
            <Button
              variant="ghost"
              onClick={goBack}
              className="mb-2 pl-0 hover:bg-transparent hover:text-primary"
            >
              <ChevronLeft className="h-5 w-5 mr-1" /> Back
            </Button>

            <div>
              <h2 className="text-2xl font-bold">Select Payment Method</h2>
              <p className="text-gray-500">Choose how you would like to pay</p>
            </div>

            <Card className="border-0 shadow-none md:border md:shadow-sm">
              <CardContent className="px-0 md:p-6">
                <div className="space-y-3">
                  {PAYMENT_METHODS.map((method) => {
                    const isSelected = selectedPaymentMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        onClick={() => setSelectedPaymentMethod(method.id)}
                        className={cn(
                          "w-full flex items-center gap-4 p-4 border rounded-lg text-left transition-all active:scale-[0.99]",
                          isSelected ? "border-2" : "hover:bg-gray-50 bg-white",
                        )}
                        style={
                          isSelected
                            ? {
                                borderColor: primaryColor,
                                backgroundColor: `${primaryColor}10`,
                              }
                            : {}
                        }
                      >
                        <div
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                            isSelected
                              ? "text-white"
                              : "bg-gray-100 text-gray-600",
                          )}
                          style={
                            isSelected ? { backgroundColor: primaryColor } : {}
                          }
                        >
                          {method.icon}
                        </div>
                        <div className="flex-1">
                          <div className="font-medium">{method.label}</div>
                          <div className="text-sm text-gray-500">
                            {method.description}
                          </div>
                        </div>
                        {isSelected && (
                          <Check
                            className="h-5 w-5"
                            style={{ color: primaryColor }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Order Summary */}
            <Card className="border-0 shadow-none md:border md:shadow-sm bg-gray-50 md:bg-white rounded-lg p-0">
              <CardHeader className="md:px-6 px-4">
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 md:px-6 px-4">
                <div className="flex justify-between text-sm">
                  <span>{selectedService.name}</span>
                  <span>{formatPrice(totals.subtotal)}</span>
                </div>
                {totals.addonsTotal > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Add-ons</span>
                    <span>{formatPrice(totals.addonsTotal)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span style={{ color: primaryColor }}>
                    {formatPrice(totals.total)}
                  </span>
                </div>
              </CardContent>
            </Card>

            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-[0_-4px_10px_rgba(0,0,0,0.05)] md:relative md:bottom-auto md:left-auto md:right-auto md:p-0 md:border-0 md:shadow-none z-50 safe-area-bottom">
              <div className="max-w-4xl mx-auto space-y-2">
                <Button
                  size="lg"
                  className="w-full text-lg h-12"
                  onClick={handleSubmitBooking}
                  disabled={isSubmitting || !selectedPaymentMethod}
                  style={{ backgroundColor: primaryColor }}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>Pay {formatPrice(totals.total)}</>
                  )}
                </Button>
                <p className="text-center text-xs text-gray-500 md:hidden">
                  Secure payment by Bayarcash
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t py-6 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center text-sm text-gray-500">
          <p>Powered by NTT Booking System</p>
          <p className="mt-1">
            © {new Date().getFullYear()} {business.name}
          </p>
        </div>
      </footer>
    </div>
  );
}
