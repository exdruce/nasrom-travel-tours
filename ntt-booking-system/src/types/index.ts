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
        Insert: Partial<Profile> & Pick<Profile, "id" | "email">;
        Update: Partial<Profile>;
        Relationships: [];
      };
      businesses: {
        Row: Business;
        Insert: Partial<Business> &
          Pick<Business, "owner_id" | "name" | "slug">;
        Update: Partial<Business>;
        Relationships: [
          {
            foreignKeyName: "businesses_owner_id_fkey";
            columns: ["owner_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      services: {
        Row: Service;
        Insert: Partial<Service> &
          Pick<
            Service,
            | "business_id"
            | "name"
            | "price"
            | "duration_minutes"
            | "max_capacity"
          >;
        Update: Partial<Service>;
        Relationships: [
          {
            foreignKeyName: "services_business_id_fkey";
            columns: ["business_id"];
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
        ];
      };
      service_variants: {
        Row: ServiceVariant;
        Insert: Partial<ServiceVariant> &
          Pick<ServiceVariant, "service_id" | "name" | "price">;
        Update: Partial<ServiceVariant>;
        Relationships: [
          {
            foreignKeyName: "service_variants_service_id_fkey";
            columns: ["service_id"];
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
      service_addons: {
        Row: ServiceAddon;
        Insert: Partial<ServiceAddon> &
          Pick<ServiceAddon, "service_id" | "name" | "price">;
        Update: Partial<ServiceAddon>;
        Relationships: [
          {
            foreignKeyName: "service_addons_service_id_fkey";
            columns: ["service_id"];
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
      availability: {
        Row: Availability;
        Insert: Partial<Availability> &
          Pick<
            Availability,
            "business_id" | "date" | "start_time" | "end_time" | "capacity"
          >;
        Update: Partial<Availability>;
        Relationships: [
          {
            foreignKeyName: "availability_business_id_fkey";
            columns: ["business_id"];
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "availability_service_id_fkey";
            columns: ["service_id"];
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
      bookings: {
        Row: Booking;
        Insert: Partial<Booking> &
          Pick<
            Booking,
            | "business_id"
            | "service_id"
            | "customer_name"
            | "customer_email"
            | "booking_date"
            | "start_time"
            | "pax"
            | "subtotal"
            | "total_amount"
          >;
        Update: Partial<Booking>;
        Relationships: [
          {
            foreignKeyName: "bookings_business_id_fkey";
            columns: ["business_id"];
            referencedRelation: "businesses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_service_id_fkey";
            columns: ["service_id"];
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_customer_id_fkey";
            columns: ["customer_id"];
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_availability_id_fkey";
            columns: ["availability_id"];
            referencedRelation: "availability";
            referencedColumns: ["id"];
          },
        ];
      };
      booking_items: {
        Row: BookingItem;
        Insert: Partial<BookingItem> &
          Pick<
            BookingItem,
            | "booking_id"
            | "type"
            | "item_id"
            | "name"
            | "quantity"
            | "unit_price"
            | "total_price"
          >;
        Update: Partial<BookingItem>;
        Relationships: [
          {
            foreignKeyName: "booking_items_booking_id_fkey";
            columns: ["booking_id"];
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: Payment;
        Insert: Partial<Payment> & Pick<Payment, "booking_id" | "amount">;
        Update: Partial<Payment>;
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey";
            columns: ["booking_id"];
            referencedRelation: "bookings";
            referencedColumns: ["id"];
          },
        ];
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
