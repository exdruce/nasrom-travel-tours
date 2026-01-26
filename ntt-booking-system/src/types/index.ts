// Database Types
// These will be generated from Supabase schema in Phase 1

export interface User {
  id: string;
  email: string;
  full_name?: string;
  phone?: string;
  role: "admin" | "owner" | "staff" | "customer";
  created_at: string;
  updated_at: string;
}

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  branding?: {
    primary_color?: string;
    secondary_color?: string;
  };
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  price: number;
  duration_minutes: number;
  max_capacity: number;
  images?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Availability {
  id: string;
  business_id: string;
  service_id?: string;
  date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  is_blocked: boolean;
}

export interface Booking {
  id: string;
  ref_code: string;
  service_id: string;
  customer_id: string;
  booking_date: string;
  start_time: string;
  pax: number;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  total_amount: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  stripe_payment_id?: string;
  amount: number;
  status: "pending" | "succeeded" | "failed" | "refunded";
  method: "card" | "fpx";
  created_at: string;
}
