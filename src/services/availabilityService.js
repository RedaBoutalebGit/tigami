import { supabase } from './supabase';

export const availabilityService = {
  /**
   * Check if a specific time slot is available for booking
   * Takes into account: default schedule, date-specific overrides, and existing bookings
   */
  async isSlotAvailable(stadiumId, date, time) {
    try {
      // Fetch stadium availability settings
      const { data: stadium, error: stadiumError } = await supabase
        .from('stadiums')
        .select('available_hours, date_specific_availability, is_active')
        .eq('id', stadiumId)
        .single();

      if (stadiumError) throw stadiumError;

      // Check if stadium is active
      if (!stadium.is_active) {
        return { available: false, reason: 'Stadium is not active' };
      }

      const dateObj = new Date(date);
      const dayOfWeek = dateObj.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const dateStr = date; // YYYY-MM-DD format

      // Check date-specific availability first (overrides default schedule)
      if (stadium.date_specific_availability && stadium.date_specific_availability[dateStr]) {
        const dayOverride = stadium.date_specific_availability[dateStr];
        
        // If explicitly marked as unavailable
        if (dayOverride.unavailable && dayOverride.unavailable.includes(time)) {
          return { available: false, reason: 'Time slot marked as unavailable by stadium owner' };
        }
        
        // If explicitly marked as available
        if (dayOverride.available && dayOverride.available.includes(time)) {
          // Still need to check if it's already booked
          return await this.checkBookingConflict(stadiumId, date, time);
        }
        
        // If no specific override for this time, fall back to default schedule
      }

      // Check default weekly schedule
      if (stadium.available_hours) {
        const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const dayName = dayNames[dayOfWeek];
        const daySchedule = stadium.available_hours[dayName] || [];
        
        if (!daySchedule.includes(time)) {
          return { available: false, reason: 'Time slot not in stadium operating hours' };
        }
      }

      // If we reach here, check for booking conflicts
      return await this.checkBookingConflict(stadiumId, date, time);

    } catch (error) {
      console.error('Error checking slot availability:', error);
      return { available: false, reason: 'Error checking availability' };
    }
  },

  /**
   * Check if a time slot has booking conflicts
   */
  async checkBookingConflict(stadiumId, date, time) {
    try {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('start_time, end_time, status')
        .eq('stadium_id', stadiumId)
        .eq('booking_date', date)
        .in('status', ['confirmed', 'pending']);

      if (error) throw error;

      // Check if the time slot conflicts with existing bookings
      const timeStr = `${time}:00`;
      const isBooked = bookings?.some(booking => {
        return booking.start_time === timeStr || 
               (booking.start_time <= timeStr && booking.end_time > timeStr);
      });

      if (isBooked) {
        return { available: false, reason: 'Time slot already booked' };
      }

      return { available: true, reason: 'Available for booking' };

    } catch (error) {
      console.error('Error checking booking conflict:', error);
      return { available: false, reason: 'Error checking booking conflicts' };
    }
  },

  /**
   * Get all available time slots for a specific date
   */
  async getAvailableSlots(stadiumId, date) {
    const allTimeSlots = [
      '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
      '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
      '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
    ];

    const availabilityPromises = allTimeSlots.map(async (time) => {
      const result = await this.isSlotAvailable(stadiumId, date, time);
      return {
        time,
        available: result.available,
        reason: result.reason
      };
    });

    try {
      const results = await Promise.all(availabilityPromises);
      return {
        success: true,
        slots: results
      };
    } catch (error) {
      console.error('Error getting available slots:', error);
      return {
        success: false,
        error: error.message,
        slots: []
      };
    }
  },

  /**
   * Get stadium availability information for display
   */
  async getStadiumAvailabilityInfo(stadiumId) {
    try {
      const { data: stadium, error } = await supabase
        .from('stadiums')
        .select('available_hours, date_specific_availability, is_active, name')
        .eq('id', stadiumId)
        .single();

      if (error) throw error;

      // Parse operating hours for display
      const operatingHours = {};
      const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayLabels = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      dayNames.forEach((dayName, index) => {
        const daySchedule = stadium.available_hours?.[dayName] || [];
        if (daySchedule.length > 0) {
          const sortedSlots = daySchedule.sort();
          operatingHours[dayLabels[index]] = `${sortedSlots[0]} - ${sortedSlots[sortedSlots.length - 1]}`;
        } else {
          operatingHours[dayLabels[index]] = 'Closed';
        }
      });

      return {
        success: true,
        info: {
          name: stadium.name,
          isActive: stadium.is_active,
          operatingHours,
          hasDateSpecificRules: stadium.date_specific_availability && 
                                Object.keys(stadium.date_specific_availability).length > 0
        }
      };

    } catch (error) {
      console.error('Error getting stadium availability info:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Validate booking request before submission
   */
  async validateBookingRequest(stadiumId, date, startTime, endTime) {
    try {
      // Check if start time is available
      const startAvailability = await this.isSlotAvailable(stadiumId, date, startTime);
      if (!startAvailability.available) {
        return {
          valid: false,
          reason: `Start time unavailable: ${startAvailability.reason}`
        };
      }

      // For multi-hour bookings, check each hour
      if (endTime && endTime !== startTime) {
        const startHour = parseInt(startTime.split(':')[0]);
        const endHour = parseInt(endTime.split(':')[0]);
        
        for (let hour = startHour; hour < endHour; hour++) {
          const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
          const availability = await this.isSlotAvailable(stadiumId, date, timeSlot);
          
          if (!availability.available) {
            return {
              valid: false,
              reason: `Time slot ${timeSlot} unavailable: ${availability.reason}`
            };
          }
        }
      }

      return {
        valid: true,
        reason: 'Booking request is valid'
      };

    } catch (error) {
      console.error('Error validating booking request:', error);
      return {
        valid: false,
        reason: 'Error validating booking request'
      };
    }
  }
};