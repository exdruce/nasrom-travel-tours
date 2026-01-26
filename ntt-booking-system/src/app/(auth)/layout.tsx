import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Authentication - NTT Booking",
  description: "Sign in or create an account",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-teal-50 via-white to-orange-50">
      <div className="w-full max-w-md p-6">{children}</div>
    </div>
  );
}
