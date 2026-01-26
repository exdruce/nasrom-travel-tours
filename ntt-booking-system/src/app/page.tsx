"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="mx-auto w-20 h-20 bg-linear-to-br from-teal-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg">
          <span className="text-white font-bold text-4xl">N</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">
            NTT Booking System
          </h1>
          <p className="text-gray-500 text-lg">
            Management portal for NASROM Travel & Tours
          </p>
        </div>

        <div className="space-y-4">
          <Link href="/login" className="block w-full">
            <Button
              size="lg"
              className="w-full bg-teal-600 hover:bg-teal-700 text-lg h-12"
            >
              Sign In
            </Button>
          </Link>

          <Link href="/register" className="block w-full">
            <Button variant="outline" size="lg" className="w-full text-lg h-12">
              Create Account
            </Button>
          </Link>
        </div>

        <p className="text-sm text-gray-400">
          &copy; {new Date().getFullYear()} NASROM Travel & Tours
        </p>
      </div>
    </div>
  );
}
