/**
 * Booking Receipt PDF Document
 * Uses @react-pdf/renderer for server-side PDF generation
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

// Types
interface ReceiptPassenger {
  full_name: string;
  passenger_type: "adult" | "child" | "infant";
}

interface ReceiptBookingItem {
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  type: "variant" | "addon";
}

interface ReceiptData {
  // Booking info
  bookingRef: string;
  bookingDate: string;
  bookingTime: string;
  createdAt: string;
  status: string;

  // Customer info
  customerName: string;
  customerEmail: string;
  customerPhone: string;

  // Service info
  serviceName: string;
  serviceDescription?: string;
  pax: number;

  // Passengers
  passengers: ReceiptPassenger[];

  // Pricing
  items: ReceiptBookingItem[];
  subtotal: number;
  addonsTotal: number;
  totalAmount: number;

  // Business info
  businessName: string;
  businessEmail?: string;
  businessPhone?: string;
  businessAddress?: string;

  // QR Code (base64 data URL)
  qrCodeDataUrl?: string;
}

// Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
    paddingBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: "#168D95",
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: "flex-end",
  },
  businessName: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#168D95",
    marginBottom: 4,
  },
  receiptTitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
  },
  qrCode: {
    width: 80,
    height: 80,
  },
  refCode: {
    fontSize: 12,
    fontWeight: "bold",
    marginTop: 8,
    color: "#333",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#168D95",
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    width: "35%",
    color: "#666",
  },
  value: {
    width: "65%",
    fontWeight: "bold",
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#F5F5F5",
    padding: 8,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  colItem: { width: "40%" },
  colQty: { width: "15%", textAlign: "center" },
  colPrice: { width: "20%", textAlign: "right" },
  colTotal: { width: "25%", textAlign: "right" },
  totalSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: "#168D95",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 4,
  },
  totalLabel: {
    width: "70%",
    textAlign: "right",
    paddingRight: 10,
  },
  totalValue: {
    width: "30%",
    textAlign: "right",
    fontWeight: "bold",
  },
  grandTotal: {
    fontSize: 14,
    color: "#168D95",
  },
  passengerList: {
    marginTop: 5,
  },
  passengerItem: {
    flexDirection: "row",
    marginBottom: 2,
  },
  passengerNo: {
    width: "10%",
    color: "#666",
  },
  passengerName: {
    width: "60%",
  },
  passengerType: {
    width: "30%",
    textAlign: "right",
    color: "#666",
    fontSize: 9,
  },
  statusBadge: {
    backgroundColor: "#168D95",
    color: "#FFFFFF",
    padding: "4 8",
    borderRadius: 4,
    fontSize: 9,
    alignSelf: "flex-start",
  },
  statusPending: {
    backgroundColor: "#F59E0B",
  },
  statusCancelled: {
    backgroundColor: "#EF4444",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 8,
    color: "#999",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  thankYou: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#168D95",
    textAlign: "center",
    marginTop: 30,
    marginBottom: 10,
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

function formatCurrency(amount: number): string {
  return `RM ${amount.toFixed(2)}`;
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// The main PDF Document component
export function ReceiptDocument({ data }: { data: ReceiptData }) {
  const getStatusStyle = () => {
    if (data.status === "pending")
      return [styles.statusBadge, styles.statusPending];
    if (data.status === "cancelled")
      return [styles.statusBadge, styles.statusCancelled];
    return styles.statusBadge;
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.businessName}>{data.businessName}</Text>
            {data.businessAddress && (
              <Text style={{ color: "#666", marginBottom: 2 }}>
                {data.businessAddress}
              </Text>
            )}
            {data.businessPhone && (
              <Text style={{ color: "#666", marginBottom: 2 }}>
                Tel: {data.businessPhone}
              </Text>
            )}
            {data.businessEmail && (
              <Text style={{ color: "#666" }}>Email: {data.businessEmail}</Text>
            )}
            <Text style={styles.receiptTitle}>BOOKING RECEIPT</Text>
          </View>
          <View style={styles.headerRight}>
            {data.qrCodeDataUrl && (
              <Image src={data.qrCodeDataUrl} style={styles.qrCode} />
            )}
            <Text style={styles.refCode}>{data.bookingRef}</Text>
            <View style={getStatusStyle()}>
              <Text>{data.status.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        {/* Booking Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Service:</Text>
            <Text style={styles.value}>{data.serviceName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>{formatDate(data.bookingDate)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Time:</Text>
            <Text style={styles.value}>{formatTime(data.bookingTime)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total Passengers:</Text>
            <Text style={styles.value}>{data.pax} person(s)</Text>
          </View>
        </View>

        {/* Customer Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Details</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{data.customerName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value}>{data.customerEmail}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.value}>{data.customerPhone || "-"}</Text>
          </View>
        </View>

        {/* Passengers */}
        {data.passengers.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Passenger List</Text>
            <View style={styles.passengerList}>
              {data.passengers.map((passenger, index) => (
                <View key={index} style={styles.passengerItem}>
                  <Text style={styles.passengerNo}>{index + 1}.</Text>
                  <Text style={styles.passengerName}>
                    {passenger.full_name}
                  </Text>
                  <Text style={styles.passengerType}>
                    {capitalizeFirst(passenger.passenger_type)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Pricing Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Summary</Text>
          <View style={styles.table}>
            {/* Table Header */}
            <View style={styles.tableHeader}>
              <Text style={styles.colItem}>Item</Text>
              <Text style={styles.colQty}>Qty</Text>
              <Text style={styles.colPrice}>Price</Text>
              <Text style={styles.colTotal}>Total</Text>
            </View>
            {/* Table Rows */}
            {data.items.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.colItem}>
                  {item.name}
                  {item.type === "addon" && " (Add-on)"}
                </Text>
                <Text style={styles.colQty}>{item.quantity}</Text>
                <Text style={styles.colPrice}>
                  {formatCurrency(item.unit_price)}
                </Text>
                <Text style={styles.colTotal}>
                  {formatCurrency(item.total_price)}
                </Text>
              </View>
            ))}
          </View>

          {/* Totals */}
          <View style={styles.totalSection}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Subtotal:</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(data.subtotal)}
              </Text>
            </View>
            {data.addonsTotal > 0 && (
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Add-ons:</Text>
                <Text style={styles.totalValue}>
                  {formatCurrency(data.addonsTotal)}
                </Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, styles.grandTotal]}>
                Total Amount:
              </Text>
              <Text style={[styles.totalValue, styles.grandTotal]}>
                {formatCurrency(data.totalAmount)}
              </Text>
            </View>
          </View>
        </View>

        {/* Thank You */}
        <Text style={styles.thankYou}>Thank you for your booking!</Text>
        <Text style={{ textAlign: "center", color: "#666", fontSize: 9 }}>
          Please present this receipt or your booking reference upon arrival.
        </Text>

        {/* Footer */}
        <Text style={styles.footer}>
          Generated on {new Date().toLocaleDateString("en-MY")} • Ref:{" "}
          {data.bookingRef}
          {"\n"}This is a computer-generated receipt. No signature required.
        </Text>
      </Page>
    </Document>
  );
}

export type { ReceiptData, ReceiptPassenger, ReceiptBookingItem };
