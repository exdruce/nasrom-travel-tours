"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

interface BookingQRCodeProps {
  bookingRef: string;
  size?: number;
  className?: string;
}

/**
 * QR Code component for booking confirmation
 * Generates a QR code containing the booking reference or verification URL
 */
export function BookingQRCode({
  bookingRef,
  size = 150,
  className = "",
}: BookingQRCodeProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function generateQR() {
      try {
        // Generate QR code as data URL
        // The QR can encode just the ref code, or a full verification URL
        const verificationUrl =
          typeof window !== "undefined"
            ? `${window.location.origin}/verify/${bookingRef}`
            : bookingRef;

        const dataUrl = await QRCode.toDataURL(verificationUrl, {
          width: size,
          margin: 2,
          color: {
            dark: "#168D95", // Brand teal color
            light: "#FFFFFF",
          },
          errorCorrectionLevel: "M",
        });
        setQrDataUrl(dataUrl);
      } catch (err) {
        console.error("Failed to generate QR code:", err);
        setError("Failed to generate QR code");
      }
    }

    generateQR();
  }, [bookingRef, size]);

  if (error) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 rounded-lg ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-xs text-gray-400">QR Error</span>
      </div>
    );
  }

  if (!qrDataUrl) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 rounded-lg animate-pulse ${className}`}
        style={{ width: size, height: size }}
      >
        <span className="text-xs text-gray-400">Loading...</span>
      </div>
    );
  }

  return (
    <div className={`inline-block ${className}`}>
      <img
        src={qrDataUrl}
        alt={`QR Code for booking ${bookingRef}`}
        width={size}
        height={size}
        className="rounded-lg"
      />
    </div>
  );
}
