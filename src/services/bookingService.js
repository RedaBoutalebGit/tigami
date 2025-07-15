import { supabase } from './supabase';
import { notificationService } from './notificationService';

export const bookingService = {
  // Confirm a booking (Admin only)
  async confirmBooking(bookingId) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({ 
          status: 'confirmed',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .select(`
          *,
          stadiums!inner(owner_id)
        `)
        .single();

      if (error) throw error;

      // Send booking confirmation notification
      await notificationService.sendBookingNotification(bookingId, 'booking_confirmed');

      // Get user profile separately
      if (data && data.user_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', data.user_id)
          .single();

        return { 
          success: true, 
          booking: { 
            ...data, 
            profiles: profile || { full_name: 'Unknown User', email: '' }
          }
        };
      }

      return { success: true, booking: data };
    } catch (error) {
      console.error('Error confirming booking:', error);
      return { success: false, error: error.message };
    }
  },

  // Cancel a booking (Admin only)
  async cancelBooking(bookingId, reason = null) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({ 
          status: 'cancelled',
          notes: reason ? `Cancelled by admin: ${reason}` : 'Cancelled by admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .select(`
          *,
          stadiums!inner(owner_id)
        `)
        .single();

      if (error) throw error;

      // Send booking cancellation notification
      await notificationService.sendBookingNotification(bookingId, 'booking_cancelled', {
        cancelledBy: 'owner',
        reason
      });

      // Get user profile separately
      if (data && data.user_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', data.user_id)
          .single();

        return { 
          success: true, 
          booking: { 
            ...data, 
            profiles: profile || { full_name: 'Unknown User', email: '' }
          }
        };
      }

      return { success: true, booking: data };
    } catch (error) {
      console.error('Error cancelling booking:', error);
      return { success: false, error: error.message };
    }
  },

  // Get all bookings for stadium owner
  async getOwnerBookings(ownerId, filters = {}) {
    try {
      let query = supabase
        .from('bookings')
        .select(`
          *,
          stadiums!inner(
            id,
            name,
            city,
            owner_id,
            photos
          )
        `)
        .eq('stadiums.owner_id', ownerId);

      // Apply filters
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.stadium_id) {
        query = query.eq('stadium_id', filters.stadium_id);
      }
      if (filters.date_from) {
        query = query.gte('booking_date', filters.date_from);
      }
      if (filters.date_to) {
        query = query.lte('booking_date', filters.date_to);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get user profiles separately for the bookings
      if (data && data.length > 0) {
        const userIds = data.map(booking => booking.user_id);
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, email, phone')
          .in('id', userIds);

        if (!profilesError && profiles) {
          // Merge profile data with bookings
          const bookingsWithProfiles = data.map(booking => {
            const profile = profiles.find(p => p.id === booking.user_id);
            return {
              ...booking,
              profiles: profile || { full_name: 'Unknown User', email: '', phone: '' }
            };
          });
          return { success: true, bookings: bookingsWithProfiles };
        }
      }

      return { success: true, bookings: data || [] };
    } catch (error) {
      console.error('Error fetching owner bookings:', error);
      return { success: false, error: error.message };
    }
  },

  // Get booking statistics for owner
  async getOwnerBookingStats(ownerId) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          status,
          total_price,
          stadiums!inner(owner_id)
        `)
        .eq('stadiums.owner_id', ownerId);

      if (error) throw error;

      const stats = {
        total: data.length,
        pending: data.filter(b => b.status === 'pending').length,
        confirmed: data.filter(b => b.status === 'confirmed').length,
        cancelled: data.filter(b => b.status === 'cancelled').length,
        totalRevenue: data
          .filter(b => b.status === 'confirmed')
          .reduce((sum, b) => sum + b.total_price, 0),
        pendingRevenue: data
          .filter(b => b.status === 'pending')
          .reduce((sum, b) => sum + b.total_price, 0)
      };

      return { success: true, stats };
    } catch (error) {
      console.error('Error fetching booking stats:', error);
      return { success: false, error: error.message };
    }
  },

  // Check if user owns the stadium for this booking
  async verifyOwnership(bookingId, userId) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          stadiums!inner(owner_id)
        `)
        .eq('id', bookingId)
        .single();

      if (error) throw error;
      return data?.stadiums?.owner_id === userId;
    } catch (error) {
      console.error('Error verifying ownership:', error);
      return false;
    }
  },

  // Update booking notes (Admin only)
  async updateBookingNotes(bookingId, notes) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({ 
          notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, booking: data };
    } catch (error) {
      console.error('Error updating booking notes:', error);
      return { success: false, error: error.message };
    }
  },

  // Get booking details with all related data
  async getBookingDetails(bookingId) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          stadiums(
            name,
            city,
            photos,
            owner_id,
            price_per_hour
          )
        `)
        .eq('id', bookingId)
        .single();

      if (error) throw error;

      // Get user profile separately
      if (data && data.user_id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, email, phone')
          .eq('id', data.user_id)
          .single();

        return { 
          success: true, 
          booking: { 
            ...data, 
            profiles: profile || { full_name: 'Unknown User', email: '', phone: '' }
          }
        };
      }

      return { success: true, booking: data };
    } catch (error) {
      console.error('Error fetching booking details:', error);
      return { success: false, error: error.message };
    }
  }
};