-- Sample profiles data for testing role-based system
-- Run this in your Supabase SQL Editor

-- First, ensure the role column exists
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'player' 
CHECK (role IN ('admin', 'stadium_owner', 'player'));

-- Sample Admin User
INSERT INTO public.profiles (id, full_name, phone, role, position, skill_level, preferred_foot) VALUES
('11111111-1111-1111-1111-111111111111', 'Sarah Admin', '+212600000001', 'admin', null, null, null);

-- Sample Stadium Owners
INSERT INTO public.profiles (id, full_name, phone, role, position, skill_level, preferred_foot) VALUES
('22222222-2222-2222-2222-222222222222', 'Ahmed Stadium Owner', '+212600000002', 'stadium_owner', null, null, null),
('33333333-3333-3333-3333-333333333333', 'Fatima Stadium Manager', '+212600000003', 'stadium_owner', null, null, null),
('44444444-4444-4444-4444-444444444444', 'Hassan Sports Complex', '+212600000004', 'stadium_owner', null, null, null);

-- Sample Players
INSERT INTO public.profiles (id, full_name, phone, role, position, skill_level, preferred_foot) VALUES
('55555555-5555-5555-5555-555555555555', 'Youssef Player', '+212600000005', 'player', 'Forward', 'Advanced', 'Right'),
('66666666-6666-6666-6666-666666666666', 'Omar Midfielder', '+212600000006', 'player', 'Midfielder', 'Intermediate', 'Left'),
('77777777-7777-7777-7777-777777777777', 'Amine Defender', '+212600000007', 'player', 'Defender', 'Beginner', 'Right'),
('88888888-8888-8888-8888-888888888888', 'Karim Goalkeeper', '+212600000008', 'player', 'Goalkeeper', 'Advanced', 'Right'),
('99999999-9999-9999-9999-999999999999', 'Rachid Striker', '+212600000009', 'player', 'Forward', 'Intermediate', 'Left');

-- Sample stadiums for testing (owned by stadium owners)
INSERT INTO public.stadiums (id, owner_id, name, description, address, city, price_per_hour, capacity, has_parking, has_changing_rooms, has_lighting, has_showers, surface_type, photos, is_active, rating) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', 'Ahmed Football Center', 'Professional football stadium with modern facilities', '123 Sports Avenue', 'Casablanca', 150.00, 22, true, true, true, true, 'artificial_grass', '{"https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800"}', true, 4.5),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', 'Fatima Sports Complex', 'Multi-purpose sports facility with excellent amenities', '456 Athletic Road', 'Rabat', 120.00, 22, true, true, true, true, 'natural_grass', '{"https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800"}', true, 4.2),
('cccccccc-cccc-cccc-cccc-cccccccccccc', '44444444-4444-4444-4444-444444444444', 'Hassan Arena', 'Indoor football arena perfect for all weather', '789 Championship Street', 'Marrakech', 200.00, 18, true, true, true, true, 'artificial_grass', '{"https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=800"}', true, 4.8);

-- Sample bookings for testing booking management
INSERT INTO public.bookings (id, stadium_id, user_id, booking_date, start_time, end_time, total_price, status, payment_status, notes) VALUES
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '55555555-5555-5555-5555-555555555555', '2025-07-15', '16:00:00', '17:00:00', 150.00, 'pending', 'pending', 'Regular booking'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '66666666-6666-6666-6666-666666666666', '2025-07-16', '18:00:00', '19:00:00', 150.00, 'confirmed', 'paid', 'Team practice'),
('ffffffff-ffff-ffff-ffff-ffffffffffff', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '77777777-7777-7777-7777-777777777777', '2025-07-17', '14:00:00', '16:00:00', 240.00, 'pending', 'pending', 'Match booking'),
('gggggggg-gggg-gggg-gggg-gggggggggggg', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '88888888-8888-8888-8888-888888888888', '2025-07-18', '20:00:00', '21:00:00', 200.00, 'confirmed', 'paid', 'Evening session'),
('hhhhhhhh-hhhh-hhhh-hhhh-hhhhhhhhhhhh', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '99999999-9999-9999-9999-999999999999', '2025-07-19', '10:00:00', '11:00:00', 150.00, 'cancelled', 'refunded', 'Weather cancellation');

-- Update timestamps
UPDATE public.profiles SET created_at = NOW() - INTERVAL '30 days', updated_at = NOW();
UPDATE public.stadiums SET created_at = NOW() - INTERVAL '20 days', updated_at = NOW();
UPDATE public.bookings SET created_at = NOW() - INTERVAL '5 days', updated_at = NOW();