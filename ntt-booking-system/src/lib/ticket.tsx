/**
 * Booking Ticket PDF Document
 * Focuses on travel details and boarding information
 */

import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from "@react-pdf/renderer";

// Types - Reusing types from receipt but can be specialized if needed
interface TicketPassenger {
  full_name: string;
  passenger_type: "adult" | "child" | "infant";
  ic_passport?: string;
}

interface TicketData {
  // Booking info
  bookingRef: string;
  bookingDate: string; // The trip date
  bookingTime: string; // The trip time

  // Trip info
  serviceName: string;
  destination: string;
  boatName?: string;

  // Passengers
  passengers: TicketPassenger[];
  pax: number;

  // Business info
  businessName: string;
  businessAddress?: string;

  // QR Code
  qrCodeDataUrl?: string;
}

// Styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: "Helvetica",
    fontSize: 10,
    backgroundColor: "#FFFFFF",
  },
  // Ticket Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#168D95", // Teal brand color
    paddingBottom: 15,
  },
  headerLeft: {
    flex: 1,
  },
  brandName: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#168D95",
    marginBottom: 5,
  },
  headerLabel: {
    fontSize: 16,
    color: "#666",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  headerRight: {
    alignItems: "flex-end",
  },
  // Main Content
  contentContainer: {
    flexDirection: "column",
    gap: 15,
  },
  // Trip Details Section
  tripSection: {
    backgroundColor: "#F0FDFA", // Light teal background
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#CCFBF1",
    marginBottom: 15,
  },
  row: {
    flexDirection: "row",
    marginBottom: 8,
  },
  tripLabel: {
    color: "#5F6A7A",
    fontSize: 9,
    marginBottom: 2,
  },
  tripValue: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#1F2937",
  },
  tripBlock: {
    flex: 1,
  },
  // QR Code Section
  qrContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    marginBottom: 20,
    borderStyle: "dashed",
  },
  qrCode: {
    width: 120,
    height: 120,
  },
  qrLabel: {
    marginTop: 8,
    fontSize: 10,
    color: "#6B7280",
  },
  bookingRefLarge: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1F2937",
    marginTop: 5,
  },
  // Passenger List
  passengerSection: {
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#168D95",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 5,
  },
  passengerRow: {
    flexDirection: "row",
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F3F4F6",
  },
  pIdx: { width: "10%", color: "#9CA3AF" },
  pName: { width: "50%", fontWeight: "bold" },
  pType: { width: "20%", textTransform: "capitalize", color: "#6B7280" },
  pId: { width: "20%", color: "#6B7280", textAlign: "right" },

  // Footer
  footer: {
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: "center",
    color: "#9CA3AF",
    fontSize: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 10,
  },
});

// Helper functions
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-MY", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(":");
  const h = parseInt(hours);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}

export function TicketDocument({ data }: { data: TicketData }) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.brandName}>{data.businessName}</Text>
            {data.businessAddress && (
              <Text style={{ fontSize: 8, color: "#6B7280", maxWidth: 200 }}>
                {data.businessAddress}
              </Text>
            )}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerLabel}>BOARDING TICKET</Text>
            <Text style={{ fontSize: 10, color: "#9CA3AF", marginTop: 4 }}>
              Ref: {data.bookingRef}
            </Text>
          </View>
        </View>

        {/* QR Code & Ref - Prominent */}
        <View style={styles.qrContainer}>
          {data.qrCodeDataUrl && (
            <Image src={data.qrCodeDataUrl} style={styles.qrCode} />
          )}
          <Text style={styles.bookingRefLarge}>{data.bookingRef}</Text>
          <Text style={styles.qrLabel}>Scan this code at the terminal</Text>
        </View>

        {/* Trip Details */}
        <View style={styles.tripSection}>
          <View
            style={[
              styles.row,
              {
                borderBottomWidth: 1,
                borderBottomColor: "#CCFBF1",
                paddingBottom: 10,
                marginBottom: 10,
              },
            ]}
          >
            <View style={styles.tripBlock}>
              <Text style={styles.tripLabel}>SERVICE</Text>
              <Text style={styles.tripValue}>{data.serviceName}</Text>
            </View>
            <View style={styles.tripBlock}>
              <Text style={styles.tripLabel}>DESTINATION</Text>
              <Text style={styles.tripValue}>{data.destination}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.tripBlock}>
              <Text style={styles.tripLabel}>DATE</Text>
              <Text style={styles.tripValue}>
                {formatDate(data.bookingDate)}
              </Text>
            </View>
            <View style={styles.tripBlock}>
              <Text style={styles.tripLabel}>TIME</Text>
              <Text style={styles.tripValue}>
                {formatTime(data.bookingTime)}
              </Text>
            </View>
            <View style={styles.tripBlock}>
              <Text style={styles.tripLabel}>BOAT INFO</Text>
              <Text style={styles.tripValue}>
                {data.boatName || "Nasrom Cabin"}
              </Text>
            </View>
            <View style={styles.tripBlock}>
              <Text style={styles.tripLabel}>PASSENGERS</Text>
              <Text style={styles.tripValue}>{data.pax} Pax</Text>
            </View>
          </View>
        </View>

        {/* Passenger List */}
        <View style={styles.passengerSection}>
          <Text style={styles.sectionTitle}>PASSENGER MANIFEST</Text>
          {data.passengers.map((p, i) => (
            <View key={i} style={styles.passengerRow}>
              <Text style={styles.pIdx}>{i + 1}.</Text>
              <Text style={styles.pName}>{p.full_name}</Text>
              <Text style={styles.pType}>{p.passenger_type}</Text>
              <Text style={styles.pId}>{p.ic_passport || "-"}</Text>
            </View>
          ))}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text
            style={{ marginBottom: 4, fontWeight: "bold", color: "#6B7280" }}
          >
            IMPORTANT NOTICE
          </Text>
          <Text>
            Please arrive at the jetty 30 minutes before departure time. This
            ticket is valid only for the date and time specified.
          </Text>
          <Text style={{ marginTop: 4 }}>
            Generated on {new Date().toLocaleDateString("en-MY")}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export type { TicketData, TicketPassenger };
