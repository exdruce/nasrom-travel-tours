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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { createBooking, type CreateBookingInput } from "@/app/actions/bookings";
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

type BookingStep = "service" | "datetime" | "details" | "review" | "payment";

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
  });
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingId, setBookingId] = useState<string | null>(null);

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
      setSelectedAddons((prev) => [...prev, { addonId, quantity: totalPax }]);
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
        subtotal: totals.subtotal,
        addonsTotal: totals.addonsTotal,
        totalAmount: totals.total,
        notes: customerInfo.notes,
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
    else if (currentStep === "review") setCurrentStep("details");
    else if (currentStep === "payment") setCurrentStep("review");
  };

  const steps = [
    { id: "service", label: "Service" },
    { id: "datetime", label: "Date & Time" },
    { id: "details", label: "Details" },
    { id: "review", label: "Review" },
    { id: "payment", label: "Payment" },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            {business.logo_url ? (
              <Image
                src={business.logo_url}
                alt={business.name}
                width={40}
                height={40}
                className="rounded-lg"
              />
            ) : (
              <img
                src="/logo.svg"
                alt={business.name}
                className="w-10 h-10 rounded-lg"
              />
            )}
            <div>
              <h1 className="font-bold text-lg">{business.name}</h1>
              <p className="text-sm text-gray-500">Book your experience</p>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
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
                      <Check className="h-4 w-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-sm font-medium hidden sm:inline",
                      index === currentStepIndex
                        ? "text-gray-900"
                        : "text-gray-500",
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className="w-12 sm:w-24 h-px bg-gray-300 mx-2" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Step 1: Select Service */}
        {currentStep === "service" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold">Select a Service</h2>
              <p className="text-gray-500">
                Choose the experience you want to book
              </p>
            </div>
            <div className="grid gap-4">
              {services.map((service) => (
                <Card
                  key={service.id}
                  className={cn(
                    "cursor-pointer transition-all hover:shadow-md",
                    selectedService?.id === service.id && "ring-2",
                  )}
                  style={
                    selectedService?.id === service.id
                      ? { borderColor: primaryColor }
                      : {}
                  }
                  onClick={() => handleServiceSelect(service)}
                >
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center shrink-0">
                        {service.images?.[0] ? (
                          <Image
                            src={service.images[0]}
                            alt={service.name}
                            width={80}
                            height={80}
                            className="rounded-lg object-cover"
                          />
                        ) : (
                          <Package className="h-8 w-8 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">
                          {service.name}
                        </h3>
                        {service.description && (
                          <p className="text-gray-500 text-sm line-clamp-2 mt-1">
                            {service.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm">
                          <span
                            className="font-bold text-lg"
                            style={{ color: primaryColor }}
                          >
                            {service.variants.length > 0
                              ? `From ${formatPrice(Math.min(service.price, ...service.variants.map((v) => v.price)))}`
                              : formatPrice(service.price)}
                          </span>
                          <div className="flex items-center gap-1 text-gray-500">
                            <Clock className="h-4 w-4" />
                            {service.duration_minutes} min
                          </div>
                          <div className="flex items-center gap-1 text-gray-500">
                            <Users className="h-4 w-4" />
                            Max {service.max_capacity}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400 self-center" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Select Date & Time */}
        {currentStep === "datetime" && selectedService && (
          <div className="space-y-6">
            <Button variant="ghost" onClick={goBack} className="mb-2">
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>

            <div>
              <h2 className="text-2xl font-bold">Choose Date & Time</h2>
              <p className="text-gray-500">
                Select when you want to book {selectedService.name}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Date Selection */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Available Dates
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {availableDates.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                      {availableDates.slice(0, 12).map((date) => {
                        const d = new Date(date);
                        const isSelected = date === selectedDate;
                        return (
                          <button
                            key={date}
                            onClick={() => handleDateSelect(date)}
                            className={cn(
                              "p-3 rounded-lg border text-center transition-all",
                              isSelected
                                ? "text-white border-transparent"
                                : "hover:bg-gray-50",
                            )}
                            style={
                              isSelected
                                ? { backgroundColor: primaryColor }
                                : {}
                            }
                          >
                            <div className="text-xs uppercase">
                              {d.toLocaleDateString("en-US", {
                                weekday: "short",
                              })}
                            </div>
                            <div className="text-lg font-bold">
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
                    <p className="text-gray-500 text-center py-8">
                      No available dates
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Time Slots */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Available Times
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedDate && availabilityByDate[selectedDate] ? (
                    <div className="grid grid-cols-2 gap-2">
                      {availabilityByDate[selectedDate].map((slot) => {
                        const isSelected = slot.id === selectedSlot?.id;
                        const remaining = slot.capacity - slot.booked_count;
                        return (
                          <button
                            key={slot.id}
                            onClick={() => handleSlotSelect(slot)}
                            className={cn(
                              "p-3 rounded-lg border text-left transition-all",
                              isSelected
                                ? "text-white border-transparent"
                                : "hover:bg-gray-50",
                            )}
                            style={
                              isSelected
                                ? { backgroundColor: primaryColor }
                                : {}
                            }
                          >
                            <div className="font-medium">
                              {formatTime(slot.start_time)}
                            </div>
                            <div
                              className={cn(
                                "text-xs",
                                isSelected ? "text-white/80" : "text-gray-500",
                              )}
                            >
                              {remaining} spot{remaining !== 1 ? "s" : ""} left
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">
                      {selectedDate
                        ? "No times available"
                        : "Select a date first"}
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Variants Selection */}
            {selectedService.variants.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Select Guests
                  </CardTitle>
                  <CardDescription>
                    Choose the number of guests for each category
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedService.variants.map((variant) => {
                      const selected = selectedVariants.find(
                        (v) => v.variantId === variant.id,
                      );
                      const quantity = selected?.quantity || 0;
                      return (
                        <div
                          key={variant.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
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
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Gift className="h-5 w-5" />
                    Optional Add-ons
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedService.addons.map((addon) => {
                      const isSelected = selectedAddons.some(
                        (a) => a.addonId === addon.id,
                      );
                      return (
                        <div
                          key={addon.id}
                          className={cn(
                            "flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-all",
                            isSelected && "border-2",
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
                            className="font-bold"
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
            <Card className="sticky bottom-4">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">Total</div>
                    <div
                      className="text-2xl font-bold"
                      style={{ color: primaryColor }}
                    >
                      {formatPrice(totals.total)}
                    </div>
                    {totalPax > 0 && (
                      <div className="text-sm text-gray-500">
                        {totalPax} guest{totalPax !== 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                  <Button
                    size="lg"
                    disabled={!canProceedToDetails}
                    onClick={handleProceedToDetails}
                    style={{ backgroundColor: primaryColor }}
                  >
                    Continue
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Customer Details */}
        {currentStep === "details" && (
          <div className="space-y-6">
            <Button variant="ghost" onClick={goBack} className="mb-2">
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>

            <div>
              <h2 className="text-2xl font-bold">Your Details</h2>
              <p className="text-gray-500">Tell us how to contact you</p>
            </div>

            <Card>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Full Name *
                  </Label>
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={customerInfo.name}
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
                    onChange={(e) =>
                      setCustomerInfo({
                        ...customerInfo,
                        phone: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Special Requests (Optional)</Label>
                  <textarea
                    id="notes"
                    className="w-full min-h-[100px] px-3 py-2 border rounded-md resize-none"
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

            <Button
              size="lg"
              className="w-full"
              onClick={handleProceedToReview}
              style={{ backgroundColor: primaryColor }}
            >
              Review Booking
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 4: Review & Confirm */}
        {currentStep === "review" && selectedService && selectedSlot && (
          <div className="space-y-6">
            <Button variant="ghost" onClick={goBack} className="mb-2">
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>

            <div>
              <h2 className="text-2xl font-bold">Review Your Booking</h2>
              <p className="text-gray-500">
                Please confirm your booking details
              </p>
            </div>

            <Card>
              <CardContent className="p-6 space-y-6">
                {/* Service */}
                <div className="flex items-start gap-4 pb-4 border-b">
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
                <div className="pb-4 border-b">
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
                <div className="space-y-2">
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

            <Button
              size="lg"
              className="w-full"
              onClick={handleProceedToPayment}
              style={{ backgroundColor: primaryColor }}
            >
              Continue to Payment
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 5: Payment Method Selection */}
        {currentStep === "payment" && selectedService && selectedSlot && (
          <div className="space-y-6">
            <Button variant="ghost" onClick={goBack} className="mb-2">
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>

            <div>
              <h2 className="text-2xl font-bold">Select Payment Method</h2>
              <p className="text-gray-500">Choose how you would like to pay</p>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="space-y-3">
                  {PAYMENT_METHODS.map((method) => {
                    const isSelected = selectedPaymentMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        onClick={() => setSelectedPaymentMethod(method.id)}
                        className={cn(
                          "w-full flex items-center gap-4 p-4 border rounded-lg text-left transition-all",
                          isSelected ? "border-2" : "hover:bg-gray-50",
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
                            "w-10 h-10 rounded-full flex items-center justify-center",
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
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
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

            <Button
              size="lg"
              className="w-full"
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

            <p className="text-center text-sm text-gray-500">
              You will be redirected to complete your payment securely
            </p>
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
