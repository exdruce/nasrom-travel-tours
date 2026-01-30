-- Migration: Add Passengers, Business Settings, and Auto-Cancel Support
-- Run this in Supabase SQL Editor or as a migration

-- ============================================
-- PASSENGERS TABLE (Compliance - Form JL)
-- ============================================
CREATE TABLE public.passengers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,                    -- Uppercase for manifest
  ic_passport TEXT NOT NULL,                  -- Malaysian IC or passport number
  dob DATE,                                   -- Date of birth (calculated from IC)
  calculated_age INTEGER NOT NULL,            -- Age as of trip date (required by Jabatan Laut)
  gender TEXT NOT NULL CHECK (gender IN ('L', 'P')),  -- L=Lelaki, P=Perempuan
  nationality TEXT NOT NULL DEFAULT 'MALAYSIA',
  passenger_type TEXT NOT NULL DEFAULT 'adult' CHECK (passenger_type IN ('adult', 'child', 'infant')),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.passengers ENABLE ROW LEVEL SECURITY;

-- Passenger policies
CREATE POLICY "Users can view own booking passengers" ON public.passengers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE id = booking_id AND (customer_id = auth.uid() OR customer_email = auth.email())
    )
  );

CREATE POLICY "Owners can manage passengers" ON public.passengers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.businesses bus ON b.business_id = bus.id
      WHERE b.id = booking_id AND bus.owner_id = auth.uid()
    )
  );

-- Allow anonymous inserts for public booking flow
CREATE POLICY "Anyone can insert passengers" ON public.passengers
  FOR INSERT WITH CHECK (true);

-- ============================================
-- BUSINESS SETTINGS TABLE
-- ============================================
CREATE TABLE public.business_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL UNIQUE REFERENCES public.businesses(id) ON DELETE CASCADE,
  
  -- Payment Gateway Configuration
  payment_gateway TEXT NOT NULL DEFAULT 'bayarcash' CHECK (payment_gateway IN ('bayarcash', 'chip', 'stripe', 'senangpay', 'toyyibpay', 'manual')),
  payment_gateway_enabled BOOLEAN DEFAULT TRUE,
  
  -- Auto-Cancel Configuration
  auto_cancel_timeout INTEGER NOT NULL DEFAULT 30,  -- Minutes (15, 30, 60, 1440 for 24h)
  auto_cancel_enabled BOOLEAN DEFAULT TRUE,
  
  -- Notification Settings
  email_notifications BOOLEAN DEFAULT TRUE,
  whatsapp_notifications BOOLEAN DEFAULT FALSE,
  notification_phone TEXT,                    -- For WhatsApp notifications
  
  -- Boat/Vessel Information (for manifest)
  boat_name TEXT DEFAULT 'NASROM CABIN 01',
  boat_reg_no TEXT DEFAULT 'TRK 1234',
  default_destination TEXT DEFAULT 'JETI TOK BALI - PULAU PERHENTIAN',
  crew_count INTEGER DEFAULT 2,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

-- Settings policies
CREATE POLICY "Owners can view own settings" ON public.business_settings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND owner_id = auth.uid())
  );

CREATE POLICY "Owners can manage own settings" ON public.business_settings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.businesses WHERE id = business_id AND owner_id = auth.uid())
  );

-- ============================================
-- ADD expires_at TO BOOKINGS TABLE
-- ============================================
ALTER TABLE public.bookings 
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_passengers_booking ON public.passengers(booking_id);
CREATE INDEX idx_business_settings_business ON public.business_settings(business_id);
CREATE INDEX idx_bookings_expires_at ON public.bookings(expires_at) WHERE status = 'pending';

-- ============================================
-- FUNCTION: Auto-create settings when business is created
-- ============================================
CREATE OR REPLACE FUNCTION create_default_business_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.business_settings (business_id)
  VALUES (NEW.id)
  ON CONFLICT (business_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_create_business_settings
  AFTER INSERT ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION create_default_business_settings();

-- ============================================
-- FUNCTION: Cancel Expired Bookings
-- ============================================
CREATE OR REPLACE FUNCTION cancel_expired_bookings()
RETURNS INTEGER AS $$
DECLARE
  cancelled_count INTEGER;
BEGIN
  -- Update expired pending bookings to cancelled
  WITH expired_bookings AS (
    UPDATE public.bookings
    SET 
      status = 'cancelled',
      cancelled_at = NOW(),
      cancelled_reason = 'Auto-cancelled: Payment timeout'
    WHERE 
      status = 'pending' 
      AND expires_at IS NOT NULL 
      AND expires_at < NOW()
    RETURNING id, availability_id, pax
  ),
  -- Release capacity back to availability slots
  released_capacity AS (
    UPDATE public.availability a
    SET booked_count = GREATEST(0, a.booked_count - eb.pax)
    FROM expired_bookings eb
    WHERE a.id = eb.availability_id
  )
  SELECT COUNT(*) INTO cancelled_count FROM expired_bookings;
  
  RETURN cancelled_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- UPDATE updated_at TRIGGER FOR SETTINGS
-- ============================================
CREATE TRIGGER trigger_business_settings_updated_at 
  BEFORE UPDATE ON public.business_settings 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- CREATE SETTINGS FOR EXISTING BUSINESSES
-- ============================================
INSERT INTO public.business_settings (business_id)
SELECT id FROM public.businesses
ON CONFLICT (business_id) DO NOTHING;
