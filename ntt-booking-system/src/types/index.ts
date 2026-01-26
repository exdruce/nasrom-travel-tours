export type UserRole = "admin" | "owner" | "staff" | "customer";
export type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";
export type PaymentStatus =
  | "pending"
  | "processing"
  | "succeeded"
  | "failed"
  | "refunded";
export type PaymentMethod = "card" | "fpx" | "grabpay" | "other";
export type BookingItemType = "variant" | "addon";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  branding: Json | null;
  contact_phone: string | null;
  contact_email: string | null;
  address: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  max_capacity: number;
  images: string[];
  is_active: boolean;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}

export interface ServiceVariant {
  id: string;
  service_id: string;
  name: string;
  price: number;
  description: string | null;
  sort_order: number | null;
  created_at: string;
}

export interface ServiceAddon {
  id: string;
  service_id: string;
  name: string;
  price: number;
  description: string | null;
  is_active: boolean;
  sort_order: number | null;
  created_at: string;
}

export interface Availability {
  id: string;
  business_id: string;
  service_id: string | null;
  date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  booked_count: number;
  is_blocked: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  ref_code: string;
  business_id: string;
  service_id: string;
  customer_id: string | null;
  availability_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  booking_date: string;
  start_time: string;
  pax: number;
  status: BookingStatus;
  subtotal: number;
  addons_total: number;
  total_amount: number;
  notes: string | null;
  internal_notes: string | null;
  cancelled_at: string | null;
  cancelled_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface BookingItem {
  id: string;
  booking_id: string;
  type: BookingItemType;
  item_id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  stripe_payment_id: string | null;
  stripe_session_id: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod | null;
  refund_amount: number | null;
  refund_reason: string | null;
  metadata: Json | null;
  created_at: string;
  updated_at: string;
}

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, "created_at" | "updated_at">;
        Update: Partial<Omit<Profile, "id" | "created_at" | "updated_at">>;
      };
      businesses: {
        Row: Business;
        Insert: Omit<Business, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Business, "id" | "created_at" | "updated_at">>;
      };
      services: {
        Row: Service;
        Insert: Omit<Service, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Service, "id" | "created_at" | "updated_at">>;
      };
      service_variants: {
        Row: ServiceVariant;
        Insert: Omit<ServiceVariant, "id" | "created_at">;
        Update: Partial<Omit<ServiceVariant, "id" | "created_at">>;
      };
      service_addons: {
        Row: ServiceAddon;
        Insert: Omit<ServiceAddon, "id" | "created_at">;
        Update: Partial<Omit<ServiceAddon, "id" | "created_at">>;
      };
      availability: {
        Row: Availability;
        Insert: Omit<Availability, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Availability, "id" | "created_at" | "updated_at">>;
      };
      bookings: {
        Row: Booking;
        Insert: Omit<Booking, "id" | "ref_code" | "created_at" | "updated_at">;
        Update: Partial<
          Omit<Booking, "id" | "ref_code" | "created_at" | "updated_at">
        >;
      };
      booking_items: {
        Row: BookingItem;
        Insert: Omit<BookingItem, "id" | "created_at">;
        Update: Partial<Omit<BookingItem, "id" | "created_at">>;
      };
      payments: {
        Row: Payment;
        Insert: Omit<Payment, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Payment, "id" | "created_at" | "updated_at">>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
