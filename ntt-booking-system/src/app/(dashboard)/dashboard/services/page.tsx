import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Package, Eye, EyeOff } from "lucide-react";
import { ServiceCard } from "@/components/services/service-card";
import type { Service, ServiceVariant, ServiceAddon } from "@/types";

interface ServiceWithCounts extends Service {
  variantCount: number;
  addonCount: number;
}

export default async function ServicesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // Get user's business
  const { data: businessData } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  const business = businessData as { id: string } | null;

  if (!business) {
    return null;
  }

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
    // Staff should not access service management
    // Redirect to dashboard or maybe a "view only" page if needed, but per plan redirect to dashboard
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-xl font-bold text-red-600">Access Denied</h2>
        <p className="text-gray-600 mt-2">
          You do not have permission to manage services.
        </p>
      </div>
    );
  }

  // Get services for this business
  const { data: servicesData } = await supabase
    .from("services")
    .select("*")
    .eq("business_id", business.id)
    .order("sort_order", { ascending: true });

  const rawServices = (servicesData || []) as Service[];

  // Get variant counts for all services
  const { data: variantsData } = await supabase
    .from("service_variants")
    .select("service_id")
    .in(
      "service_id",
      rawServices.map((s) => s.id),
    );

  const variants = (variantsData || []) as { service_id: string }[];

  // Get addon counts for all services
  const { data: addonsData } = await supabase
    .from("service_addons")
    .select("service_id")
    .in(
      "service_id",
      rawServices.map((s) => s.id),
    );

  const addonsRaw = (addonsData || []) as { service_id: string }[];

  // Count variants and addons per service
  const variantCounts = variants.reduce(
    (acc, v) => {
      acc[v.service_id] = (acc[v.service_id] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const addonCounts = addonsRaw.reduce(
    (acc, a) => {
      acc[a.service_id] = (acc[a.service_id] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Combine services with counts
  const services: ServiceWithCounts[] = rawServices.map((s) => ({
    ...s,
    variantCount: variantCounts[s.id] || 0,
    addonCount: addonCounts[s.id] || 0,
  }));

  const activeServices = services.filter((s) => s.is_active);
  const inactiveServices = services.filter((s) => !s.is_active);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Services</h1>
          <p className="text-gray-500 mt-1">
            Manage your bookable packages and services
          </p>
        </div>
        <Link href="/dashboard/services/new">
          <Button className="bg-teal-600 hover:bg-teal-700">
            <Plus className="h-4 w-4 mr-2" />
            Add Service
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Services
            </CardTitle>
            <Package className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{services.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active
            </CardTitle>
            <Eye className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeServices.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Inactive
            </CardTitle>
            <EyeOff className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-400">
              {inactiveServices.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Services List */}
      {services && services.length > 0 ? (
        <div className="space-y-6">
          {/* Active Services */}
          {activeServices.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Active Services
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activeServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    variantCount={service.variantCount}
                    addonCount={service.addonCount}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Inactive Services */}
          {inactiveServices.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-500 mb-4">
                Inactive Services
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {inactiveServices.map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    variantCount={service.variantCount}
                    addonCount={service.addonCount}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="w-16 h-16 bg-teal-100 rounded-full flex items-center justify-center mb-4">
              <Package className="h-8 w-8 text-teal-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No services yet
            </h3>
            <p className="text-gray-500 text-center mb-6 max-w-sm">
              Create your first bookable service to start accepting reservations
              from customers.
            </p>
            <Link href="/dashboard/services/new">
              <Button className="bg-teal-600 hover:bg-teal-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Service
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
