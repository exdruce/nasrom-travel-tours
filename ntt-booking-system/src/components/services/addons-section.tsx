"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Plus, Edit, Trash2, Loader2, Gift, Eye, EyeOff } from "lucide-react";
import { createAddon, updateAddon, deleteAddon } from "@/app/actions/services";
import type { ServiceAddon } from "@/types";

interface AddonsSectionProps {
  serviceId: string;
  addons: ServiceAddon[];
}

export function AddonsSection({ serviceId, addons }: AddonsSectionProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ms-MY", {
      style: "currency",
      currency: "MYR",
    }).format(price);
  };

  const handleAdd = (formData: FormData) => {
    const name = formData.get("name") as string;
    const price = parseFloat(formData.get("price") as string);
    const description = formData.get("description") as string;

    startTransition(async () => {
      await createAddon(serviceId, { name, price, description });
      setIsAdding(false);
    });
  };

  const handleUpdate = (addonId: string, formData: FormData) => {
    const name = formData.get("name") as string;
    const price = parseFloat(formData.get("price") as string);
    const description = formData.get("description") as string;

    startTransition(async () => {
      await updateAddon(addonId, { name, price, description });
      setEditingId(null);
    });
  };

  const handleToggleStatus = (addon: ServiceAddon) => {
    startTransition(async () => {
      await updateAddon(addon.id, {
        name: addon.name,
        price: addon.price,
        description: addon.description || undefined,
        is_active: !addon.is_active,
      });
    });
  };

  const handleDelete = (addonId: string) => {
    if (confirm("Delete this add-on?")) {
      startTransition(async () => {
        await deleteAddon(addonId, serviceId);
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Gift className="h-5 w-5" />
              Add-ons
            </CardTitle>
            <CardDescription>
              Optional extras customers can add to their booking (e.g.,
              Equipment Rental, Meals)
            </CardDescription>
          </div>
          {!isAdding && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Add-on
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Form */}
        {isAdding && (
          <form
            action={handleAdd}
            className="bg-gray-50 p-4 rounded-lg space-y-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="new-addon-name">Name *</Label>
                <Input
                  id="new-addon-name"
                  name="name"
                  placeholder="e.g., Snorkeling Gear"
                  required
                />
              </div>
              <div>
                <Label htmlFor="new-addon-price">Price (RM) *</Label>
                <Input
                  id="new-addon-price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="new-addon-desc">Description</Label>
                <Input
                  id="new-addon-desc"
                  name="description"
                  placeholder="Optional description"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Add-on
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
        )}

        {/* Addons List */}
        {addons.length > 0 ? (
          <div className="space-y-3">
            {addons.map((addon) => (
              <div
                key={addon.id}
                className={`flex items-center justify-between p-4 bg-white border rounded-lg ${
                  !addon.is_active ? "opacity-60" : ""
                }`}
              >
                {editingId === addon.id ? (
                  <form
                    action={(formData) => handleUpdate(addon.id, formData)}
                    className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4"
                  >
                    <Input name="name" defaultValue={addon.name} required />
                    <Input
                      name="price"
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={addon.price}
                      required
                    />
                    <div className="flex gap-2">
                      <Input
                        name="description"
                        defaultValue={addon.description || ""}
                        placeholder="Description"
                      />
                      <Button type="submit" size="sm" disabled={isPending}>
                        {isPending && (
                          <Loader2 className="h-4 w-4 animate-spin" />
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
                    <div className="flex items-center gap-3">
                      {!addon.is_active && (
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded">
                          Inactive
                        </span>
                      )}
                      <div>
                        <p className="font-medium">{addon.name}</p>
                        {addon.description && (
                          <p className="text-sm text-gray-500">
                            {addon.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-teal-600">
                        +{formatPrice(addon.price)}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleToggleStatus(addon)}
                          disabled={isPending}
                          title={addon.is_active ? "Deactivate" : "Activate"}
                        >
                          {addon.is_active ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setEditingId(addon.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(addon.id)}
                          disabled={isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4">
            No add-ons added yet. Add optional extras for customers to enhance
            their booking.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
