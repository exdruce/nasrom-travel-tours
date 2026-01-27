import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ServiceForm } from "@/components/services/service-form";
import type { Service, ServiceVariant, ServiceAddon } from "@/types";

interface EditServicePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditServicePage({
  params,
}: EditServicePageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Get service with variants and addons
  const { data: serviceData, error } = await supabase
    .from("services")
    .select("*")
    .eq("id", id)
    .single();

  const service = serviceData as Service | null;

  if (error || !service) {
    notFound();
  }

  // Get variants
  const { data: variantsData } = await supabase
    .from("service_variants")
    .select("*")
    .eq("service_id", id)
    .order("sort_order", { ascending: true });

  const variants = (variantsData || []) as ServiceVariant[];

  // Get addons
  const { data: addonsData } = await supabase
    .from("service_addons")
    .select("*")
    .eq("service_id", id)
    .order("sort_order", { ascending: true });

  const addons = (addonsData || []) as ServiceAddon[];

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
          <h1 className="text-2xl font-bold text-gray-900">Edit Service</h1>
          <p className="text-gray-500">
            Update service details, variants, and add-ons
          </p>
        </div>
      </div>

      {/* Service Form with embedded variants and addons */}
      <ServiceForm service={service} variants={variants} addons={addons} />
    </div>
  );
}
