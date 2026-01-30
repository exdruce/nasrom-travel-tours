"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Globe,
  Copy,
  Check,
  Mail,
  Phone,
  Palette,
  Save,
  ExternalLink,
  Rocket,
  EyeOff,
  Settings2,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { updateBusiness, toggleBusinessPublish } from "@/app/actions/settings";
import { ConfigurationSection } from "@/components/settings/ConfigurationSection";
import { updateProfile } from "@/app/actions/user";
import type { Business, Profile } from "@/types";

interface SettingsPageClientProps {
  business: Business;
  profile: Profile | null;
}

export function SettingsPageClient({
  business,
  profile,
}: SettingsPageClientProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPublished, setIsPublished] = useState(business.is_published);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "profile" | "configuration" | "user"
  >("profile");
  const [profileFormData, setProfileFormData] = useState({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
    avatar_url: profile?.avatar_url || "",
  });
  const [formData, setFormData] = useState({
    name: business.name,
    slug: business.slug,
    description: business.description || "",
    contact_email: business.contact_email || "",
    contact_phone: business.contact_phone || "",
    address: business.address || "",
  });

  const branding = business.branding as {
    primary_color?: string;
    secondary_color?: string;
  } | null;

  const [colors, setColors] = useState({
    primary: branding?.primary_color || "#168D95",
    secondary: branding?.secondary_color || "#DE7F21",
  });

  const bookingUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/book/${business.slug}`
      : `/book/${business.slug}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(bookingUrl);
    setCopied(true);
    toast.success("Booking URL copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await updateBusiness(business.id, {
        ...formData,
        branding: {
          primary_color: colors.primary,
          secondary_color: colors.secondary,
        },
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      toast.success("Settings saved successfully!");
      setIsEditing(false);
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePublishToggle = async () => {
    setIsPublishing(true);
    try {
      const result = await toggleBusinessPublish(business.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      setIsPublished(result.isPublished!);
      toast.success(
        result.isPublished
          ? "🚀 Business published! Your booking page is now live."
          : "Business unpublished. Your booking page is now hidden.",
      );
      router.refresh();
    } catch {
      toast.error("Failed to update publish status");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
          <p className="text-gray-500">Manage your business settings</p>
        </div>
        {activeTab === "profile" && isEditing ? (
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        ) : activeTab === "profile" ? (
          <Button onClick={() => setIsEditing(true)}>Edit Settings</Button>
        ) : null}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b pb-2 overflow-x-auto">
        <Button
          variant={activeTab === "profile" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("profile")}
        >
          <Building2 className="h-4 w-4 mr-2" />
          Business Profile
        </Button>
        <Button
          variant={activeTab === "user" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("user")}
        >
          <User className="h-4 w-4 mr-2" />
          User Profile
        </Button>
        <Button
          variant={activeTab === "configuration" ? "default" : "ghost"}
          size="sm"
          onClick={() => setActiveTab("configuration")}
        >
          <Settings2 className="h-4 w-4 mr-2" />
          Configuration
        </Button>
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <>
          {/* Public Booking URL - Prominent */}
          <Card className="border-2 border-teal-200 bg-teal-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-teal-700">
                <Globe className="h-5 w-5" />
                Public Booking URL
              </CardTitle>
              <CardDescription>
                Share this link with customers to let them book your services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-white rounded-lg border px-4 py-3 font-mono text-sm">
                  {bookingUrl}
                </div>
                <Button variant="outline" size="icon" onClick={handleCopy}>
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button asChild>
                  <a
                    href={bookingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Preview
                  </a>
                </Button>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge
                    variant={isPublished ? "default" : "secondary"}
                    className={isPublished ? "bg-green-500" : "bg-yellow-500"}
                  >
                    {isPublished ? "Published" : "Draft"}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {isPublished
                      ? "Your booking page is live and accepting bookings"
                      : "Publish your business to accept bookings"}
                  </span>
                </div>
                <Button
                  variant={isPublished ? "outline" : "default"}
                  size="sm"
                  onClick={handlePublishToggle}
                  disabled={isPublishing}
                >
                  {isPublishing ? (
                    "Processing..."
                  ) : isPublished ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-2" />
                      Unpublish
                    </>
                  ) : (
                    <>
                      <Rocket className="h-4 w-4 mr-2" />
                      Publish Now
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Business Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Business Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Business Name</Label>
                  {isEditing ? (
                    <Input
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  ) : (
                    <p className="text-lg font-medium">{business.name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>URL Slug</Label>
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">/book/</span>
                      <Input
                        value={formData.slug}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            slug: e.target.value
                              .toLowerCase()
                              .replace(/[^a-z0-9-]/g, "-"),
                          })
                        }
                      />
                    </div>
                  ) : (
                    <p className="font-mono text-teal-600">{business.slug}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                {isEditing ? (
                  <textarea
                    className="w-full min-h-[100px] px-3 py-2 border rounded-md resize-none"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Describe your business..."
                  />
                ) : (
                  <p className="text-gray-600">
                    {business.description || "No description set"}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Address</Label>
                {isEditing ? (
                  <Input
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="Your business address"
                  />
                ) : (
                  <p className="text-gray-600">
                    {business.address || "No address set"}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Contact Email
                  </Label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={formData.contact_email}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contact_email: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <p>{business.contact_email || "Not set"}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Contact Phone
                  </Label>
                  {isEditing ? (
                    <Input
                      type="tel"
                      value={formData.contact_phone}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          contact_phone: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <p>{business.contact_phone || "Not set"}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Branding */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Branding
              </CardTitle>
              <CardDescription>
                Customize colors for your booking page
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex items-center gap-3">
                    {isEditing ? (
                      <>
                        <input
                          type="color"
                          value={colors.primary}
                          onChange={(e) =>
                            setColors({ ...colors, primary: e.target.value })
                          }
                          className="w-12 h-12 rounded cursor-pointer"
                        />
                        <Input
                          value={colors.primary}
                          onChange={(e) =>
                            setColors({ ...colors, primary: e.target.value })
                          }
                          className="w-32 font-mono"
                        />
                      </>
                    ) : (
                      <>
                        <div
                          className="w-12 h-12 rounded"
                          style={{ backgroundColor: colors.primary }}
                        />
                        <span className="font-mono">{colors.primary}</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Secondary Color</Label>
                  <div className="flex items-center gap-3">
                    {isEditing ? (
                      <>
                        <input
                          type="color"
                          value={colors.secondary}
                          onChange={(e) =>
                            setColors({ ...colors, secondary: e.target.value })
                          }
                          className="w-12 h-12 rounded cursor-pointer"
                        />
                        <Input
                          value={colors.secondary}
                          onChange={(e) =>
                            setColors({ ...colors, secondary: e.target.value })
                          }
                          className="w-32 font-mono"
                        />
                      </>
                    ) : (
                      <>
                        <div
                          className="w-12 h-12 rounded"
                          style={{ backgroundColor: colors.secondary }}
                        />
                        <span className="font-mono">{colors.secondary}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Configuration Tab */}
      {activeTab === "configuration" && (
        <ConfigurationSection businessId={business.id} />
      )}

      {/* User Profile Tab */}
      {activeTab === "user" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name</Label>
                  <Input
                    value={profileFormData.full_name}
                    onChange={(e) =>
                      setProfileFormData({
                        ...profileFormData,
                        full_name: e.target.value,
                      })
                    }
                    placeholder="Your Full Name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input
                    value={profileFormData.phone}
                    onChange={(e) =>
                      setProfileFormData({
                        ...profileFormData,
                        phone: e.target.value,
                      })
                    }
                    placeholder="Your Phone Number"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  value={profile?.email || ""}
                  disabled
                  className="bg-gray-100"
                />
                <p className="text-xs text-gray-500">
                  Email cannot be changed directly. Contact support if needed.
                </p>
              </div>

              <div className="pt-4 flex justify-end">
                <Button
                  onClick={async () => {
                    setIsSaving(true);
                    try {
                      if (!profile) return;
                      const result = await updateProfile(
                        profile.id,
                        profileFormData,
                      );
                      if (result.error) {
                        toast.error(result.error);
                      } else {
                        toast.success("Profile updated successfully");
                      }
                    } catch {
                      toast.error("Failed to update profile");
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Update Profile"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
