import { supabase } from '../services/supabase';

// Test utility functions for role-based system testing

export const TestHelpers = {
  // Create test users with specific roles
  async createTestUser(email, password, fullName, role = 'player') {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;

      // Set the role in profiles table
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert([
            {
              id: data.user.id,
              full_name: fullName,
              role: role,
            },
          ]);

        if (profileError) {
          console.error('Error setting user role:', profileError);
        }
      }

      return { success: true, user: data.user };
    } catch (error) {
      console.error('Error creating test user:', error);
      return { success: false, error: error.message };
    }
  },

  // Change user role (admin function)
  async changeUserRole(userId, newRole) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error changing user role:', error);
      return { success: false, error: error.message };
    }
  },

  // Create test stadium
  async createTestStadium(ownerId, stadiumData = {}) {
    const defaultStadium = {
      owner_id: ownerId,
      name: 'Test Stadium',
      description: 'A test stadium for testing purposes',
      address: '123 Test Street',
      city: 'Test City',
      price_per_hour: 100,
      capacity: 22,
      has_parking: true,
      has_changing_rooms: true,
      has_lighting: true,
      has_showers: true,
      surface_type: 'artificial_grass',
      photos: ['https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800'],
      is_active: true,
      ...stadiumData
    };

    try {
      const { data, error } = await supabase
        .from('stadiums')
        .insert([defaultStadium])
        .select()
        .single();

      if (error) throw error;
      return { success: true, stadium: data };
    } catch (error) {
      console.error('Error creating test stadium:', error);
      return { success: false, error: error.message };
    }
  },

  // Create test booking
  async createTestBooking(stadiumId, userId, bookingData = {}) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const defaultBooking = {
      stadium_id: stadiumId,
      user_id: userId,
      booking_date: tomorrow.toISOString().split('T')[0],
      start_time: '16:00:00',
      end_time: '17:00:00',
      total_price: 100,
      status: 'pending',
      payment_status: 'pending',
      ...bookingData
    };

    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert([defaultBooking])
        .select(`
          *,
          stadiums(name, city),
          profiles(full_name)
        `)
        .single();

      if (error) throw error;
      return { success: true, booking: data };
    } catch (error) {
      console.error('Error creating test booking:', error);
      return { success: false, error: error.message };
    }
  },

  // Get user profile by email
  async getUserByEmail(email) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();

      if (error) throw error;
      return { success: true, user: data };
    } catch (error) {
      console.error('Error getting user by email:', error);
      return { success: false, error: error.message };
    }
  },

  // Clean up test data
  async cleanupTestData() {
    try {
      // Delete test bookings
      await supabase
        .from('bookings')
        .delete()
        .like('notes', '%test%');

      // Delete test stadiums
      await supabase
        .from('stadiums')
        .delete()
        .like('name', '%Test%');

      // Note: Be careful with deleting profiles as it affects auth users
      console.log('Test data cleanup completed');
      return { success: true };
    } catch (error) {
      console.error('Error cleaning up test data:', error);
      return { success: false, error: error.message };
    }
  },

  // Setup complete test scenario
  async setupTestScenario() {
    try {
      console.log('Setting up test scenario...');

      // Create test player
      const playerResult = await this.createTestUser(
        'testplayer@tigami.com',
        'test123456',
        'Test Player',
        'player'
      );

      // Create test stadium owner
      const ownerResult = await this.createTestUser(
        'testowner@tigami.com',
        'test123456',
        'Test Stadium Owner',
        'stadium_owner'
      );

      // Create test admin
      const adminResult = await this.createTestUser(
        'testadmin@tigami.com',
        'test123456',
        'Test Admin',
        'admin'
      );

      if (!playerResult.success || !ownerResult.success || !adminResult.success) {
        throw new Error('Failed to create test users');
      }

      // Create test stadium
      const stadiumResult = await this.createTestStadium(ownerResult.user.id);

      if (!stadiumResult.success) {
        throw new Error('Failed to create test stadium');
      }

      // Create test booking
      const bookingResult = await this.createTestBooking(
        stadiumResult.stadium.id,
        playerResult.user.id
      );

      if (!bookingResult.success) {
        throw new Error('Failed to create test booking');
      }

      console.log('✅ Test scenario setup complete!');
      console.log('Test accounts created:');
      console.log('- Player: testplayer@tigami.com / test123456');
      console.log('- Owner: testowner@tigami.com / test123456');
      console.log('- Admin: testadmin@tigami.com / test123456');

      return {
        success: true,
        data: {
          player: playerResult.user,
          owner: ownerResult.user,
          admin: adminResult.user,
          stadium: stadiumResult.stadium,
          booking: bookingResult.booking
        }
      };
    } catch (error) {
      console.error('Error setting up test scenario:', error);
      return { success: false, error: error.message };
    }
  }
};

// Test credentials for easy access
export const TestCredentials = {
  player: {
    email: 'testplayer@tigami.com',
    password: 'test123456',
    role: 'player'
  },
  stadiumOwner: {
    email: 'testowner@tigami.com',
    password: 'test123456',
    role: 'stadium_owner'
  },
  admin: {
    email: 'testadmin@tigami.com',
    password: 'test123456',
    role: 'admin'
  }
};

export default TestHelpers;