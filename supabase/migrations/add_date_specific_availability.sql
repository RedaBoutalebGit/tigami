-- Add date_specific_availability column to stadiums table
ALTER TABLE public.stadiums 
ADD COLUMN IF NOT EXISTS date_specific_availability JSONB;

-- Add comment to document the column structure
COMMENT ON COLUMN public.stadiums.date_specific_availability IS 
'Stores date-specific availability overrides. Format: {"YYYY-MM-DD": {"available": ["HH:MM", ...], "unavailable": ["HH:MM", ...]}}';

-- Create an index for better performance when querying date-specific availability
CREATE INDEX IF NOT EXISTS idx_stadiums_date_specific_availability 
ON public.stadiums USING gin (date_specific_availability);