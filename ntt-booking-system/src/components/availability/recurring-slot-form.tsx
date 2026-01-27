"use client";

import { useState, useTransition, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Loader2, Calendar, X } from "lucide-react";
import { createRecurringSlots } from "@/app/actions/availability";

interface ServiceWithDuration {
  id: string;
  name: string;
  duration_minutes?: number;
  max_capacity?: number;
}

interface RecurringSlotFormProps {
  services: ServiceWithDuration[];
  onClose: () => void;
}

type PatternType = "weekly" | "monthly" | "custom";

const DAYS = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const MONTHLY_OPTIONS = [
  { value: "first", label: "First week of month" },
  { value: "second", label: "Second week of month" },
  { value: "third", label: "Third week of month" },
  { value: "fourth", label: "Fourth week of month" },
  { value: "last", label: "Last week of month" },
  { value: "all", label: "Every week" },
];

export function RecurringSlotForm({
  services,
  onClose,
}: RecurringSlotFormProps) {
  const [isPending, startTransition] = useTransition();
  const [patternType, setPatternType] = useState<PatternType>("weekly");
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5]); // Mon-Fri default
  const [monthlyWeek, setMonthlyWeek] = useState("all");
  const [customDates, setCustomDates] = useState<string[]>([]);
  const [selectedService, setSelectedService] = useState<string>("all");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [capacity, setCapacity] = useState("10");
  const [result, setResult] = useState<{
    success?: boolean;
    count?: number;
    error?: string;
  } | null>(null);
  const [defaultStartDate, setDefaultStartDate] = useState("");
  const [defaultEndDate, setDefaultEndDate] = useState("");
  const [newCustomDate, setNewCustomDate] = useState("");

  // Set dates on client side only to avoid hydration mismatch
  useEffect(() => {
    const today = new Date();
    setDefaultStartDate(today.toISOString().split("T")[0]);
    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + 3);
    setDefaultEndDate(endDate.toISOString().split("T")[0]);
  }, []);

  // Auto-fill duration and capacity when service is selected
  useEffect(() => {
    if (selectedService !== "all") {
      const service = services.find((s) => s.id === selectedService);
      if (service) {
        // Calculate end time based on service duration
        if (service.duration_minutes) {
          const [startHour, startMin] = startTime.split(":").map(Number);
          const totalMinutes =
            startHour * 60 + startMin + service.duration_minutes;
          const endHour = Math.floor(totalMinutes / 60) % 24;
          const endMin = totalMinutes % 60;
          setEndTime(
            `${String(endHour).padStart(2, "0")}:${String(endMin).padStart(2, "0")}`,
          );
        }
        // Set capacity from service
        if (service.max_capacity) {
          setCapacity(String(service.max_capacity));
        }
      }
    }
  }, [selectedService, services, startTime]);

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter((d) => d !== day));
    } else {
      setSelectedDays([...selectedDays, day].sort((a, b) => a - b));
    }
  };

  const addCustomDate = () => {
    if (newCustomDate && !customDates.includes(newCustomDate)) {
      setCustomDates([...customDates, newCustomDate].sort());
      setNewCustomDate("");
    }
  };

  const removeCustomDate = (date: string) => {
    setCustomDates(customDates.filter((d) => d !== date));
  };

  const handleSubmit = (formData: FormData) => {
    // Set pattern-specific data
    formData.set("pattern_type", patternType);
    formData.set("days_of_week", JSON.stringify(selectedDays));
    formData.set("monthly_week", monthlyWeek);
    formData.set("custom_dates", JSON.stringify(customDates));
    formData.set("start_time", startTime);
    formData.set("end_time", endTime);
    formData.set("capacity", capacity);
    formData.set(
      "service_id",
      selectedService === "all" ? "" : selectedService,
    );
    setResult(null);

    startTransition(async () => {
      const res = await createRecurringSlots(formData);
      if (res.success) {
        setResult({ success: true, count: res.count });
      } else {
        const errorMsg =
          res.error && typeof res.error === "object" && "_form" in res.error
            ? (res.error as { _form?: string[] })._form?.[0]
            : "Failed to create slots";
        setResult({ error: errorMsg || "Failed to create slots" });
      }
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Create Availability
            </CardTitle>
            <CardDescription>Set up availability patterns</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-4">
          {/* Pattern Type */}
          <div>
            <Label className="text-sm font-medium">Pattern Type</Label>
            <div className="flex gap-2 mt-2">
              {(["weekly", "monthly", "custom"] as PatternType[]).map(
                (type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setPatternType(type)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors capitalize ${
                      patternType === type
                        ? "bg-teal-600 text-white border-teal-600"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {type}
                  </button>
                ),
              )}
            </div>
          </div>

          {/* Weekly Pattern - Days of Week */}
          {(patternType === "weekly" || patternType === "monthly") && (
            <div>
              <Label className="text-sm font-medium">Days of Week</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {DAYS.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => toggleDay(day.value)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                      selectedDays.includes(day.value)
                        ? "bg-teal-600 text-white border-teal-600"
                        : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {day.label.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Monthly Pattern - Week Selection */}
          {patternType === "monthly" && (
            <div>
              <Label className="text-sm font-medium">Which Weeks</Label>
              <Select value={monthlyWeek} onValueChange={setMonthlyWeek}>
                <SelectTrigger className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHLY_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Custom Pattern - Specific Dates */}
          {patternType === "custom" && (
            <div>
              <Label className="text-sm font-medium">Specific Dates</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  type="date"
                  value={newCustomDate}
                  onChange={(e) => setNewCustomDate(e.target.value)}
                  min={defaultStartDate}
                />
                <Button type="button" onClick={addCustomDate} size="sm">
                  Add
                </Button>
              </div>
              {customDates.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {customDates.map((date) => (
                    <span
                      key={date}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-sm"
                    >
                      {new Date(date + "T00:00:00").toLocaleDateString(
                        "en-MY",
                        {
                          month: "short",
                          day: "numeric",
                        },
                      )}
                      <button
                        type="button"
                        onClick={() => removeCustomDate(date)}
                        className="text-gray-500 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Service Selection */}
          <div>
            <Label htmlFor="service_id">Service (Optional)</Label>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger>
                <SelectValue placeholder="All Services" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                {services.map((service) => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name}
                    {service.duration_minutes && (
                      <span className="text-gray-500 ml-1">
                        ({service.duration_minutes}min)
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 mt-1">
              Selecting a service auto-fills duration and capacity
            </p>
          </div>

          {/* Time and Capacity */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="start_time">Start Time</Label>
              <Input
                id="start_time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="end_time">End Time</Label>
              <Input
                id="end_time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="capacity">Capacity</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Date Range (for weekly/monthly patterns) */}
          {patternType !== "custom" && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">From Date</Label>
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                  defaultValue={defaultStartDate}
                  required
                />
              </div>
              <div>
                <Label htmlFor="end_date">To Date</Label>
                <Input
                  id="end_date"
                  name="end_date"
                  type="date"
                  defaultValue={defaultEndDate}
                  required
                />
              </div>
            </div>
          )}

          {/* Result */}
          {result && (
            <div
              className={`p-3 rounded-lg ${
                result.success
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              {result.success
                ? `Created ${result.count} availability slots!`
                : result.error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700"
              disabled={
                isPending ||
                (patternType !== "custom" && selectedDays.length === 0) ||
                (patternType === "custom" && customDates.length === 0)
              }
            >
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Slots
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
