import type { Metadata } from "next";
import { Inter, Playfair_Display, Kaushan_Script } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
});

const kaushan = Kaushan_Script({
  weight: "400",
  variable: "--font-kaushan",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NTT Booking System",
  description: "Production-ready booking SaaS for NASROM Travel & Tours",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${playfair.variable} ${kaushan.variable} font-sans antialiased`}
        suppressHydrationWarning
      >
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
