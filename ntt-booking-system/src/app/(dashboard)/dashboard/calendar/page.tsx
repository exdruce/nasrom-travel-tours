import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  getAvailabilityForMonth,
  getServicesForAvailability,
} from "@/app/actions/availability";
import { CalendarPageClient } from "./client";

export default async function CalendarPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get current month data
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;

  const [availability, services] = await Promise.all([
    getAvailabilityForMonth(year, month),
    getServicesForAvailability(),
  ]);

  return (
    <CalendarPageClient
      initialAvailability={availability}
      services={services}
      initialYear={year}
      initialMonth={month}
    />
  );
}
