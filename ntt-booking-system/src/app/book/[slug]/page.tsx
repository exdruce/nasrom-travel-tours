import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { BookingPageClient } from "./client";
import type {
  Business,
  Service,
  ServiceVariant,
  ServiceAddon,
  Availability,
} from "@/types";

interface PublicBookingPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ service?: string }>;
}

interface ServiceWithExtras extends Service {
  variants: ServiceVariant[];
  addons: ServiceAddon[];
}

export default async function PublicBookingPage({
  params,
  searchParams,
}: PublicBookingPageProps) {
  const { slug } = await params;
  const { service: selectedServiceId } = await searchParams;

  const supabase = await createClient();

  // Get business by slug
  const { data: businessData, error: businessError } = await supabase
    .from("businesses")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (businessError || !businessData) {
    notFound();
  }

  const business = businessData as Business;

  // Get active services with variants and addons
  const { data: servicesData } = await supabase
    .from("services")
    .select("*")
    .eq("business_id", business.id)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const rawServices = (servicesData || []) as Service[];

  // Fetch variants for all services
  const { data: variantsData } = await supabase
    .from("service_variants")
    .select("*")
    .in(
      "service_id",
      rawServices.map((s) => s.id),
    )
    .order("sort_order", { ascending: true });

  const variants = (variantsData || []) as ServiceVariant[];

  // Fetch addons for all services
  const { data: addonsData } = await supabase
    .from("service_addons")
    .select("*")
    .in(
      "service_id",
      rawServices.map((s) => s.id),
    )
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  const addons = (addonsData || []) as ServiceAddon[];

  // Combine services with their variants and addons
  const services: ServiceWithExtras[] = rawServices.map((service) => ({
    ...service,
    variants: variants.filter((v) => v.service_id === service.id),
    addons: addons.filter((a) => a.service_id === service.id),
  }));

  // Get upcoming availability (next 30 days)
  const today = new Date().toISOString().split("T")[0];
  const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const { data: availabilityData } = await supabase
    .from("availability")
    .select("*")
    .eq("business_id", business.id)
    .eq("is_blocked", false)
    .gte("date", today)
    .lte("date", thirtyDaysLater)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  const availability = (availabilityData || []) as Availability[];

  return (
    <BookingPageClient
      business={business}
      services={services}
      availability={availability}
      selectedServiceId={selectedServiceId}
    />
  );
}
