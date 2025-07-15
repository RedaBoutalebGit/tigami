-- Create helper functions to avoid RLS policy recursion
-- Run this in your Supabase SQL Editor

-- Function to get user profile safely
CREATE OR REPLACE FUNCTION public.get_user_profile(user_id UUID)
RETURNS TABLE(
  id UUID,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  position TEXT,
  skill_level TEXT,
  preferred_foot TEXT,
  role TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.phone,
    p.avatar_url,
    p.position,
    p.skill_level,
    p.preferred_foot,
    COALESCE(p.role, 'player') as role,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to safely update user role
CREATE OR REPLACE FUNCTION public.update_user_role(user_id UUID, new_role TEXT)
RETURNS TABLE(
  id UUID,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  position TEXT,
  skill_level TEXT,
  preferred_foot TEXT,
  role TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate role
  IF new_role NOT IN ('admin', 'stadium_owner', 'player') THEN
    RAISE EXCEPTION 'Invalid role: %', new_role;
  END IF;
  
  -- Update the role
  UPDATE public.profiles 
  SET role = new_role, updated_at = NOW()
  WHERE profiles.id = user_id;
  
  -- Return updated profile
  RETURN QUERY
  SELECT 
    p.id,
    p.full_name,
    p.phone,
    p.avatar_url,
    p.position,
    p.skill_level,
    p.preferred_foot,
    p.role,
    p.created_at,
    p.updated_at
  FROM public.profiles p
  WHERE p.id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Add role column if it doesn't exist
DO $$ 
BEGIN
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
END $$;

-- Update your specific user to be a stadium owner
UPDATE public.profiles 
SET role = 'stadium_owner' 
WHERE id = '60ce42af-317d-44fd-a2b8-110d6283ff0c';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_user_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_role(UUID, TEXT) TO authenticated;