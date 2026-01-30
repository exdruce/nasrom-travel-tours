-- Migration: Add Bayarcash support to payments table
-- Run this in your Supabase SQL Editor

-- Add new columns for Bayarcash support (if they don't exist)
DO $$ 
BEGIN
  -- Add payment_gateway column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'payment_gateway') 
  THEN
    ALTER TABLE public.payments ADD COLUMN payment_gateway TEXT DEFAULT 'bayarcash';
  END IF;

  -- Add gateway_payment_id (replaces stripe_payment_id)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'gateway_payment_id') 
  THEN
    ALTER TABLE public.payments ADD COLUMN gateway_payment_id TEXT;
  END IF;

  -- Add gateway_session_id (replaces stripe_session_id)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'gateway_session_id') 
  THEN
    ALTER TABLE public.payments ADD COLUMN gateway_session_id TEXT;
  END IF;

  -- Add exchange_ref_number (for FPX transactions)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'exchange_ref_number') 
  THEN
    ALTER TABLE public.payments ADD COLUMN exchange_ref_number TEXT;
  END IF;

  -- Add payer_bank_code
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'payments' AND column_name = 'payer_bank_code') 
  THEN
    ALTER TABLE public.payments ADD COLUMN payer_bank_code TEXT;
  END IF;
END $$;

-- Update method constraint to support more payment types
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_method_check;
ALTER TABLE public.payments 
  ADD CONSTRAINT payments_method_check 
  CHECK (method IN (
    'card', 'fpx', 'grabpay', 'other',
    'duitnow_qr', 'duitnow_dobw', 'touch_n_go', 
    'boost_wallet', 'shopee_pay', 'credit_card'
  ));

-- Migrate existing stripe_* columns data to gateway_* columns (optional)
UPDATE public.payments 
SET 
  gateway_payment_id = stripe_payment_id,
  gateway_session_id = stripe_session_id,
  payment_gateway = 'stripe'
WHERE stripe_payment_id IS NOT NULL OR stripe_session_id IS NOT NULL;

-- Create index for gateway lookups
CREATE INDEX IF NOT EXISTS idx_payments_gateway ON public.payments(gateway_payment_id);
CREATE INDEX IF NOT EXISTS idx_payments_exchange_ref ON public.payments(exchange_ref_number);

-- Allow anonymous users to insert payments (for public booking flow)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'payments' 
    AND policyname = 'Allow anonymous payment insert'
  ) THEN
    CREATE POLICY "Allow anonymous payment insert" ON public.payments
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;
