/**
 * Form JL - Senarai Penumpang (Passenger Manifest)
 * PDF Document for Jabatan Laut Malaysia Compliance
 *
 * Uses @react-pdf/renderer for server-side PDF generation
 */

import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";

// Types
interface PassengerData {
  full_name: string;
  ic_passport: string;
  gender: "L" | "P";
  calculated_age: number;
  nationality: string;
  passenger_type: "adult" | "child" | "infant";
}

interface ManifestData {
  // Booking info
  bookingRef: string;
  tripDate: string;
  tripTime: string;

  // Boat/Vessel info
  boatName: string;
  boatRegNo: string;
  destination: string;
  operator: string;
  crewCount: number;

  // Passengers
  passengers: PassengerData[];
}

// Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
  },
  header: {
    textAlign: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: "#444",
  },
  infoSection: {
    marginBottom: 20,
    padding: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 4,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  infoLabel: {
    width: "35%",
    fontWeight: "bold",
  },
  infoValue: {
    width: "65%",
  },
  table: {
    marginTop: 10,
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#168D95",
    color: "#fff",
    padding: 8,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    padding: 6,
  },
  tableRowAlt: {
    backgroundColor: "#f9f9f9",
  },
  tableRowInfant: {
    backgroundColor: "#fff0f5",
  },
  colNo: { width: "6%" },
  colName: { width: "28%" },
  colIC: { width: "24%" },
  colGender: { width: "10%", textAlign: "center" },
  colAge: { width: "10%", textAlign: "center" },
  colNationality: { width: "22%" },
  summarySection: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
  },
  summaryTitle: {
    fontWeight: "bold",
    fontSize: 12,
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  summaryLabel: {
    width: "50%",
  },
  summaryValue: {
    width: "50%",
    fontWeight: "bold",
  },
  totalRow: {
    flexDirection: "row",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: "#333",
  },
  declaration: {
    marginTop: 30,
    padding: 15,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 4,
  },
  declarationTitle: {
    fontWeight: "bold",
    marginBottom: 10,
  },
  declarationText: {
    fontSize: 9,
    fontStyle: "italic",
    marginBottom: 20,
    lineHeight: 1.4,
  },
  signatureLine: {
    marginTop: 30,
    width: "60%",
    borderTopWidth: 1,
    borderTopColor: "#333",
    paddingTop: 5,
  },
  signatureLabel: {
    fontSize: 9,
    fontStyle: "italic",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#888",
    textAlign: "center",
  },
});

// Helper function to format date
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const day = date.getDate();
  const months = [
    "JAN",
    "FEB",
    "MAC",
    "APR",
    "MEI",
    "JUN",
    "JUL",
    "OGO",
    "SEP",
    "OKT",
    "NOV",
    "DIS",
  ];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

// Helper to format time
function formatTime(timeStr: string): string {
  const [hours, minutes] = timeStr.split(":");
  const h = parseInt(hours);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}

// The main PDF Document component
export function ManifestDocument({ data }: { data: ManifestData }) {
  const adults = data.passengers.filter((p) => p.passenger_type === "adult");
  const children = data.passengers.filter((p) => p.passenger_type === "child");
  const infants = data.passengers.filter((p) => p.passenger_type === "infant");
  const totalPassengers = data.passengers.length;
  const totalSouls = totalPassengers + data.crewCount;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            SENARAI PENUMPANG / PASSENGER MANIFEST
          </Text>
          <Text style={styles.subtitle}>JABATAN LAUT MALAYSIA</Text>
        </View>

        {/* Trip Information */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Nama Bot / Boat Name:</Text>
            <Text style={styles.infoValue}>{data.boatName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>No. Pendaftaran / Reg No:</Text>
            <Text style={styles.infoValue}>{data.boatRegNo}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tarikh / Date:</Text>
            <Text style={styles.infoValue}>{formatDate(data.tripDate)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Masa / Time:</Text>
            <Text style={styles.infoValue}>{formatTime(data.tripTime)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Destinasi / Destination:</Text>
            <Text style={styles.infoValue}>{data.destination}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Pengusaha / Operator:</Text>
            <Text style={styles.infoValue}>{data.operator}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>No. Rujukan / Ref No:</Text>
            <Text style={styles.infoValue}>{data.bookingRef}</Text>
          </View>
        </View>

        {/* Passenger Table */}
        <View style={styles.table}>
          {/* Table Header */}
          <View style={styles.tableHeader}>
            <Text style={styles.colNo}>BIL</Text>
            <Text style={styles.colName}>NAMA PENUH</Text>
            <Text style={styles.colIC}>NO. IC / PASPORT</Text>
            <Text style={styles.colGender}>JANTINA</Text>
            <Text style={styles.colAge}>UMUR</Text>
            <Text style={styles.colNationality}>WARGANEGARA</Text>
          </View>

          {/* Table Rows */}
          {data.passengers.map((passenger, index) => {
            // Build style array explicitly to satisfy react-pdf types
            const baseStyle = styles.tableRow;
            const altStyle = index % 2 === 1 ? styles.tableRowAlt : {};
            const infantStyle =
              passenger.passenger_type === "infant"
                ? styles.tableRowInfant
                : {};

            return (
              <View key={index} style={[baseStyle, altStyle, infantStyle]}>
                <Text style={styles.colNo}>{index + 1}</Text>
                <Text style={styles.colName}>{passenger.full_name}</Text>
                <Text style={styles.colIC}>{passenger.ic_passport}</Text>
                <Text style={styles.colGender}>{passenger.gender}</Text>
                <Text style={styles.colAge}>{passenger.calculated_age}</Text>
                <Text style={styles.colNationality}>
                  {passenger.nationality}
                </Text>
              </View>
            );
          })}
        </View>

        {/* Summary Section */}
        <View style={styles.summarySection}>
          <Text style={styles.summaryTitle}>RUMUSAN / SUMMARY</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Dewasa / Adults (12+):</Text>
            <Text style={styles.summaryValue}>{adults.length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>
              Kanak-kanak / Children (3-11):
            </Text>
            <Text style={styles.summaryValue}>{children.length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Bayi / Infants (0-2):</Text>
            <Text style={styles.summaryValue}>{infants.length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Kru Bot / Crew:</Text>
            <Text style={styles.summaryValue}>{data.crewCount}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.summaryLabel}>
              JUMLAH BESAR / TOTAL SOULS ON BOARD:
            </Text>
            <Text style={styles.summaryValue}>{totalSouls}</Text>
          </View>
        </View>

        {/* Declaration */}
        <View style={styles.declaration}>
          <Text style={styles.declarationTitle}>
            Pengakuan Pengusaha / Operator&apos;s Declaration:
          </Text>
          <Text style={styles.declarationText}>
            Saya mengaku bahawa butiran di atas adalah benar dan lengkap.
            {"\n"}
            (I declare that the details above are true and complete.)
          </Text>
          <View style={styles.signatureLine}>
            <Text style={styles.signatureLabel}>
              Tandatangan Nakhoda / Pengusaha
              {"\n"}
              (Signature of Master / Operator)
            </Text>
          </View>
        </View>

        {/* Footer */}
        <Text style={styles.footer}>
          Generated by NTT Booking System • {new Date().toLocaleDateString()} •
          Ref: {data.bookingRef}
        </Text>
      </Page>
    </Document>
  );
}

export type { ManifestData, PassengerData };
