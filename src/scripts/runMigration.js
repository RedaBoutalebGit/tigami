const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = 'https://kbnhodacgjrwsimoaqcr.supabase.co';
const supabaseServiceKey = 'your-service-role-key-here'; // You need to replace this with your actual service role key

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('Starting migration: Add user roles...');
    
    // Read the migration SQL file
    const migrationPath = path.join(__dirname, '../../supabase/migrations/add_user_roles.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });
    
    if (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    }
    
    console.log('Migration completed successfully!');
    console.log('✅ Role column added to profiles table');
    console.log('✅ Role-based access policies created');
    console.log('✅ Performance indexes added');
    console.log('✅ Helper functions created');
    
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
}

// Alternative manual execution function
async function manualMigration() {
  try {
    console.log('Running manual migration steps...');
    
    // Step 1: Add role column
    console.log('1. Adding role column...');
    const { error: alterError } = await supabase
      .from('profiles')
      .select('role')
      .limit(1);
    
    if (alterError && alterError.code === '42703') {
      // Column doesn't exist, add it manually via raw SQL
      const { error } = await supabase.rpc('exec', {
        sql: `
          ALTER TABLE public.profiles 
          ADD COLUMN role TEXT DEFAULT 'player' 
          CHECK (role IN ('admin', 'stadium_owner', 'player'));
        `
      });
      
      if (error) {
        console.error('Failed to add role column:', error);
      } else {
        console.log('✅ Role column added successfully');
      }
    } else {
      console.log('✅ Role column already exists');
    }
    
    // Step 2: Update existing users
    console.log('2. Updating existing users...');
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'player' })
      .is('role', null);
    
    if (updateError) {
      console.error('Failed to update existing users:', updateError);
    } else {
      console.log('✅ Existing users updated');
    }
    
    console.log('Manual migration completed!');
    
  } catch (error) {
    console.error('Manual migration failed:', error);
  }
}

// Instructions for manual execution
console.log(`
=== MIGRATION INSTRUCTIONS ===

The database already has existing policies. To add user roles safely:

OPTION 1: Run this command in your Supabase SQL Editor:
---------------------------------------------------------

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
        
        UPDATE public.profiles 
        SET role = 'player' 
        WHERE role IS NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

---------------------------------------------------------

OPTION 2: Use Supabase Dashboard
1. Go to Table Editor > profiles
2. Add new column: 'role' (text, default: 'player')
3. Add constraint: CHECK (role IN ('admin', 'stadium_owner', 'player'))

The app will work correctly once the role column is added!
`);

// Uncomment the line below if you want to run the manual migration
// manualMigration();