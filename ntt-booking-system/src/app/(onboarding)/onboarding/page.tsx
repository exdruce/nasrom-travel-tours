"use client";

import { useState } from "react";
import { BusinessStep } from "@/components/onboarding/business-step";
import { ServiceStep } from "@/components/onboarding/service-step";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export default function OnboardingPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [businessId, setBusinessId] = useState<string | null>(null);

  const handleBusinessCreated = (id: string) => {
    setBusinessId(id);
    setStep(2);
  };

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-4">
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
              step === 1
                ? "bg-teal-600 text-white"
                : "bg-teal-100 text-teal-800",
            )}
          >
            1
          </div>
          <span
            className={cn(
              "text-sm font-medium",
              step === 1 ? "text-gray-900" : "text-gray-500",
            )}
          >
            Business Profile
          </span>
        </div>
        <div className="w-16 h-px bg-gray-200" />
        <div className="flex items-center gap-2">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold",
              step === 2
                ? "bg-teal-600 text-white"
                : "bg-gray-100 text-gray-500",
            )}
          >
            2
          </div>
          <span
            className={cn(
              "text-sm font-medium",
              step === 2 ? "text-gray-900" : "text-gray-500",
            )}
          >
            First Service
          </span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {step === 1
              ? "Tell us about your business"
              : "Create your first service"}
          </CardTitle>
          <CardDescription>
            {step === 1
              ? "This information will be displayed on your booking page."
              : "Add a service that customers can book right away."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {step === 1 && <BusinessStep onSuccess={handleBusinessCreated} />}
          {step === 2 && businessId && <ServiceStep businessId={businessId} />}
        </CardContent>
      </Card>
    </div>
  );
}
