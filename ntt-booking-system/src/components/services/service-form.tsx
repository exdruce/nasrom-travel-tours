"use client";

import { useState, useActionState, useTransition } from "react";
import { useFormStatus } from "react-dom";
import {
  createService,
  updateService,
  createVariant,
  updateVariant,
  deleteVariant,
  createAddon,
  updateAddon,
  deleteAddon,
  type ServiceFormState,
} from "@/app/actions/services";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Package,
  Clock,
  Users,
  DollarSign,
  Loader2,
  Plus,
  Trash2,
  Edit,
  Tags,
  Gift,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Service, ServiceVariant, ServiceAddon } from "@/types";

interface ServiceFormProps {
  service?: Service;
  variants?: ServiceVariant[];
  addons?: ServiceAddon[];
}

function SubmitButton({ isEdit }: { isEdit: boolean }) {
  const { pending } = useFormStatus();

  return (
    <Button
      type="submit"
      className="bg-teal-600 hover:bg-teal-700"
      disabled={pending}
    >
      {pending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
      {isEdit ? "Save Changes" : "Create Service"}
    </Button>
  );
}

export function ServiceForm({
  service,
  variants = [],
  addons = [],
}: ServiceFormProps) {
  const isEdit = !!service;
  const [isPending, startTransition] = useTransition();

  // Variant state
  const [isAddingVariant, setIsAddingVariant] = useState(false);
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);
  const [newVariant, setNewVariant] = useState({
    name: "",
    price: "",
    duration: "",
    capacity: "",
  });

  // Addon state
  const [isAddingAddon, setIsAddingAddon] = useState(false);
  const [editingAddonId, setEditingAddonId] = useState<string | null>(null);
  const [newAddon, setNewAddon] = useState({
    name: "",
    price: "",
    description: "",
  });

  const initialState: ServiceFormState = {};

  const actionWithId = isEdit
    ? updateService.bind(null, service.id)
    : createService;

  const [state, formAction] = useActionState(actionWithId, initialState);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("ms-MY", {
      style: "currency",
      currency: "MYR",
    }).format(price);
  };

  // Variant handlers
  const handleAddVariant = () => {
    if (!newVariant.name || !newVariant.price) return;
    if (!service?.id) return;

    startTransition(async () => {
      await createVariant(service.id, {
        name: newVariant.name,
        price: parseFloat(newVariant.price),
        description: newVariant.duration
          ? `${newVariant.duration} min, ${newVariant.capacity} pax`
          : undefined,
      });
      setNewVariant({ name: "", price: "", duration: "", capacity: "" });
      setIsAddingVariant(false);
    });
  };

  const handleUpdateVariant = (variantId: string, formData: FormData) => {
    const name = formData.get("name") as string;
    const priceStr = formData.get("price") as string;
    const price = parseFloat(priceStr);
    const description = formData.get("description") as string;

    // Validate required fields
    if (!name || !name.trim()) {
      alert("Variant name is required");
      return;
    }
    if (!priceStr || isNaN(price) || price < 0) {
      alert("Valid price is required");
      return;
    }

    startTransition(async () => {
      await updateVariant(variantId, {
        name: name.trim(),
        price,
        description: description?.trim() || undefined,
      });
      setEditingVariantId(null);
    });
  };

  const handleDeleteVariant = (variantId: string) => {
    if (!service?.id) return;
    startTransition(async () => {
      await deleteVariant(variantId, service.id);
    });
  };

  // Addon handlers
  const handleAddAddon = () => {
    if (!newAddon.name || !newAddon.price) return;
    if (!service?.id) return;

    startTransition(async () => {
      await createAddon(service.id, {
        name: newAddon.name,
        price: parseFloat(newAddon.price),
        description: newAddon.description || undefined,
      });
      setNewAddon({ name: "", price: "", description: "" });
      setIsAddingAddon(false);
    });
  };

  const handleUpdateAddon = (addonId: string, formData: FormData) => {
    const name = formData.get("name") as string;
    const priceStr = formData.get("price") as string;
    const price = parseFloat(priceStr);
    const description = formData.get("description") as string;

    // Validate required fields
    if (!name || !name.trim()) {
      alert("Add-on name is required");
      return;
    }
    if (!priceStr || isNaN(price) || price < 0) {
      alert("Valid price is required");
      return;
    }

    startTransition(async () => {
      await updateAddon(addonId, {
        name: name.trim(),
        price,
        description: description?.trim() || undefined,
      });
      setEditingAddonId(null);
    });
  };

  const handleDeleteAddon = (addonId: string) => {
    if (!service?.id) return;
    startTransition(async () => {
      await deleteAddon(addonId, service.id);
    });
  };

  return (
    <div className="space-y-6">
      <form action={formAction} className="space-y-6">
        {/* Form Error */}
        {state?.errors?._form && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg">
            {state.errors._form.join(", ")}
          </div>
        )}

        {/* Success Message */}
        {state?.success && (
          <div className="bg-green-50 text-green-700 p-4 rounded-lg">
            Service updated successfully!
          </div>
        )}

        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>
              The main details about this service
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="name">Service Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Perhentian Island Day Trip"
                defaultValue={service?.name || ""}
                className={state?.errors?.name ? "border-red-500" : ""}
              />
              {state?.errors?.name && (
                <p className="text-sm text-red-500 mt-1">
                  {state.errors.name.join(", ")}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe what's included in this service..."
                rows={4}
                defaultValue={service?.description || ""}
              />
              {state?.errors?.description && (
                <p className="text-sm text-red-500 mt-1">
                  {state.errors.description.join(", ")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Capacity & Duration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Capacity & Duration
            </CardTitle>
            <CardDescription>
              Set the maximum capacity and duration for this service. Pricing is
              set per variant below (Adult, Child, Senior, etc.)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Duration & Capacity Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="duration_minutes"
                    name="duration_minutes"
                    type="number"
                    min="0"
                    step="15"
                    placeholder="Optional"
                    className={`pl-10 ${state?.errors?.duration_minutes ? "border-red-500" : ""}`}
                    defaultValue={service?.duration_minutes || ""}
                  />
                </div>
                {state?.errors?.duration_minutes && (
                  <p className="text-sm text-red-500 mt-1">
                    {state.errors.duration_minutes.join(", ")}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="max_capacity">Max Capacity *</Label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="max_capacity"
                    name="max_capacity"
                    type="number"
                    min="1"
                    placeholder="10"
                    className={`pl-10 ${state?.errors?.max_capacity ? "border-red-500" : ""}`}
                    defaultValue={service?.max_capacity || 10}
                  />
                </div>
                {state?.errors?.max_capacity && (
                  <p className="text-sm text-red-500 mt-1">
                    {state.errors.max_capacity.join(", ")}
                  </p>
                )}
              </div>
            </div>

            {/* Price Variants Section - only show when editing */}
            {isEdit && (
              <div className="border-t pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Tags className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-700">
                      Price Variants
                    </span>
                    <span className="text-xs text-gray-400">
                      e.g. Adult, Child, Senior
                    </span>
                  </div>
                  {!isAddingVariant && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddingVariant(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Variant
                    </Button>
                  )}
                </div>

                {/* Existing Variants */}
                {variants.length > 0 && (
                  <div className="space-y-2">
                    {variants.map((variant) => (
                      <div
                        key={variant.id}
                        className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
                      >
                        {editingVariantId === variant.id ? (
                          <div className="flex-1 grid grid-cols-4 gap-3 items-end">
                            <div>
                              <Label className="text-xs">Name</Label>
                              <Input
                                id={`variant-name-${variant.id}`}
                                defaultValue={variant.name}
                                required
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Price (RM)</Label>
                              <Input
                                id={`variant-price-${variant.id}`}
                                type="number"
                                step="0.01"
                                min="0"
                                defaultValue={variant.price}
                                required
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Description</Label>
                              <Input
                                id={`variant-description-${variant.id}`}
                                defaultValue={variant.description || ""}
                                placeholder="e.g., Ages 12+"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                disabled={isPending}
                                onClick={() => {
                                  const formData = new FormData();
                                  const nameInput = document.getElementById(
                                    `variant-name-${variant.id}`,
                                  ) as HTMLInputElement;
                                  const priceInput = document.getElementById(
                                    `variant-price-${variant.id}`,
                                  ) as HTMLInputElement;
                                  const descInput = document.getElementById(
                                    `variant-description-${variant.id}`,
                                  ) as HTMLInputElement;
                                  formData.append(
                                    "name",
                                    nameInput?.value || "",
                                  );
                                  formData.append(
                                    "price",
                                    priceInput?.value || "",
                                  );
                                  formData.append(
                                    "description",
                                    descInput?.value || "",
                                  );
                                  handleUpdateVariant(variant.id, formData);
                                }}
                              >
                                {isPending && (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                )}
                                Save
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingVariantId(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-4">
                              <div>
                                <p className="font-medium">{variant.name}</p>
                                {variant.description && (
                                  <p className="text-xs text-gray-500">
                                    {variant.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-teal-600">
                                {formatPrice(variant.price)}
                              </span>
                              <div className="flex gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setEditingVariantId(variant.id);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-red-600 hover:text-red-700"
                                      disabled={isPending}
                                      onClick={(e) => {
                                        // Stop propagation so we don't trigger parent clicks or form submission
                                        // But DO NOT preventDefault, because AlertDialogTrigger needs the click
                                        e.stopPropagation();
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Delete Variant?
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently delete the variant
                                        "{variant.name}". This action cannot be
                                        undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteVariant(variant.id);
                                        }}
                                        className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* New Variant Form */}
                {isAddingVariant && (
                  <div className="p-4 border border-blue-200 bg-blue-50/50 rounded-lg space-y-3">
                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <Label className="text-xs">Variant Name *</Label>
                        <Input
                          placeholder="e.g., Adult"
                          value={newVariant.name}
                          onChange={(e) =>
                            setNewVariant({
                              ...newVariant,
                              name: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Price (RM) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={newVariant.price}
                          onChange={(e) =>
                            setNewVariant({
                              ...newVariant,
                              price: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Duration (min)</Label>
                        <Input
                          type="number"
                          placeholder="Optional"
                          value={newVariant.duration}
                          onChange={(e) =>
                            setNewVariant({
                              ...newVariant,
                              duration: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Capacity</Label>
                        <Input
                          type="number"
                          placeholder="Optional"
                          value={newVariant.capacity}
                          onChange={(e) =>
                            setNewVariant({
                              ...newVariant,
                              capacity: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddVariant}
                        disabled={
                          isPending || !newVariant.name || !newVariant.price
                        }
                      >
                        {isPending && (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        )}
                        Add Variant
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsAddingVariant(false);
                          setNewVariant({
                            name: "",
                            price: "",
                            duration: "",
                            capacity: "",
                          });
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {variants.length === 0 && !isAddingVariant && (
                  <p className="text-sm text-gray-500 text-center py-2">
                    No variants added. Use variants for different pricing tiers
                    (Adult, Child, etc.)
                  </p>
                )}
              </div>
            )}

            {/* Add-ons Section - only show when editing */}
            {isEdit && (
              <div className="border-t pt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-700">Add-ons</span>
                    <span className="text-xs text-gray-400">
                      optional extras
                    </span>
                  </div>
                  {!isAddingAddon && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddingAddon(true)}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Add-on
                    </Button>
                  )}
                </div>

                {/* Existing Add-ons */}
                {addons.length > 0 && (
                  <div className="space-y-2">
                    {addons.map((addon) => (
                      <div
                        key={addon.id}
                        className={`flex items-center justify-between p-3 bg-amber-50 rounded-lg ${
                          !addon.is_active ? "opacity-60" : ""
                        }`}
                      >
                        {editingAddonId === addon.id ? (
                          <div className="flex-1 grid grid-cols-3 gap-3 items-end">
                            <div>
                              <Label className="text-xs">Name</Label>
                              <Input
                                id={`addon-name-${addon.id}`}
                                defaultValue={addon.name}
                                required
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Price (RM)</Label>
                              <Input
                                id={`addon-price-${addon.id}`}
                                type="number"
                                step="0.01"
                                min="0"
                                defaultValue={addon.price}
                                required
                              />
                            </div>
                            <div className="flex gap-2">
                              <Input
                                id={`addon-description-${addon.id}`}
                                defaultValue={addon.description || ""}
                                placeholder="Description"
                              />
                              <Button
                                type="button"
                                size="sm"
                                disabled={isPending}
                                onClick={() => {
                                  const formData = new FormData();
                                  const nameInput = document.getElementById(
                                    `addon-name-${addon.id}`,
                                  ) as HTMLInputElement;
                                  const priceInput = document.getElementById(
                                    `addon-price-${addon.id}`,
                                  ) as HTMLInputElement;
                                  const descInput = document.getElementById(
                                    `addon-description-${addon.id}`,
                                  ) as HTMLInputElement;
                                  formData.append(
                                    "name",
                                    nameInput?.value || "",
                                  );
                                  formData.append(
                                    "price",
                                    priceInput?.value || "",
                                  );
                                  formData.append(
                                    "description",
                                    descInput?.value || "",
                                  );
                                  handleUpdateAddon(addon.id, formData);
                                }}
                              >
                                {isPending && (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                )}
                                Save
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setEditingAddonId(null)}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
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
                                  <p className="text-xs text-gray-500">
                                    {addon.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-semibold text-teal-600">
                                +{formatPrice(addon.price)}
                              </span>
                              <div className="flex gap-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setEditingAddonId(addon.id);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-red-600 hover:text-red-700"
                                      disabled={isPending}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        Delete Add-on?
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently delete the add-on
                                        "{addon.name}". This action cannot be
                                        undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteAddon(addon.id);
                                        }}
                                        className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                                      >
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* New Add-on Form */}
                {isAddingAddon && (
                  <div className="p-4 border border-amber-200 bg-amber-50/50 rounded-lg space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">Add-on Name *</Label>
                        <Input
                          placeholder="e.g., Snorkeling Gear"
                          value={newAddon.name}
                          onChange={(e) =>
                            setNewAddon({ ...newAddon, name: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Price (RM) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={newAddon.price}
                          onChange={(e) =>
                            setNewAddon({ ...newAddon, price: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Description</Label>
                        <Input
                          placeholder="Optional"
                          value={newAddon.description}
                          onChange={(e) =>
                            setNewAddon({
                              ...newAddon,
                              description: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddAddon}
                        disabled={
                          isPending || !newAddon.name || !newAddon.price
                        }
                      >
                        {isPending && (
                          <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                        )}
                        Add Add-on
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsAddingAddon(false);
                          setNewAddon({ name: "", price: "", description: "" });
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {addons.length === 0 && !isAddingAddon && (
                  <p className="text-sm text-gray-500 text-center py-2">
                    No add-ons added. Add optional extras customers can select.
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Status */}
        <Card>
          <CardHeader>
            <CardTitle>Status</CardTitle>
            <CardDescription>
              Control whether this service is visible to customers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="is_active"
                name="is_active"
                value="true"
                defaultChecked={service?.is_active ?? true}
                className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <Label htmlFor="is_active" className="font-normal">
                Active - service is visible and available for booking
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-end gap-4">
          <Button type="button" variant="outline" asChild>
            <a href="/dashboard/services">Cancel</a>
          </Button>
          <SubmitButton isEdit={isEdit} />
        </div>
      </form>
    </div>
  );
}
