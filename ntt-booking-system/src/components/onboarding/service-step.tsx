"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  serviceSchema,
  type ServiceFormValues,
} from "@/lib/schemas/onboarding";
import {
  createFirstService,
  createAdditionalService,
} from "@/app/actions/onboarding";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Package, Gift, Tags } from "lucide-react";
import { useRouter } from "next/navigation";

interface ServiceStepProps {
  businessId: string;
}

interface VariantData {
  name: string;
  price: number;
  description?: string;
}

interface AddonData {
  name: string;
  price: number;
  description?: string;
}

interface ServiceWithExtras extends ServiceFormValues {
  variants: VariantData[];
  addons: AddonData[];
}

export function ServiceStep({ businessId }: ServiceStepProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<ServiceWithExtras[]>([]);

  // Price Variants
  const [variants, setVariants] = useState<VariantData[]>([]);
  const [showVariantForm, setShowVariantForm] = useState(false);
  const [newVariant, setNewVariant] = useState({
    name: "",
    price: 0,
    description: "",
  });

  // Add-ons
  const [addons, setAddons] = useState<AddonData[]>([]);
  const [showAddonForm, setShowAddonForm] = useState(false);
  const [newAddon, setNewAddon] = useState({
    name: "",
    price: 0,
    description: "",
  });

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema) as any,
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      duration_minutes: 60,
      max_capacity: 10,
    },
  });

  // Variant functions
  const addVariant = () => {
    if (!newVariant.name || newVariant.price < 0) {
      toast.error("Please fill in variant name and price");
      return;
    }
    setVariants([...variants, { ...newVariant }]);
    setNewVariant({ name: "", price: 0, description: "" });
    setShowVariantForm(false);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  // Addon functions
  const addAddon = () => {
    if (!newAddon.name || newAddon.price < 0) {
      toast.error("Please fill in addon name and price");
      return;
    }
    setAddons([...addons, { ...newAddon }]);
    setNewAddon({ name: "", price: 0, description: "" });
    setShowAddonForm(false);
  };

  const removeAddon = (index: number) => {
    setAddons(addons.filter((_, i) => i !== index));
  };

  const addService = (data: ServiceFormValues) => {
    setServices([
      ...services,
      { ...data, variants: [...variants], addons: [...addons] },
    ]);
    setVariants([]);
    setAddons([]);
    form.reset({
      name: "",
      description: "",
      price: 0,
      duration_minutes: 60,
      max_capacity: 10,
    });
    toast.success("Service added! You can add more or complete setup.");
  };

  const removeService = (index: number) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const completeSetup = async () => {
    // Get current form data as a service if it has a name
    const currentFormData = form.getValues();
    let allServices = [...services];

    if (currentFormData.name) {
      allServices.push({
        ...currentFormData,
        variants: [...variants],
        addons: [...addons],
      });
    }

    if (allServices.length === 0) {
      toast.error("Please add at least one service");
      return;
    }

    setLoading(true);
    try {
      // Create all services
      for (let i = 0; i < allServices.length; i++) {
        const service = allServices[i];
        if (i === 0) {
          // First service uses the original action that also publishes the business
          await createFirstService(
            businessId,
            service,
            service.variants,
            service.addons,
          );
        } else {
          // Additional services
          await createAdditionalService(
            businessId,
            service,
            service.variants,
            service.addons,
          );
        }
      }

      toast.success("Setup complete!");
      router.push("/dashboard");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Something went wrong",
      );
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Saved Services */}
      {services.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">
            Added Services ({services.length})
          </h3>
          {services.map((service, index) => (
            <Card key={index} className="bg-gray-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                      <Package className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="text-sm text-gray-500">
                        RM {service.price} · {service.duration_minutes} min
                        {service.variants.length > 0 &&
                          ` · ${service.variants.length} variant${service.variants.length > 1 ? "s" : ""}`}
                        {service.addons.length > 0 &&
                          ` · ${service.addons.length} add-on${service.addons.length > 1 ? "s" : ""}`}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeService(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Service Form */}
      <Form {...form}>
        <form className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Service Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="e.g. Island Hopping Package A"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="What's included in this service?"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Base Price (RM)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="duration_minutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Duration (min)</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="max_capacity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Capacity</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Price Variants Section */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Tags className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  Price Variants {variants.length > 0 && `(${variants.length})`}
                </span>
                <span className="text-xs text-gray-400">
                  e.g. Adult, Child, Senior
                </span>
              </div>
              {!showVariantForm && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowVariantForm(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Price
                </Button>
              )}
            </div>

            {/* Existing Variants */}
            {variants.map((variant, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium">{variant.name}</p>
                  <p className="text-xs text-gray-500">RM {variant.price}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeVariant(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {/* New Variant Form */}
            {showVariantForm && (
              <div className="p-3 border border-blue-200 bg-blue-50/50 rounded-lg space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500">
                      Variant Name
                    </label>
                    <Input
                      placeholder="e.g. Adult, Child, Senior"
                      value={newVariant.name}
                      onChange={(e) =>
                        setNewVariant({ ...newVariant, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Price (RM)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newVariant.price}
                      onChange={(e) =>
                        setNewVariant({
                          ...newVariant,
                          price: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500">
                    Description (optional)
                  </label>
                  <Input
                    placeholder="e.g. Ages 12 and above"
                    value={newVariant.description}
                    onChange={(e) =>
                      setNewVariant({
                        ...newVariant,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="button" size="sm" onClick={addVariant}>
                    Add Variant
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowVariantForm(false);
                      setNewVariant({ name: "", price: 0, description: "" });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Add-ons Section */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  Add-ons {addons.length > 0 && `(${addons.length})`}
                </span>
                <span className="text-xs text-gray-400">optional extras</span>
              </div>
              {!showAddonForm && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAddonForm(true)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              )}
            </div>

            {/* Existing Add-ons */}
            {addons.map((addon, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-amber-50 rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium">{addon.name}</p>
                  <p className="text-xs text-gray-500">RM {addon.price}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAddon(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {/* New Add-on Form */}
            {showAddonForm && (
              <div className="p-3 border border-amber-200 bg-amber-50/50 rounded-lg space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500">Addon Name</label>
                    <Input
                      placeholder="e.g. Underwater Camera"
                      value={newAddon.name}
                      onChange={(e) =>
                        setNewAddon({ ...newAddon, name: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Price (RM)</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newAddon.price}
                      onChange={(e) =>
                        setNewAddon({
                          ...newAddon,
                          price: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500">
                    Description (optional)
                  </label>
                  <Input
                    placeholder="Brief description..."
                    value={newAddon.description}
                    onChange={(e) =>
                      setNewAddon({ ...newAddon, description: e.target.value })
                    }
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="button" size="sm" onClick={addAddon}>
                    Add Addon
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowAddonForm(false);
                      setNewAddon({ name: "", price: 0, description: "" });
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </form>
      </Form>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={form.handleSubmit(addService)}
          disabled={loading || !form.getValues("name")}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Another Service
        </Button>
        <Button
          type="button"
          className="flex-1 bg-teal-600 hover:bg-teal-700"
          onClick={completeSetup}
          disabled={loading}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Complete Setup
        </Button>
      </div>

      <p className="text-xs text-center text-gray-500">
        You can always add more services, variants and add-ons later from the
        dashboard.
      </p>
    </div>
  );
}
