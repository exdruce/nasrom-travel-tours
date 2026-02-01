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
  CardFooter,
} from "@/components/ui/card";
import {
  Clock,
  Users,
  Loader2,
  Edit2,
  Trash2,
  Plus,
  Ban,
  CheckCircle2,
  X,
  Save,
} from "lucide-react";
import {
  createTimeSlot,
  updateTimeSlot,
  deleteTimeSlot,
  toggleBlockDate,
} from "@/app/actions/availability";
import type { Availability } from "@/types";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

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

  const dateObj = new Date(date + "T00:00:00");
  const formattedDate = dateObj.toLocaleDateString("en-MY", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

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

  const displaySlots = slots.filter((s) => !s.is_blocked || s.capacity > 0);

  return (
    <Card className="h-full border-none shadow-none rounded-none flex flex-col">
      <CardHeader className="pb-4 border-b">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-xl font-semibold tracking-tight">
              {formattedDate}
            </CardTitle>
            <CardDescription className="text-sm text-muted-foreground">
              {displaySlots.length} active time slot
              {displaySlots.length !== 1 ? "s" : ""}
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
        <div className="flex gap-2 mt-4">
          <Button
            variant={isBlocked ? "destructive" : "secondary"}
            size="sm"
            onClick={handleToggleBlock}
            disabled={isPending}
            className="w-full justify-center font-medium"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : isBlocked ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Unblock Date
              </>
            ) : (
              <>
                <Ban className="h-4 w-4 mr-2" />
                Block Date
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <div className="p-4 border-b bg-muted/10">
        {isAdding ? (
          <form
            action={handleAddSlot}
            className="border rounded-lg p-4 bg-background shadow-sm space-y-4 animate-in slide-in-from-top-2 fade-in duration-200"
          >
            <div className="flex items-center justify-between pb-2 border-b">
              <h4 className="text-sm font-semibold">New Time Slot</h4>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 -mr-2"
                onClick={() => setIsAdding(false)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Start Time</Label>
                <Input
                  name="start_time"
                  type="time"
                  defaultValue="09:00"
                  required
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">End Time</Label>
                <Input
                  name="end_time"
                  type="time"
                  defaultValue="17:00"
                  required
                  className="h-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Capacity</Label>
              <Input
                name="capacity"
                type="number"
                min="1"
                defaultValue="10"
                required
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Service (Optional)</Label>
              <Select name="service_id" defaultValue="all">
                <SelectTrigger className="h-9">
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

            <Button
              type="submit"
              size="sm"
              className="w-full bg-teal-600 hover:bg-teal-700 font-medium"
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Create Slot
            </Button>
          </form>
        ) : (
          <Button
            variant="default"
            className="w-full bg-teal-600 hover:bg-teal-700 shadow-sm"
            onClick={() => setIsAdding(true)}
            disabled={isBlocked}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Time Slot
          </Button>
        )}
      </div>

      <div className="flex-1 overflow-hidden relative">
        <ScrollArea className="h-full">
          <div className="p-4 space-y-4">
            {isBlocked && (
              <div className="bg-destructive/10 text-destructive text-sm p-4 rounded-md border border-destructive/20 flex items-center gap-2">
                <Ban className="h-4 w-4" />
                This date is currently blocked. No bookings will be accepted.
              </div>
            )}

            <div className="space-y-3">
              {displaySlots.map((slot) => (
                <div
                  key={slot.id}
                  className={`group relative border rounded-lg p-4 transition-all hover:bg-muted/30 ${
                    editingId === slot.id
                      ? "bg-muted/50 ring-1 ring-primary border-primary"
                      : "bg-card"
                  }`}
                >
                  {editingId === slot.id ? (
                    <form
                      action={(formData) => handleUpdateSlot(slot.id, formData)}
                      className="space-y-4"
                    >
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-muted-foreground">
                            Start Time
                          </Label>
                          <Input
                            name="start_time"
                            type="time"
                            defaultValue={slot.start_time}
                            required
                            className="bg-background h-9"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs font-medium text-muted-foreground">
                            End Time
                          </Label>
                          <Input
                            name="end_time"
                            type="time"
                            defaultValue={slot.end_time}
                            required
                            className="bg-background h-9"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">
                          Capacity
                        </Label>
                        <Input
                          name="capacity"
                          type="number"
                          min="1"
                          defaultValue={slot.capacity}
                          required
                          className="bg-background h-9"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-medium text-muted-foreground">
                          Service Filter (Optional)
                        </Label>
                        <Select
                          name="service_id"
                          defaultValue={slot.service_id || "all"}
                        >
                          <SelectTrigger className="bg-background h-9">
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

                      <div className="flex justify-end gap-2 pt-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingId(null)}
                          className="h-8"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          size="sm"
                          disabled={isPending}
                          className="h-8 bg-teal-600 hover:bg-teal-700"
                        >
                          {isPending && (
                            <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                          )}
                          <Save className="h-3 w-3 mr-2" />
                          Save Changes
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="font-mono font-normal text-xs bg-muted/50"
                          >
                            {slot.start_time} - {slot.end_time}
                          </Badge>
                          {slot.services && (
                            <Badge
                              variant="secondary"
                              className="text-xs font-normal"
                            >
                              {slot.services.name}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Users className="h-3.5 w-3.5" />
                          <span>
                            <span className="font-medium text-foreground">
                              {slot.booked_count}
                            </span>
                            <span className="text-muted-foreground/70">
                              /{slot.capacity} booked
                            </span>
                          </span>
                        </div>
                        {slot.booked_count >= slot.capacity && (
                          <Badge
                            variant="destructive"
                            className="mt-1 text-[10px] h-5"
                          >
                            Full
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => setEditingId(slot.id)}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteSlot(slot.id)}
                          disabled={isPending || slot.booked_count > 0}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Empty State */}
            {!isAdding && displaySlots.length === 0 && !isBlocked && (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="mx-auto h-8 w-8 text-muted-foreground/30 mb-2" />
                <p className="text-sm">No slots configured for this date.</p>
                <Button
                  variant="link"
                  onClick={() => setIsAdding(true)}
                  className="text-teal-600 mt-1"
                >
                  Add your first slot
                </Button>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </Card>
  );
}
