"use client";

import { BookingQRCode } from "@/components/booking/BookingQRCode";
import { Button } from "@/components/ui/button";
import { Download, Loader2, Ticket } from "lucide-react";
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
  const [downloadingType, setDownloadingType] = useState<
    "receipt" | "ticket" | null
  >(null);

  const handleDownload = async (type: "receipt" | "ticket") => {
    setDownloadingType(type);
    try {
      // Fetch the PDF from the API
      const response = await fetch(`/api/${type}/${bookingId}`);

      if (!response.ok) {
        throw new Error(`Failed to generate ${type}`);
      }

      // Get the blob data
      const blob = await response.blob();

      // Extract filename from Content-Disposition header, fallback to ref code
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = `${type}-${bookingRef}.pdf`;

      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      // Create a download link and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(
        `${type.charAt(0).toUpperCase() + type.slice(1)} downloaded successfully!`,
      );
    } catch (error) {
      console.error("Download error:", error);
      toast.error(`Failed to download ${type}. Please try again.`);
    } finally {
      setDownloadingType(null);
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

      <div className="flex gap-3 w-full max-w-xs">
        {/* Ticket Button */}
        <Button
          onClick={() => handleDownload("ticket")}
          disabled={downloadingType === "ticket"}
          className="flex-1 bg-gray-900 hover:bg-gray-800 text-white"
        >
          {downloadingType === "ticket" ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Ticket className="h-4 w-4 mr-2" />
          )}
          Ticket
        </Button>

        {/* Receipt Button */}
        <Button
          onClick={() => handleDownload("receipt")}
          disabled={downloadingType === "receipt"}
          className="flex-1 bg-teal-600 hover:bg-teal-700 text-white"
        >
          {downloadingType === "receipt" ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Receipt
        </Button>
      </div>
    </div>
  );
}
