import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ServiceForm } from "@/components/services/service-form";

export default function NewServicePage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/services">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Create New Service
          </h1>
          <p className="text-gray-500">
            Add a new bookable package or service for your customers
          </p>
        </div>
      </div>

      {/* Form */}
      <ServiceForm />
    </div>
  );
}
