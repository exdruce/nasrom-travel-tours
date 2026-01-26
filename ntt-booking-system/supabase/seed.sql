-- Seed data for NTT Booking System
-- Run this after schema.sql to add test data

-- Insert test business (NASROM)
INSERT INTO public.businesses (id, owner_id, name, slug, description, is_published)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  (SELECT id FROM public.profiles LIMIT 1), -- Replace with actual owner ID
  'NASROM Travel & Tours',
  'nasrom',
  'Premium boat transfers from Tok Bali Jetty to Perhentian & Redang Islands',
  true
);

-- Insert sample services
INSERT INTO public.services (business_id, name, description, price, duration_minutes, max_capacity, is_active) VALUES
('00000000-0000-0000-0000-000000000001', 'Perhentian Day Trip', 'Full day trip to Perhentian Island with snorkeling', 150.00, 480, 28, true),
('00000000-0000-0000-0000-000000000001', 'Redang Leisure', '2D1N package to Redang Island', 220.00, 1440, 20, true),
('00000000-0000-0000-0000-000000000001', 'Sunset River Cruise', 'Scenic 2-hour cruise on Sungai Semerak', 80.00, 120, 15, true),
('00000000-0000-0000-0000-000000000001', 'Fishing Expedition', 'Private 8-hour deep sea fishing trip', 350.00, 480, 8, true);

-- Insert service variants (sample)
INSERT INTO public.service_variants (service_id, name, price, sort_order)
SELECT id, 'Adult', price, 1 FROM public.services WHERE name = 'Perhentian Day Trip';

INSERT INTO public.service_variants (service_id, name, price, sort_order)
SELECT id, 'Child (4-12)', 100.00, 2 FROM public.services WHERE name = 'Perhentian Day Trip';

-- Note: Run this manually and replace owner_id with your actual user ID
-- You can find your user ID in Supabase Dashboard > Authentication > Users
