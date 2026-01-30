"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { User, CreditCard, Baby, Users } from "lucide-react";
import { autoFillFromIC, formatIC, isValidMalaysianIC } from "@/lib/ic-utils";
import type { Gender, PassengerType } from "@/types";

export interface PassengerData {
  fullName: string;
  icPassport: string;
  dob: string;
  calculatedAge: number;
  gender: Gender;
  nationality: string;
  passengerType: PassengerType;
}

interface PassengerFormProps {
  paxCount: number;
  tripDate: string; // YYYY-MM-DD format
  passengers: PassengerData[];
  onChange: (passengers: PassengerData[]) => void;
}

const NATIONALITIES = [
  "MALAYSIA",
  "SINGAPORE",
  "INDONESIA",
  "THAILAND",
  "BRUNEI",
  "PHILIPPINES",
  "VIETNAM",
  "CHINA",
  "JAPAN",
  "KOREA",
  "INDIA",
  "AUSTRALIA",
  "UK",
  "USA",
  "OTHER",
];

const createEmptyPassenger = (): PassengerData => ({
  fullName: "",
  icPassport: "",
  dob: "",
  calculatedAge: 0,
  gender: "L",
  nationality: "MALAYSIA",
  passengerType: "adult",
});

export function PassengerForm({
  paxCount,
  tripDate,
  passengers,
  onChange,
}: PassengerFormProps) {
  // Ensure we have the right number of passenger slots
  const passengerList =
    passengers.length >= paxCount
      ? passengers.slice(0, paxCount)
      : [
          ...passengers,
          ...Array(paxCount - passengers.length)
            .fill(null)
            .map(() => createEmptyPassenger()),
        ];

  const updatePassenger = useCallback(
    (index: number, field: keyof PassengerData, value: string | number) => {
      const updated = [...passengerList];
      updated[index] = {
        ...updated[index],
        [field]: value,
      };
      onChange(updated);
    },
    [passengerList, onChange],
  );

  const handleICChange = useCallback(
    (index: number, value: string) => {
      const updated = [...passengerList];
      updated[index] = {
        ...updated[index],
        icPassport: value,
      };

      // Try to auto-fill from Malaysian IC
      if (value.replace(/[-\s]/g, "").length >= 12) {
        const tripDateObj = new Date(tripDate);
        const autoFilled = autoFillFromIC(value, tripDateObj);

        if (autoFilled.calculatedAge !== undefined) {
          updated[index] = {
            ...updated[index],
            icPassport: value,
            dob: autoFilled.dob || "",
            calculatedAge: autoFilled.calculatedAge,
            gender: autoFilled.gender || updated[index].gender,
            nationality: autoFilled.nationality || updated[index].nationality,
            passengerType:
              autoFilled.passengerType || updated[index].passengerType,
          };
        }
      }

      onChange(updated);
    },
    [passengerList, tripDate, onChange],
  );

  const getPassengerIcon = (type: PassengerType) => {
    switch (type) {
      case "infant":
        return <Baby className="h-4 w-4 text-pink-500" />;
      case "child":
        return <User className="h-4 w-4 text-blue-500" />;
      default:
        return <Users className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPassengerLabel = (type: PassengerType) => {
    switch (type) {
      case "infant":
        return "Bayi (0-2 tahun)";
      case "child":
        return "Kanak-kanak (3-11 tahun)";
      default:
        return "Dewasa (12+ tahun)";
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Maklumat Penumpang</h3>
        <span className="text-sm text-muted-foreground">
          ({paxCount} orang)
        </span>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Sila masukkan maklumat penumpang seperti dalam dokumen pengenalan.
        Maklumat ini diperlukan oleh Jabatan Laut Malaysia.
      </p>

      {passengerList.map((passenger, index) => (
        <Card key={index} className="border-l-4 border-l-primary/50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-4">
              {getPassengerIcon(passenger.passengerType)}
              <span className="font-medium">Penumpang {index + 1}</span>
              {passenger.calculatedAge > 0 && (
                <span className="text-xs px-2 py-0.5 bg-muted rounded-full">
                  {getPassengerLabel(passenger.passengerType)}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="md:col-span-2">
                <Label htmlFor={`name-${index}`}>
                  Nama Penuh (seperti dalam IC/Pasport)
                </Label>
                <Input
                  id={`name-${index}`}
                  value={passenger.fullName}
                  onChange={(e) =>
                    updatePassenger(
                      index,
                      "fullName",
                      e.target.value.toUpperCase(),
                    )
                  }
                  placeholder="Contoh: ALI BIN ABU"
                  className="uppercase"
                  required
                />
              </div>

              {/* IC/Passport */}
              <div>
                <Label htmlFor={`ic-${index}`}>No. IC / Pasport</Label>
                <Input
                  id={`ic-${index}`}
                  value={passenger.icPassport}
                  onChange={(e) => handleICChange(index, e.target.value)}
                  placeholder="950101-03-5577"
                  required
                />
                {passenger.icPassport &&
                  isValidMalaysianIC(passenger.icPassport) && (
                    <p className="text-xs text-green-600 mt-1">
                      ✓ IC Malaysia dikenali - umur & jantina diisi automatik
                    </p>
                  )}
              </div>

              {/* Age (auto-calculated or manual) */}
              <div>
                <Label htmlFor={`age-${index}`}>Umur (pada tarikh trip)</Label>
                <Input
                  id={`age-${index}`}
                  type="number"
                  min={0}
                  max={120}
                  value={passenger.calculatedAge || ""}
                  onChange={(e) =>
                    updatePassenger(
                      index,
                      "calculatedAge",
                      parseInt(e.target.value) || 0,
                    )
                  }
                  placeholder="Umur"
                  className={
                    passenger.calculatedAge > 0 &&
                    isValidMalaysianIC(passenger.icPassport)
                      ? "bg-green-50 border-green-200"
                      : ""
                  }
                  required
                />
              </div>

              {/* Gender */}
              <div>
                <Label htmlFor={`gender-${index}`}>Jantina</Label>
                <Select
                  value={passenger.gender}
                  onValueChange={(value: Gender) =>
                    updatePassenger(index, "gender", value)
                  }
                >
                  <SelectTrigger id={`gender-${index}`}>
                    <SelectValue placeholder="Pilih jantina" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">Lelaki (L)</SelectItem>
                    <SelectItem value="P">Perempuan (P)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Nationality */}
              <div>
                <Label htmlFor={`nationality-${index}`}>Warganegara</Label>
                <Select
                  value={passenger.nationality}
                  onValueChange={(value) =>
                    updatePassenger(index, "nationality", value)
                  }
                >
                  <SelectTrigger id={`nationality-${index}`}>
                    <SelectValue placeholder="Pilih negara" />
                  </SelectTrigger>
                  <SelectContent>
                    {NATIONALITIES.map((nat) => (
                      <SelectItem key={nat} value={nat}>
                        {nat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Summary */}
      <div className="bg-muted/50 rounded-lg p-4 mt-4">
        <h4 className="font-medium mb-2">Ringkasan Penumpang</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Dewasa:</span>{" "}
            <span className="font-medium">
              {passengerList.filter((p) => p.passengerType === "adult").length}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Kanak-kanak:</span>{" "}
            <span className="font-medium">
              {passengerList.filter((p) => p.passengerType === "child").length}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Bayi:</span>{" "}
            <span className="font-medium">
              {passengerList.filter((p) => p.passengerType === "infant").length}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Validate all passengers have required fields
 */
export function validatePassengers(passengers: PassengerData[]): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  passengers.forEach((passenger, index) => {
    if (!passenger.fullName.trim()) {
      errors.push(`Penumpang ${index + 1}: Nama penuh diperlukan`);
    }
    if (!passenger.icPassport.trim()) {
      errors.push(`Penumpang ${index + 1}: No. IC/Pasport diperlukan`);
    }
    if (!passenger.calculatedAge || passenger.calculatedAge < 0) {
      errors.push(`Penumpang ${index + 1}: Umur diperlukan`);
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}
