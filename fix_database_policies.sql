-- Fix infinite recursion in RLS policies
-- Run this in your Supabase SQL Editor

-- First, drop problematic policies that might cause infinite recursion
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can manage all stadiums" ON public.stadiums;

-- Recreate policies without self-reference issues
-- Simple admin access using direct role check
CREATE POLICY "Admins can view all profiles" ON public.profiles
FOR SELECT USING (
    auth.uid() IN (
        SELECT id FROM public.profiles WHERE role = 'admin'
    ) OR 
    auth.uid() = id
);

CREATE POLICY "Admins can update all profiles" ON public.profiles
FOR UPDATE USING (
    auth.uid() IN (
        SELECT id FROM public.profiles WHERE role = 'admin'
    ) OR 
    auth.uid() = id
);

-- Stadium owner booking management
CREATE POLICY "Stadium owners can update bookings for their stadiums" ON public.bookings
FOR UPDATE USING (
    auth.uid() IN (
        SELECT owner_id FROM public.stadiums WHERE id = stadium_id
    ) OR
    auth.uid() = user_id OR
    auth.uid() IN (
        SELECT id FROM public.profiles WHERE role = 'admin'
    )
);

-- Admin stadium management  
CREATE POLICY "Admins can update all stadiums" ON public.stadiums
FOR UPDATE USING (
    auth.uid() = owner_id OR
    auth.uid() IN (
        SELECT id FROM public.profiles WHERE role = 'admin'
    )
);

-- Create a simpler approach: Add role column first, then update existing user
DO $$ 
BEGIN
    -- Add role column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'role' 
        AND table_schema = 'public'
    ) THEN
        ALTER TABLE public.profiles 
        ADD COLUMN role TEXT DEFAULT 'player' 
        CHECK (role IN ('admin', 'stadium_owner', 'player'));
    END IF;
    
    -- Update the current user to be admin if no role exists
    UPDATE public.profiles 
    SET role = 'stadium_owner' 
    WHERE id = '60ce42af-317d-44fd-a2b8-110d6283ff0c' 
    AND (role IS NULL OR role = 'player');
    
END $$;