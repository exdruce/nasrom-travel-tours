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
import { Plus, Edit, Trash2, Loader2, Tags } from "lucide-react";
import {
  createVariant,
  updateVariant,
  deleteVariant,
} from "@/app/actions/services";
import type { ServiceVariant } from "@/types";

interface VariantsSectionProps {
  serviceId: string;
  variants: ServiceVariant[];
}

export function VariantsSection({ serviceId, variants }: VariantsSectionProps) {
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
      await createVariant(serviceId, { name, price, description });
      setIsAdding(false);
    });
  };

  const handleUpdate = (variantId: string, formData: FormData) => {
    const name = formData.get("name") as string;
    const price = parseFloat(formData.get("price") as string);
    const description = formData.get("description") as string;

    startTransition(async () => {
      await updateVariant(variantId, { name, price, description });
      setEditingId(null);
    });
  };

  const handleDelete = (variantId: string) => {
    if (confirm("Delete this variant?")) {
      startTransition(async () => {
        await deleteVariant(variantId, serviceId);
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Tags className="h-5 w-5" />
              Price Variants
            </CardTitle>
            <CardDescription>
              Add different pricing options (e.g., Adult, Child, Senior)
            </CardDescription>
          </div>
          {!isAdding && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAdding(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Variant
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
                <Label htmlFor="new-variant-name">Name *</Label>
                <Input
                  id="new-variant-name"
                  name="name"
                  placeholder="e.g., Adult"
                  required
                />
              </div>
              <div>
                <Label htmlFor="new-variant-price">Price (RM) *</Label>
                <Input
                  id="new-variant-price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <Label htmlFor="new-variant-desc">Description</Label>
                <Input
                  id="new-variant-desc"
                  name="description"
                  placeholder="Optional description"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Add Variant
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

        {/* Variants List */}
        {variants.length > 0 ? (
          <div className="space-y-3">
            {variants.map((variant) => (
              <div
                key={variant.id}
                className="flex items-center justify-between p-4 bg-white border rounded-lg"
              >
                {editingId === variant.id ? (
                  <form
                    action={(formData) => handleUpdate(variant.id, formData)}
                    className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4"
                  >
                    <Input name="name" defaultValue={variant.name} required />
                    <Input
                      name="price"
                      type="number"
                      step="0.01"
                      min="0"
                      defaultValue={variant.price}
                      required
                    />
                    <div className="flex gap-2">
                      <Input
                        name="description"
                        defaultValue={variant.description || ""}
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
                    <div>
                      <p className="font-medium">{variant.name}</p>
                      {variant.description && (
                        <p className="text-sm text-gray-500">
                          {variant.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold text-teal-600">
                        {formatPrice(variant.price)}
                      </span>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setEditingId(variant.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(variant.id)}
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
            No variants added yet. Add variants for different pricing tiers.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
