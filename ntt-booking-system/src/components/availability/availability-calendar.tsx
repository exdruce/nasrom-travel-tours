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
  currentYear: number;
  currentMonth: number;
  onMonthChange: (year: number, month: number) => void;
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
  currentYear,
  currentMonth,
  onMonthChange,
}: AvailabilityCalendarProps) {
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
    onMonthChange(now.getFullYear(), now.getMonth() + 1);
  };

  const prevMonth = () => {
    if (currentMonth === 1) {
      onMonthChange(currentYear - 1, 12);
    } else {
      onMonthChange(currentYear, currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 12) {
      onMonthChange(currentYear + 1, 1);
    } else {
      onMonthChange(currentYear, currentMonth + 1);
    }
  };

  return (
    <div className="bg-white rounded-lg border shadow-sm flex flex-col h-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-b space-y-4 sm:space-y-0">
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
              className="ml-2 hidden sm:inline-flex"
              onClick={goToToday}
            >
              Today
            </Button>
          </div>
        </div>
        <div className="flex w-full sm:w-auto gap-2">
          <Button
            variant="outline"
            size="sm"
            className="sm:hidden flex-1"
            onClick={goToToday}
          >
            Today
          </Button>
          <Button
            onClick={onAddSlot}
            className="bg-teal-600 hover:bg-teal-700 flex-1 sm:flex-none"
          >
            <Plus className="h-4 w-4 mr-2" />
            <span className="sm:inline">Add Availability</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-2 sm:p-4 bg-muted/20 flex-1">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAYS.map((day) => (
            <div
              key={day}
              className="text-center text-xs sm:text-sm font-medium text-muted-foreground py-2"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Date cells */}
        <div className="grid grid-cols-7 gap-1 auto-rows-fr">
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
                  "relative p-1 sm:p-2 flex flex-col items-center sm:items-start text-left border rounded-lg transition-all hover:shadow-md",
                  // Height: Auto on mobile (min-h), Fixed on desktop
                  "min-h-12 sm:min-h-24 aspect-square sm:aspect-auto",
                  day.isCurrentMonth
                    ? "bg-white hover:bg-gray-50"
                    : "bg-gray-50/50 text-muted-foreground/30 cursor-not-allowed border-transparent",
                  isToday && "ring-2 ring-teal-500 z-10",
                  isSelected &&
                    "bg-teal-50 border-teal-500 ring-1 ring-teal-500 z-10",
                  slotInfo?.blocked && "bg-red-50 border-red-200",
                  isPast &&
                    day.isCurrentMonth &&
                    "bg-gray-100/50 text-muted-foreground",
                )}
              >
                <div className="flex justify-between w-full items-start">
                  <span
                    className={cn(
                      "text-xs sm:text-sm font-medium rounded-full w-6 h-6 flex items-center justify-center",
                      isToday && "bg-teal-600 text-white",
                      slotInfo?.blocked && !isToday && "text-red-600",
                    )}
                  >
                    {day.date}
                  </span>
                  {/* Mobile Dot Indicator */}
                  {slotInfo && day.isCurrentMonth && (
                    <div
                      className={cn(
                        "w-1.5 h-1.5 rounded-full sm:hidden absolute top-2 right-2",
                        slotInfo.blocked
                          ? "bg-red-500"
                          : slotInfo.booked >= slotInfo.capacity &&
                              slotInfo.capacity > 0
                            ? "bg-red-500"
                            : slotInfo.booked > 0
                              ? "bg-amber-500"
                              : "bg-green-500",
                      )}
                    />
                  )}
                </div>

                {slotInfo && day.isCurrentMonth && (
                  <div className="mt-1 w-full hidden sm:block">
                    {slotInfo.blocked ? (
                      <div className="text-xs text-red-600 font-medium bg-red-100/50 px-1 py-0.5 rounded text-center">
                        Blocked
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <div className="flex items-center gap-1 text-xs text-gray-600">
                          <CalendarIcon className="h-3 w-3 text-muted-foreground" />
                          <span>
                            {slotInfo.total} slot{slotInfo.total > 1 ? "s" : ""}
                          </span>
                        </div>
                        {slotInfo.capacity > 0 && (
                          <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                slotInfo.booked >= slotInfo.capacity
                                  ? "bg-red-500"
                                  : slotInfo.booked > 0
                                    ? "bg-amber-500"
                                    : "bg-green-500",
                              )}
                              style={{
                                width: `${Math.min((slotInfo.booked / slotInfo.capacity) * 100, 100)}%`,
                              }}
                            />
                          </div>
                        )}
                        {slotInfo.capacity > 0 && (
                          <div className="text-[10px] text-muted-foreground text-right">
                            {slotInfo.booked}/{slotInfo.capacity}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 p-4 text-xs text-muted-foreground border-t bg-gray-50/50">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-500" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-amber-500" />
          <span>Filling Fast</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500" />
          <span>Full/Blocked</span>
        </div>
      </div>
    </div>
  );
}
