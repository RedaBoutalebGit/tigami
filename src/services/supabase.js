import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://kbnhodacgjrwsimoaqcr.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtibmhvZGFjZ2pyd3NpbW9hcWNyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI0MTA2NDAsImV4cCI6MjA2Nzk4NjY0MH0.8jXLRLnMa0O49qhtlM4io2Jlcn2niaErvqroxD1E-Uk';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);