-- NTT Booking System Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS TABLE (extends Supabase auth.users)
-- ============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'customer' CHECK (role IN ('admin', 'owner', 'staff', 'customer')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- BUSINESSES TABLE (Tenants)
-- ============================================
CREATE TABLE public.businesses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  logo_url TEXT,
  banner_url TEXT,
  branding JSONB DEFAULT '{"primary_color": "#168D95", "secondary_color": "#DE7F21"}',
  contact_phone TEXT,
  contact_email TEXT,
  address TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;

-- Business policies
CREATE POLICY "Public can view published businesses" ON public.businesses
  FOR SELECT USING (is_published = TRUE);

CREATE POLICY "Owners can manage their businesses" ON public.businesses
  FOR ALL USING (auth.uid() = owner_id);

-- ============================================
-- SERVICES TABLE
-- ============================================
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  max_capacity INTEGER NOT NULL DEFAULT 1,
  images TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Service policies
CREATE POLICY "Public can view active services" ON public.services
  FOR SELECT USING (
    is_active = TRUE AND 
    EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND is_published = TRUE)
  );

CREATE POLICY "Owners can manage services" ON public.services
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND owner_id = auth.uid())
  );

-- ============================================
-- SERVICE VARIANTS TABLE (Adult/Child/Senior pricing)
-- ============================================
CREATE TABLE public.service_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.service_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view variants" ON public.service_variants
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.services WHERE id = service_id AND is_active = TRUE)
  );

CREATE POLICY "Owners can manage variants" ON public.service_variants
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.services s 
      JOIN public.businesses b ON s.business_id = b.id 
      WHERE s.id = service_id AND b.owner_id = auth.uid()
    )
  );

-- ============================================
-- SERVICE ADDONS TABLE
-- ============================================
CREATE TABLE public.service_addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.service_addons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view active addons" ON public.service_addons
  FOR SELECT USING (
    is_active = TRUE AND
    EXISTS (SELECT 1 FROM public.services WHERE id = service_id AND is_active = TRUE)
  );

CREATE POLICY "Owners can manage addons" ON public.service_addons
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.services s 
      JOIN public.businesses b ON s.business_id = b.id 
      WHERE s.id = service_id AND b.owner_id = auth.uid()
    )
  );

-- ============================================
-- AVAILABILITY TABLE
-- ============================================
CREATE TABLE public.availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 1,
  booked_count INTEGER NOT NULL DEFAULT 0,
  is_blocked BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(business_id, service_id, date, start_time)
);

ALTER TABLE public.availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view availability" ON public.availability
  FOR SELECT USING (
    is_blocked = FALSE AND
    EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND is_published = TRUE)
  );

CREATE POLICY "Owners can manage availability" ON public.availability
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND owner_id = auth.uid())
  );

-- ============================================
-- BOOKINGS TABLE
-- ============================================
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ref_code TEXT UNIQUE NOT NULL,
  business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  availability_id UUID REFERENCES public.availability(id) ON DELETE SET NULL,
  
  -- Customer info (for non-logged-in customers)
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  
  -- Booking details
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  pax INTEGER NOT NULL DEFAULT 1,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed', 'no_show')),
  
  -- Pricing
  subtotal DECIMAL(10,2) NOT NULL,
  addons_total DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  
  -- Metadata
  notes TEXT,
  internal_notes TEXT,
  cancelled_at TIMESTAMPTZ,
  cancelled_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers can view own bookings" ON public.bookings
  FOR SELECT USING (customer_id = auth.uid() OR customer_email = auth.email());

CREATE POLICY "Owners can manage bookings" ON public.bookings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND owner_id = auth.uid())
  );

-- ============================================
-- BOOKING ITEMS TABLE (line items)
-- ============================================
CREATE TABLE public.booking_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('variant', 'addon')),
  item_id UUID NOT NULL,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.booking_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own booking items" ON public.booking_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE id = booking_id AND (customer_id = auth.uid() OR customer_email = auth.email())
    )
  );

CREATE POLICY "Owners can manage booking items" ON public.booking_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.businesses bus ON b.business_id = bus.id
      WHERE b.id = booking_id AND bus.owner_id = auth.uid()
    )
  );

-- ============================================
-- PAYMENTS TABLE
-- ============================================
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  stripe_payment_id TEXT,
  stripe_session_id TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'MYR',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'refunded')),
  method TEXT CHECK (method IN ('card', 'fpx', 'grabpay', 'other')),
  refund_amount DECIMAL(10,2),
  refund_reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE id = booking_id AND (customer_id = auth.uid() OR customer_email = auth.email())
    )
  );

CREATE POLICY "Owners can manage payments" ON public.payments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.businesses bus ON b.business_id = bus.id
      WHERE b.id = booking_id AND bus.owner_id = auth.uid()
    )
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to generate booking reference code
CREATE OR REPLACE FUNCTION generate_ref_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate ref_code
CREATE OR REPLACE FUNCTION set_booking_ref_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.ref_code IS NULL THEN
    NEW.ref_code := generate_ref_code();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_booking_ref_code
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION set_booking_ref_code();

-- Function to update booked_count on availability
CREATE OR REPLACE FUNCTION update_availability_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status IN ('pending', 'confirmed') THEN
    UPDATE public.availability 
    SET booked_count = booked_count + NEW.pax
    WHERE id = NEW.availability_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.status IN ('pending', 'confirmed') AND NEW.status IN ('cancelled', 'no_show') THEN
      UPDATE public.availability 
      SET booked_count = booked_count - OLD.pax
      WHERE id = OLD.availability_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_availability_count
  AFTER INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_availability_count();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all tables
CREATE TRIGGER trigger_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_businesses_updated_at BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_availability_updated_at BEFORE UPDATE ON public.availability FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_bookings_updated_at BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trigger_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- HANDLE NEW USER SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_businesses_slug ON public.businesses(slug);
CREATE INDEX idx_businesses_owner ON public.businesses(owner_id);
CREATE INDEX idx_services_business ON public.services(business_id);
CREATE INDEX idx_availability_business_date ON public.availability(business_id, date);
CREATE INDEX idx_availability_service_date ON public.availability(service_id, date);
CREATE INDEX idx_bookings_business ON public.bookings(business_id);
CREATE INDEX idx_bookings_customer ON public.bookings(customer_id);
CREATE INDEX idx_bookings_date ON public.bookings(booking_date);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_bookings_ref ON public.bookings(ref_code);
CREATE INDEX idx_payments_booking ON public.payments(booking_id);
CREATE INDEX idx_payments_stripe ON public.payments(stripe_payment_id);
