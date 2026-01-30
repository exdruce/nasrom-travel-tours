"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CreditCard, Clock, Bell, Ship, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  getBusinessSettings,
  updateBusinessSettings,
} from "@/app/actions/settings";

interface ConfigurationSectionProps {
  businessId: string;
}

interface SettingsData {
  payment_gateway: string;
  payment_gateway_enabled: boolean;
  auto_cancel_timeout: number;
  auto_cancel_enabled: boolean;
  email_notifications: boolean;
  whatsapp_notifications: boolean;
  notification_phone: string | null;
  boat_name: string | null;
  boat_reg_no: string | null;
  default_destination: string | null;
  crew_count: number;
}

const AUTO_CANCEL_OPTIONS = [
  { value: "15", label: "15 minutes" },
  { value: "30", label: "30 minutes" },
  { value: "60", label: "1 hour" },
  { value: "1440", label: "24 hours" },
];

export function ConfigurationSection({
  businessId,
}: ConfigurationSectionProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<SettingsData>({
    payment_gateway: "bayarcash",
    payment_gateway_enabled: true,
    auto_cancel_timeout: 30,
    auto_cancel_enabled: true,
    email_notifications: true,
    whatsapp_notifications: false,
    notification_phone: null,
    boat_name: "NASROM CABIN 01",
    boat_reg_no: "TRK 1234",
    default_destination: "JETI TOK BALI - PULAU PERHENTIAN",
    crew_count: 2,
  });

  useEffect(() => {
    async function loadSettings() {
      const result = await getBusinessSettings(businessId);
      if (result.settings) {
        setSettings(result.settings as SettingsData);
      }
      setIsLoading(false);
    }
    loadSettings();
  }, [businessId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await updateBusinessSettings(businessId, {
        payment_gateway: settings.payment_gateway,
        payment_gateway_enabled: settings.payment_gateway_enabled,
        auto_cancel_timeout: settings.auto_cancel_timeout,
        auto_cancel_enabled: settings.auto_cancel_enabled,
        email_notifications: settings.email_notifications,
        whatsapp_notifications: settings.whatsapp_notifications,
        notification_phone: settings.notification_phone || undefined,
        boat_name: settings.boat_name || undefined,
        boat_reg_no: settings.boat_reg_no || undefined,
        default_destination: settings.default_destination || undefined,
        crew_count: settings.crew_count,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Configuration saved successfully!");
    } catch {
      toast.error("Failed to save configuration");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Gateway */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Gateway
          </CardTitle>
          <CardDescription>
            Configure your payment processing settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">BayarCash (FPX / DuitNow)</Label>
              <p className="text-sm text-muted-foreground">
                Accept payments via Malaysian banks
              </p>
            </div>
            <Switch
              checked={settings.payment_gateway_enabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, payment_gateway_enabled: checked })
              }
            />
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground italic">
              Additional payment gateways (CHIP, Stripe, SenangPay, ToyyibPay)
              coming soon.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Auto-Cancel Timer */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Auto-Cancel Timer
          </CardTitle>
          <CardDescription>
            Automatically cancel unpaid bookings to free up capacity
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Enable Auto-Cancel</Label>
              <p className="text-sm text-muted-foreground">
                Cancel pending bookings after the timeout period
              </p>
            </div>
            <Switch
              checked={settings.auto_cancel_enabled}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, auto_cancel_enabled: checked })
              }
            />
          </div>

          {settings.auto_cancel_enabled && (
            <div className="space-y-2 pt-4">
              <Label>Cancel unpaid bookings after:</Label>
              <Select
                value={String(settings.auto_cancel_timeout)}
                onValueChange={(value) =>
                  setSettings({
                    ...settings,
                    auto_cancel_timeout: Number(value),
                  })
                }
              >
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AUTO_CANCEL_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Configure how you want to be notified about bookings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive booking confirmations and updates via email
              </p>
            </div>
            <Switch
              checked={settings.email_notifications}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, email_notifications: checked })
              }
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <Label className="text-base">WhatsApp Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive instant alerts via WhatsApp
              </p>
            </div>
            <Switch
              checked={settings.whatsapp_notifications}
              onCheckedChange={(checked) =>
                setSettings({ ...settings, whatsapp_notifications: checked })
              }
            />
          </div>

          {settings.whatsapp_notifications && (
            <div className="space-y-2 pt-4">
              <Label>WhatsApp Phone Number</Label>
              <Input
                placeholder="+60123456789"
                value={settings.notification_phone || ""}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notification_phone: e.target.value,
                  })
                }
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Boat/Vessel Info (for Manifest) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ship className="h-5 w-5" />
            Vessel Information
          </CardTitle>
          <CardDescription>
            Details for Jabatan Laut passenger manifest (Form JL)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Boat / Vessel Name</Label>
              <Input
                value={settings.boat_name || ""}
                onChange={(e) =>
                  setSettings({ ...settings, boat_name: e.target.value })
                }
                placeholder="e.g. NASROM CABIN 01"
              />
            </div>
            <div className="space-y-2">
              <Label>Registration Number</Label>
              <Input
                value={settings.boat_reg_no || ""}
                onChange={(e) =>
                  setSettings({ ...settings, boat_reg_no: e.target.value })
                }
                placeholder="e.g. TRK 1234"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Default Destination</Label>
            <Input
              value={settings.default_destination || ""}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  default_destination: e.target.value,
                })
              }
              placeholder="e.g. JETI TOK BALI - PULAU PERHENTIAN"
            />
          </div>

          <div className="space-y-2">
            <Label>Standard Crew Count</Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={settings.crew_count}
              onChange={(e) =>
                setSettings({ ...settings, crew_count: Number(e.target.value) })
              }
              className="w-24"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} size="lg">
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Configuration
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
