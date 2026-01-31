"use client";

import { BookingQRCode } from "@/components/booking/BookingQRCode";
import { Button } from "@/components/ui/button";
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ConfirmationActionsProps {
  bookingId: string;
  bookingRef: string;
}

export function ConfirmationActions({
  bookingId,
  bookingRef,
}: ConfirmationActionsProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownloadReceipt = async () => {
    setIsDownloading(true);
    try {
      // Use a hidden iframe to trigger download with proper filename from server
      // This approach respects the Content-Disposition header from the server
      const iframe = document.createElement("iframe");
      iframe.style.display = "none";
      document.body.appendChild(iframe);

      // Set the iframe src to the receipt API endpoint
      // The server returns Content-Disposition: attachment; filename="receipt-xxx.pdf"
      iframe.src = `/api/receipt/${bookingId}`;

      // Cleanup after download starts
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 5000);

      toast.success("Receipt downloaded successfully!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download receipt. Please try again.");
    } finally {
      // Add a small delay before re-enabling the button
      setTimeout(() => {
        setIsDownloading(false);
      }, 1000);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* QR Code */}
      <div className="bg-white p-4 rounded-xl shadow-sm border">
        <BookingQRCode bookingRef={bookingRef} size={160} />
        <p className="text-xs text-gray-400 text-center mt-2">
          Scan for verification
        </p>
      </div>

      {/* Download Button */}
      <Button
        onClick={handleDownloadReceipt}
        disabled={isDownloading}
        className="bg-teal-600 hover:bg-teal-700"
      >
        {isDownloading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Download className="h-4 w-4 mr-2" />
            Download Receipt
          </>
        )}
      </Button>
    </div>
  );
}
