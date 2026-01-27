"use client";

import { useState, useTransition } from "react";
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
import {
  Clock,
  Users,
  Loader2,
  Edit,
  Trash2,
  Plus,
  Ban,
  Check,
} from "lucide-react";
import {
  createTimeSlot,
  updateTimeSlot,
  deleteTimeSlot,
  toggleBlockDate,
} from "@/app/actions/availability";
import type { Availability } from "@/types";

interface TimeSlotEditorProps {
  date: string;
  slots: (Availability & { services: { name: string } | null })[];
  services: { id: string; name: string }[];
  onClose: () => void;
}

export function TimeSlotEditor({
  date,
  slots,
  services,
  onClose,
}: TimeSlotEditorProps) {
  const [isPending, startTransition] = useTransition();
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const formattedDate = new Date(date + "T00:00:00").toLocaleDateString(
    "en-MY",
    {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    },
  );

  const isBlocked = slots.some((s) => s.is_blocked);

  const handleToggleBlock = () => {
    startTransition(async () => {
      await toggleBlockDate(date, !isBlocked);
    });
  };

  const handleAddSlot = (formData: FormData) => {
    formData.set("date", date);
    startTransition(async () => {
      const result = await createTimeSlot(formData);
      if (result.success) {
        setIsAdding(false);
      }
    });
  };

  const handleUpdateSlot = (slotId: string, formData: FormData) => {
    formData.set("date", date);
    startTransition(async () => {
      const result = await updateTimeSlot(slotId, formData);
      if (result.success) {
        setEditingId(null);
      }
    });
  };

  const handleDeleteSlot = (slotId: string) => {
    if (confirm("Delete this time slot?")) {
      startTransition(async () => {
        await deleteTimeSlot(slotId);
      });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{formattedDate}</CardTitle>
            <CardDescription>
              {slots.length} time slot{slots.length !== 1 ? "s" : ""}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={isBlocked ? "default" : "outline"}
              size="sm"
              onClick={handleToggleBlock}
              disabled={isPending}
              className={isBlocked ? "bg-red-600 hover:bg-red-700" : ""}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isBlocked ? (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Unblock
                </>
              ) : (
                <>
                  <Ban className="h-4 w-4 mr-1" />
                  Block Date
                </>
              )}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isBlocked && (
          <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
            This date is blocked. No bookings will be accepted.
          </div>
        )}

        {/* Existing Slots */}
        {slots
          .filter((s) => !s.is_blocked || s.capacity > 0)
          .map((slot) => (
            <div
              key={slot.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
            >
              {editingId === slot.id ? (
                <form
                  action={(formData) => handleUpdateSlot(slot.id, formData)}
                  className="flex-1 space-y-3"
                >
                  <div className="grid grid-cols-4 gap-2">
                    <div>
                      <Label className="text-xs">Start</Label>
                      <Input
                        name="start_time"
                        type="time"
                        defaultValue={slot.start_time}
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-xs">End</Label>
                      <Input
                        name="end_time"
                        type="time"
                        defaultValue={slot.end_time}
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Capacity</Label>
                      <Input
                        name="capacity"
                        type="number"
                        min="1"
                        defaultValue={slot.capacity}
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Service</Label>
                      <Select
                        name="service_id"
                        defaultValue={slot.service_id || "all"}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Services</SelectItem>
                          {services.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={isPending}>
                      {isPending && (
                        <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                      )}
                      Save
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditingId(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">
                        {slot.start_time} - {slot.end_time}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">
                        <span className="font-medium text-teal-600">
                          {slot.booked_count}
                        </span>
                        /{slot.capacity} booked
                      </span>
                    </div>
                    {slot.services && (
                      <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">
                        {slot.services.name}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditingId(slot.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:text-red-700"
                      onClick={() => handleDeleteSlot(slot.id)}
                      disabled={isPending || slot.booked_count > 0}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}

        {/* Add New Slot */}
        {isAdding ? (
          <form
            action={handleAddSlot}
            className="p-4 border rounded-lg space-y-3"
          >
            <div className="grid grid-cols-4 gap-2">
              <div>
                <Label className="text-xs">Start Time *</Label>
                <Input
                  name="start_time"
                  type="time"
                  defaultValue="09:00"
                  required
                />
              </div>
              <div>
                <Label className="text-xs">End Time *</Label>
                <Input
                  name="end_time"
                  type="time"
                  defaultValue="17:00"
                  required
                />
              </div>
              <div>
                <Label className="text-xs">Capacity *</Label>
                <Input
                  name="capacity"
                  type="number"
                  min="1"
                  defaultValue="10"
                  required
                />
              </div>
              <div>
                <Label className="text-xs">Service</Label>
                <Select name="service_id" defaultValue="all">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Services</SelectItem>
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                Add Slot
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsAdding(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : (
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setIsAdding(true)}
            disabled={isBlocked}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Time Slot
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
