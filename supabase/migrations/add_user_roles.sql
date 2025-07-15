-- Migration: Add user roles to profiles table
-- This script safely adds the role column without affecting existing policies

-- Add role column to profiles table if it doesn't exist
DO $$ 
BEGIN
    -- Check if role column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' 
        AND column_name = 'role' 
        AND table_schema = 'public'
    ) THEN
        -- Add role column with default value and constraint
        ALTER TABLE public.profiles 
        ADD COLUMN role TEXT DEFAULT 'player' 
        CHECK (role IN ('admin', 'stadium_owner', 'player'));
        
        -- Update existing users to have 'player' role if NULL
        UPDATE public.profiles 
        SET role = 'player' 
        WHERE role IS NULL;
        
        RAISE NOTICE 'Added role column to profiles table';
    ELSE
        RAISE NOTICE 'Role column already exists in profiles table';
    END IF;
END $$;

-- Create additional RLS policies for role-based access if they don't exist
DO $$
BEGIN
    -- Admin access policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Admins can manage all profiles'
    ) THEN
        CREATE POLICY "Admins can manage all profiles" ON public.profiles
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND role = 'admin'
            )
        );
        RAISE NOTICE 'Created admin access policy for profiles';
    END IF;

    -- Stadium owner booking access policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'bookings' 
        AND policyname = 'Stadium owners can manage bookings for their stadiums'
    ) THEN
        CREATE POLICY "Stadium owners can manage bookings for their stadiums" ON public.bookings
        FOR UPDATE USING (
            auth.uid() IN (
                SELECT owner_id FROM public.stadiums WHERE id = stadium_id
            )
        );
        RAISE NOTICE 'Created stadium owner booking policy';
    END IF;

    -- Admin full access to bookings
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'bookings' 
        AND policyname = 'Admins can manage all bookings'
    ) THEN
        CREATE POLICY "Admins can manage all bookings" ON public.bookings
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND role = 'admin'
            )
        );
        RAISE NOTICE 'Created admin booking access policy';
    END IF;

    -- Admin full access to stadiums
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'stadiums' 
        AND policyname = 'Admins can manage all stadiums'
    ) THEN
        CREATE POLICY "Admins can manage all stadiums" ON public.stadiums
        FOR ALL USING (
            EXISTS (
                SELECT 1 FROM public.profiles 
                WHERE id = auth.uid() AND role = 'admin'
            )
        );
        RAISE NOTICE 'Created admin stadium access policy';
    END IF;
END $$;

-- Create indexes for better performance on role-based queries
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_stadiums_owner_id ON public.stadiums(owner_id);
CREATE INDEX IF NOT EXISTS idx_bookings_stadium_id ON public.bookings(stadium_id);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);

-- Create function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role 
        FROM public.profiles 
        WHERE id = user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role = 'admin' 
        FROM public.profiles 
        WHERE id = user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to check if user is stadium owner
CREATE OR REPLACE FUNCTION public.is_stadium_owner(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT role = 'stadium_owner' 
        FROM public.profiles 
        WHERE id = user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;