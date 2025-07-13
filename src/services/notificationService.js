import { supabase } from './supabase';
import { Alert } from 'react-native';

// Fallback notification service that works without expo-notifications
// To enable push notifications, install: npm install expo-notifications expo-device

export const notificationService = {
  /**
   * Initialize notification system (fallback version)
   */
  async initialize() {
    try {
      console.log('Notification service initialized (fallback mode)');
      // Return success without actual push notification setup
      return { success: true, token: 'fallback-token' };
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Store notification in database
   */
  async storeNotification(userId, type, title, body, data = {}) {
    try {
      const { data: notification, error } = await supabase
        .from('notifications')
        .insert([
          {
            user_id: userId,
            type,
            title,
            body,
            data,
            read: false,
            created_at: new Date().toISOString(),
          }
        ])
        .select()
        .single();

      if (error) throw error;
      return { success: true, notification };
    } catch (error) {
      console.error('Error storing notification:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Send local notification (fallback version)
   */
  async sendLocalNotification(title, body, data = {}) {
    try {
      // Fallback: Show alert instead of push notification
      console.log('Notification:', { title, body, data });
      // Could show an Alert here if needed for debugging
      // Alert.alert(title, body);
      return { success: true };
    } catch (error) {
      console.error('Error sending local notification:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Booking-related notifications
   */
  async sendBookingNotification(bookingId, type, customData = {}) {
    try {
      // Fetch booking details with user and stadium info
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select(`
          *,
          stadiums (name, owner_id),
          profiles!bookings_user_id_fkey (full_name)
        `)
        .eq('id', bookingId)
        .single();

      if (bookingError) throw bookingError;

      // Get stadium owner profile
      const { data: ownerProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', booking.stadiums.owner_id)
        .single();

      const customerName = booking.profiles?.full_name || 'A customer';
      const stadiumName = booking.stadiums?.name || 'your stadium';
      const ownerName = ownerProfile?.full_name || 'Stadium Owner';
      const bookingDate = new Date(booking.booking_date).toLocaleDateString();
      const bookingTime = booking.start_time?.slice(0, 5);

      let notifications = [];

      switch (type) {
        case 'booking_created':
          // Notify stadium owner
          notifications.push({
            userId: booking.stadiums.owner_id,
            title: 'New Booking Request! 🏟️',
            body: `${customerName} wants to book ${stadiumName} on ${bookingDate} at ${bookingTime}`,
            data: {
              type: 'booking_created',
              bookingId: booking.id,
              stadiumId: booking.stadium_id,
              customerId: booking.user_id,
              ...customData
            }
          });

          // Notify customer (confirmation)
          notifications.push({
            userId: booking.user_id,
            title: 'Booking Request Sent! ⚽',
            body: `Your booking request for ${stadiumName} on ${bookingDate} at ${bookingTime} has been sent to ${ownerName}`,
            data: {
              type: 'booking_confirmation',
              bookingId: booking.id,
              stadiumId: booking.stadium_id,
              ...customData
            }
          });
          break;

        case 'booking_confirmed':
          // Notify customer
          notifications.push({
            userId: booking.user_id,
            title: 'Booking Confirmed! ✅',
            body: `Your booking for ${stadiumName} on ${bookingDate} at ${bookingTime} has been confirmed by ${ownerName}`,
            data: {
              type: 'booking_confirmed',
              bookingId: booking.id,
              stadiumId: booking.stadium_id,
              ...customData
            }
          });
          break;

        case 'booking_cancelled':
          const cancelledBy = customData.cancelledBy || 'system';
          
          if (cancelledBy === 'owner') {
            // Notify customer about owner cancellation
            notifications.push({
              userId: booking.user_id,
              title: 'Booking Cancelled ❌',
              body: `Your booking for ${stadiumName} on ${bookingDate} at ${bookingTime} was cancelled by ${ownerName}`,
              data: {
                type: 'booking_cancelled_by_owner',
                bookingId: booking.id,
                stadiumId: booking.stadium_id,
                reason: customData.reason,
                ...customData
              }
            });
          } else if (cancelledBy === 'customer') {
            // Notify owner about customer cancellation
            notifications.push({
              userId: booking.stadiums.owner_id,
              title: 'Booking Cancelled 📅',
              body: `${customerName} cancelled their booking for ${stadiumName} on ${bookingDate} at ${bookingTime}`,
              data: {
                type: 'booking_cancelled_by_customer',
                bookingId: booking.id,
                stadiumId: booking.stadium_id,
                ...customData
              }
            });
          }
          break;

        case 'booking_reminder':
          // Notify customer about upcoming booking
          notifications.push({
            userId: booking.user_id,
            title: 'Upcoming Booking Reminder! ⏰',
            body: `Don't forget! You have a booking at ${stadiumName} tomorrow at ${bookingTime}`,
            data: {
              type: 'booking_reminder',
              bookingId: booking.id,
              stadiumId: booking.stadium_id,
              ...customData
            }
          });
          break;

        case 'payment_received':
          // Notify stadium owner about payment
          notifications.push({
            userId: booking.stadiums.owner_id,
            title: 'Payment Received! 💰',
            body: `Payment of ${booking.total_price} MAD received for booking at ${stadiumName} on ${bookingDate}`,
            data: {
              type: 'payment_received',
              bookingId: booking.id,
              stadiumId: booking.stadium_id,
              amount: booking.total_price,
              ...customData
            }
          });
          break;

        case 'booking_review':
          // Notify stadium owner about new review
          notifications.push({
            userId: booking.stadiums.owner_id,
            title: 'New Review! ⭐',
            body: `${customerName} left a review for ${stadiumName}`,
            data: {
              type: 'booking_review',
              bookingId: booking.id,
              stadiumId: booking.stadium_id,
              reviewId: customData.reviewId,
              rating: customData.rating,
              ...customData
            }
          });
          break;
      }

      // Send all notifications
      const results = [];
      for (const notification of notifications) {
        // Store in database
        const storeResult = await this.storeNotification(
          notification.userId,
          notification.data.type,
          notification.title,
          notification.body,
          notification.data
        );

        // Send local notification
        const localResult = await this.sendLocalNotification(
          notification.title,
          notification.body,
          notification.data
        );

        results.push({
          userId: notification.userId,
          stored: storeResult.success,
          sent: localResult.success,
        });
      }

      return { success: true, results };
    } catch (error) {
      console.error('Error sending booking notification:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Stadium-related notifications
   */
  async sendStadiumNotification(stadiumId, type, customData = {}) {
    try {
      const { data: stadium, error } = await supabase
        .from('stadiums')
        .select(`
          *,
          profiles!stadiums_owner_id_fkey (full_name)
        `)
        .eq('id', stadiumId)
        .single();

      if (error) throw error;

      const ownerName = stadium.profiles?.full_name || 'Stadium Owner';
      const stadiumName = stadium.name;

      let notification = null;

      switch (type) {
        case 'stadium_approved':
          notification = {
            userId: stadium.owner_id,
            title: 'Stadium Approved! 🎉',
            body: `Your stadium "${stadiumName}" has been approved and is now live!`,
            data: {
              type: 'stadium_approved',
              stadiumId: stadium.id,
              ...customData
            }
          };
          break;

        case 'stadium_rejected':
          notification = {
            userId: stadium.owner_id,
            title: 'Stadium Needs Updates 📝',
            body: `Your stadium "${stadiumName}" needs some updates before approval`,
            data: {
              type: 'stadium_rejected',
              stadiumId: stadium.id,
              reason: customData.reason,
              ...customData
            }
          };
          break;

        case 'low_availability':
          notification = {
            userId: stadium.owner_id,
            title: 'Low Availability Alert! 📅',
            body: `"${stadiumName}" has very few available time slots this week`,
            data: {
              type: 'low_availability',
              stadiumId: stadium.id,
              ...customData
            }
          };
          break;
      }

      if (notification) {
        // Store and send notification
        const storeResult = await this.storeNotification(
          notification.userId,
          notification.data.type,
          notification.title,
          notification.body,
          notification.data
        );

        const localResult = await this.sendLocalNotification(
          notification.title,
          notification.body,
          notification.data
        );

        return {
          success: true,
          stored: storeResult.success,
          sent: localResult.success,
        };
      }

      return { success: false, error: 'Unknown notification type' };
    } catch (error) {
      console.error('Error sending stadium notification:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get user's notifications
   */
  async getUserNotifications(userId, limit = 50, offset = 0) {
    try {
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      return { success: true, notifications: notifications || [] };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return { success: false, error: error.message, notifications: [] };
    }
  },

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId) {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
      return { success: true, count: count || 0 };
    } catch (error) {
      console.error('Error getting unread count:', error);
      return { success: false, error: error.message, count: 0 };
    }
  },

  /**
   * Delete old notifications (cleanup)
   */
  async cleanupOldNotifications(daysToKeep = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const { error } = await supabase
        .from('notifications')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error cleaning up notifications:', error);
      return { success: false, error: error.message };
    }
  }
};