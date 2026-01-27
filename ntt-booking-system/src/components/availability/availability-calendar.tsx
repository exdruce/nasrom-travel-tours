"use client";

import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Availability } from "@/types";

interface AvailabilityCalendarProps {
  availability: (Availability & { services: { name: string } | null })[];
  onDateSelect: (date: string) => void;
  onAddSlot: () => void;
  selectedDate: string | null;
  initialYear: number;
  initialMonth: number;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function AvailabilityCalendar({
  availability,
  onDateSelect,
  onAddSlot,
  selectedDate,
  initialYear,
  initialMonth,
}: AvailabilityCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [currentYear, setCurrentYear] = useState(initialYear);
  const [todayStr, setTodayStr] = useState("");

  // Group availability by date
  const slotsByDate = useMemo(() => {
    const map: Record<
      string,
      { total: number; blocked: boolean; booked: number; capacity: number }
    > = {};
    for (const slot of availability) {
      if (!map[slot.date]) {
        map[slot.date] = { total: 0, blocked: false, booked: 0, capacity: 0 };
      }
      map[slot.date].total++;
      if (slot.is_blocked) map[slot.date].blocked = true;
      map[slot.date].booked += slot.booked_count;
      map[slot.date].capacity += slot.capacity;
    }
    return map;
  }, [availability]);

  // Calculate calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth - 1, 1);
    const lastDay = new Date(currentYear, currentMonth, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days: { date: number; dateStr: string; isCurrentMonth: boolean }[] =
      [];

    // Previous month padding
    const prevMonthLastDay = new Date(
      currentYear,
      currentMonth - 1,
      0,
    ).getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const m = currentMonth - 1 || 12;
      const y = currentMonth - 1 ? currentYear : currentYear - 1;
      days.push({
        date: d,
        dateStr: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        isCurrentMonth: false,
      });
    }

    // Current month
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        date: d,
        dateStr: `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        isCurrentMonth: true,
      });
    }

    // Next month padding
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const m = (currentMonth % 12) + 1;
      const y = currentMonth === 12 ? currentYear + 1 : currentYear;
      days.push({
        date: d,
        dateStr: `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        isCurrentMonth: false,
      });
    }

    return days;
  }, [currentMonth, currentYear]);

  // Set today string on client side only to avoid hydration mismatch
  useEffect(() => {
    const now = new Date();
    setTodayStr(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`,
    );
  }, []);

  const goToToday = () => {
    const now = new Date();
    setCurrentMonth(now.getMonth() + 1);
    setCurrentYear(now.getFullYear());
  };

  const prevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">
            {MONTHS[currentMonth - 1]} {currentYear}
          </h2>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="ml-2"
              onClick={goToToday}
            >
              Today
            </Button>
          </div>
        </div>
        <Button onClick={onAddSlot} className="bg-teal-600 hover:bg-teal-700">
          <Plus className="h-4 w-4 mr-2" />
          Add Availability
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS.map((day) => (
            <div
              key={day}
              className="text-center text-sm font-medium text-gray-500 py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Date cells */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            const slotInfo = slotsByDate[day.dateStr];
            const isToday = day.dateStr === todayStr;
            const isSelected = day.dateStr === selectedDate;
            const isPast = day.dateStr < todayStr;

            return (
              <button
                key={index}
                onClick={() => day.isCurrentMonth && onDateSelect(day.dateStr)}
                disabled={!day.isCurrentMonth}
                className={cn(
                  "relative p-2 h-24 text-left border rounded-lg transition-colors",
                  day.isCurrentMonth
                    ? "bg-white hover:bg-gray-50"
                    : "bg-gray-50 text-gray-400 cursor-not-allowed",
                  isToday && "ring-2 ring-teal-500",
                  isSelected && "bg-teal-50 border-teal-500",
                  slotInfo?.blocked && "bg-red-50 border-red-200",
                  isPast && day.isCurrentMonth && "bg-gray-100",
                )}
              >
                <span
                  className={cn(
                    "text-sm font-medium",
                    isToday && "text-teal-600",
                    slotInfo?.blocked && "text-red-600",
                  )}
                >
                  {day.date}
                </span>

                {slotInfo && day.isCurrentMonth && (
                  <div className="mt-1 space-y-1">
                    {slotInfo.blocked ? (
                      <span className="text-xs text-red-600 font-medium">
                        Blocked
                      </span>
                    ) : (
                      <>
                        <div className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3 text-gray-400" />
                          <span className="text-xs text-gray-600">
                            {slotInfo.total} slot{slotInfo.total > 1 ? "s" : ""}
                          </span>
                        </div>
                        {slotInfo.capacity > 0 && (
                          <div className="text-xs">
                            <span
                              className={cn(
                                "font-medium",
                                slotInfo.booked >= slotInfo.capacity
                                  ? "text-red-600"
                                  : slotInfo.booked > 0
                                    ? "text-amber-600"
                                    : "text-green-600",
                              )}
                            >
                              {slotInfo.booked}/{slotInfo.capacity}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 pb-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-100 border border-green-300" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-amber-100 border border-amber-300" />
          <span>Partial</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-100 border border-red-300" />
          <span>Full/Blocked</span>
        </div>
      </div>
    </div>
  );
}
