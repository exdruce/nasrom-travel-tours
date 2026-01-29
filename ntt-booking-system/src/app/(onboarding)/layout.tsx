import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Check if already has business
  const { data: business } = await supabase
    .from("businesses")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (business) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-2xl">
        <div className="mb-8 text-center">
          <img
            src="/logo.svg"
            alt="NTT Booking"
            className="mx-auto mb-4 w-12 h-12"
          />
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome to NTT Booking
          </h1>
          <p className="text-gray-500">
            Let&apos;s get your business set up in just a few steps.
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
