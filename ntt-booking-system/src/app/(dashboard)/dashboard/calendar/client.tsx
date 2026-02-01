"use client";

import { useState, useEffect, useCallback } from "react";
import { AvailabilityCalendar } from "@/components/availability/availability-calendar";
import { TimeSlotEditor } from "@/components/availability/time-slot-editor";
import { RecurringSlotForm } from "@/components/availability/recurring-slot-form";
import {
  getAvailabilityForMonth,
  getAvailabilityForDate,
} from "@/app/actions/availability";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import type { Availability } from "@/types";

interface CalendarPageClientProps {
  initialAvailability: (Availability & { services: { name: string } | null })[];
  services: { id: string; name: string }[];
  initialYear: number;
  initialMonth: number;
}

export function CalendarPageClient({
  initialAvailability,
  services,
  initialYear,
  initialMonth,
}: CalendarPageClientProps) {
  const [availability, setAvailability] = useState(initialAvailability);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedDateSlots, setSelectedDateSlots] = useState<
    (Availability & { services: { name: string } | null })[]
  >([]);
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [currentYear, setCurrentYear] = useState(initialYear);
  const [currentMonth, setCurrentMonth] = useState(initialMonth);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fetch availability when month changes
  const fetchAvailability = useCallback(async () => {
    try {
      const data = await getAvailabilityForMonth(currentYear, currentMonth);
      setAvailability(data);
    } catch (error) {
      console.error("Failed to fetch availability:", error);
    }
  }, [currentYear, currentMonth]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  // Fetch slots for selected date
  const handleDateSelect = async (date: string) => {
    setSelectedDate(date);
    setShowRecurringForm(false);
    try {
      const slots = await getAvailabilityForDate(date);
      setSelectedDateSlots(slots);
    } catch (error) {
      console.error("Failed to fetch slots:", error);
      setSelectedDateSlots([]);
    }
  };

  const handleAddSlot = () => {
    setShowRecurringForm(true);
    setSelectedDate(null);
  };

  const handleCloseEditor = () => {
    setSelectedDate(null);
    setSelectedDateSlots([]);
    // Refresh availability
    fetchAvailability();
  };

  const handleCloseRecurring = () => {
    setShowRecurringForm(false);
    // Refresh availability
    fetchAvailability();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Availability Calendar
        </h1>
        <p className="text-gray-500">
          Manage your time slots and availability for bookings
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 h-full">
          <AvailabilityCalendar
            availability={availability}
            onDateSelect={handleDateSelect}
            onAddSlot={handleAddSlot}
            selectedDate={selectedDate}
            currentYear={currentYear}
            currentMonth={currentMonth}
            onMonthChange={(year, month) => {
              setCurrentYear(year);
              setCurrentMonth(month);
            }}
          />
        </div>

        {/* Sidebar - Desktop Only */}
        <div className="hidden lg:block space-y-4">
          {showRecurringForm && (
            <RecurringSlotForm
              services={services}
              onClose={handleCloseRecurring}
            />
          )}

          {selectedDate && (
            <TimeSlotEditor
              date={selectedDate}
              slots={selectedDateSlots}
              services={services}
              onClose={handleCloseEditor}
            />
          )}

          {!showRecurringForm && !selectedDate && (
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <p className="text-gray-600 mb-4">
                Click on a date to view or edit time slots, or click "Add
                Availability" to create recurring slots.
              </p>
              <div className="text-sm text-gray-500 space-y-2">
                <p>
                  <strong>Time Slots:</strong> Define when customers can book
                </p>
                <p>
                  <strong>Capacity:</strong> Set maximum bookings per slot
                </p>
                <p>
                  <strong>Block Dates:</strong> Prevent bookings on specific
                  days
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawers */}
      {isMobile && (
        <>
          <Drawer
            open={!!selectedDate}
            onOpenChange={(open) => !open && handleCloseEditor()}
          >
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Manage Time Slots</DrawerTitle>
              </DrawerHeader>
              <div className="p-4 max-h-[85vh] overflow-y-auto">
                {selectedDate && (
                  <TimeSlotEditor
                    date={selectedDate}
                    slots={selectedDateSlots}
                    services={services}
                    onClose={handleCloseEditor}
                  />
                )}
              </div>
            </DrawerContent>
          </Drawer>

          <Drawer
            open={showRecurringForm}
            onOpenChange={(open) => !open && handleCloseRecurring()}
          >
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Create Recurring Slots</DrawerTitle>
              </DrawerHeader>
              <div className="p-4 max-h-[85vh] overflow-y-auto">
                <RecurringSlotForm
                  services={services}
                  onClose={handleCloseRecurring}
                />
              </div>
            </DrawerContent>
          </Drawer>
        </>
      )}
    </div>
  );
}
