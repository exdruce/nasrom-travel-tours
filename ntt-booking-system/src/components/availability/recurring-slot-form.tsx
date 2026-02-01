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
  CardFooter,
} from "@/components/ui/card";
import {
  Calendar,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Repeat,
} from "lucide-react";
import { createRecurringSlots } from "@/app/actions/availability";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

const MONTHLY_OPTIONS = [
  { value: "first", label: "First week" },
  { value: "second", label: "Second week" },
  { value: "third", label: "Third week" },
  { value: "fourth", label: "Fourth week" },
  { value: "last", label: "Last week" },
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

  useEffect(() => {
    const today = new Date();
    setDefaultStartDate(today.toISOString().split("T")[0]);
    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + 3);
    setDefaultEndDate(endDate.toISOString().split("T")[0]);
  }, []);

  useEffect(() => {
    if (selectedService !== "all") {
      const service = services.find((s) => s.id === selectedService);
      if (service) {
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
    <Card className="h-full border-none shadow-none rounded-none flex flex-col">
      <CardHeader className="pb-4 border-b">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              Bulk Create Slots
            </CardTitle>
            <CardDescription>
              Generate multiple availability slots at once
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="-mr-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <div className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <CardContent className="p-4 space-y-6">
            <form action={handleSubmit} className="space-y-6">
              {/* Pattern Type */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Recurrence Pattern
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {(["weekly", "monthly", "custom"] as PatternType[]).map(
                    (type) => (
                      <div
                        key={type}
                        onClick={() => setPatternType(type)}
                        className={cn(
                          "cursor-pointer text-center px-2 py-3 rounded-lg border text-sm font-medium transition-all",
                          patternType === type
                            ? "bg-teal-50 border-teal-600 text-teal-700 ring-1 ring-teal-600"
                            : "bg-background hover:bg-muted/50 text-muted-foreground border-input",
                        )}
                      >
                        <span className="capitalize">{type}</span>
                      </div>
                    ),
                  )}
                </div>
              </div>

              <Separator />

              {/* Weekly Pattern - Days of Week */}
              {(patternType === "weekly" || patternType === "monthly") && (
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Days of Week</Label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map((day) => {
                      const isSelected = selectedDays.includes(day.value);
                      return (
                        <button
                          key={day.value}
                          type="button"
                          onClick={() => toggleDay(day.value)}
                          className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all",
                            isSelected
                              ? "bg-teal-600 text-white shadow-sm"
                              : "bg-muted text-muted-foreground hover:bg-muted/80",
                          )}
                        >
                          {day.label.charAt(0)}
                        </button>
                      );
                    })}
                  </div>
                  {selectedDays.length === 0 && (
                    <p className="text-xs text-destructive">
                      Please select at least one day.
                    </p>
                  )}
                </div>
              )}

              {/* Monthly Pattern - Week Selection */}
              {patternType === "monthly" && (
                <div className="space-y-3">
                  <Label>Repeats On</Label>
                  <Select value={monthlyWeek} onValueChange={setMonthlyWeek}>
                    <SelectTrigger>
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
                <div className="space-y-3">
                  <Label>Select Specific Dates</Label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={newCustomDate}
                      onChange={(e) => setNewCustomDate(e.target.value)}
                      min={defaultStartDate}
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      onClick={addCustomDate}
                      variant="secondary"
                    >
                      Add
                    </Button>
                  </div>
                  {customDates.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {customDates.map((date) => (
                        <Badge
                          key={date}
                          variant="secondary"
                          className="pl-2 pr-1 py-1 flex items-center gap-1"
                        >
                          {new Date(date + "T00:00:00").toLocaleDateString(
                            "en-MY",
                            { month: "short", day: "numeric" },
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4 rounded-full hover:bg-destructive/20 hover:text-destructive"
                            onClick={() => removeCustomDate(date)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground italic">
                      No dates selected yet.
                    </p>
                  )}
                </div>
              )}

              {/* Date Range (for weekly/monthly patterns) */}
              {patternType !== "custom" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">From</Label>
                    <Input
                      id="start_date"
                      name="start_date"
                      type="date"
                      defaultValue={defaultStartDate}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end_date">Until</Label>
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

              <Separator />

              {/* Time Configuration */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-foreground">
                  Slot Configuration
                </h4>
                <div className="space-y-3">
                  <div>
                    <Label
                      htmlFor="service_id"
                      className="text-xs text-muted-foreground mb-1 block"
                    >
                      Based On Service (Auto-fill)
                    </Label>
                    <Select
                      value={selectedService}
                      onValueChange={setSelectedService}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a service..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">None (Manual Input)</SelectItem>
                        {services.map((service) => (
                          <SelectItem key={service.id} value={service.id}>
                            {service.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="start_time" className="text-xs">
                        Start Time
                      </Label>
                      <Input
                        id="start_time"
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="end_time" className="text-xs">
                        End Time
                      </Label>
                      <Input
                        id="end_time"
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="capacity" className="text-xs">
                      Capacity per Slot
                    </Label>
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
              </div>

              {/* Result Message */}
              {result && (
                <div
                  className={cn(
                    "p-3 rounded-lg text-sm flex items-start gap-2",
                    result.success
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200",
                  )}
                >
                  {result.success ? (
                    <CheckCircle2 className="h-4 w-4 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 mt-0.5" />
                  )}
                  <div>
                    {result.success ? (
                      <span className="font-medium">
                        Success! Created {result.count} slots.
                      </span>
                    ) : (
                      <span>{result.error}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full bg-teal-600 hover:bg-teal-700"
                  disabled={
                    isPending ||
                    (patternType !== "custom" && selectedDays.length === 0) ||
                    (patternType === "custom" && customDates.length === 0)
                  }
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Repeat className="h-4 w-4 mr-2" />
                  )}
                  Generate Slots
                </Button>
              </div>
            </form>
          </CardContent>
        </ScrollArea>
      </div>
    </Card>
  );
}
