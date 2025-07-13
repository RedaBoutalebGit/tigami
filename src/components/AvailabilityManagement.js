import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';
import { supabase } from '../services/supabase';

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Monday', short: 'Mon' },
  { key: 'tuesday', label: 'Tuesday', short: 'Tue' },
  { key: 'wednesday', label: 'Wednesday', short: 'Wed' },
  { key: 'thursday', label: 'Thursday', short: 'Thu' },
  { key: 'friday', label: 'Friday', short: 'Fri' },
  { key: 'saturday', label: 'Saturday', short: 'Sat' },
  { key: 'sunday', label: 'Sunday', short: 'Sun' },
];

const TIME_SLOTS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
];

const TimeSlotButton = ({ time, isSelected, isBooked, isDisabled, onPress }) => {
  const getButtonStyle = () => {
    if (isDisabled) return [styles.timeSlot, styles.disabledSlot];
    if (isBooked) return [styles.timeSlot, styles.bookedSlot];
    if (isSelected) return [styles.timeSlot, styles.selectedSlot];
    return [styles.timeSlot, styles.availableSlot];
  };

  const getTextColor = () => {
    if (isDisabled) return Colors.gray;
    if (isBooked) return Colors.white;
    if (isSelected) return Colors.white;
    return Colors.secondary;
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      disabled={isDisabled || isBooked}
    >
      <Text style={[styles.timeSlotText, { color: getTextColor() }]}>
        {time}
      </Text>
      {isBooked && (
        <Ionicons name="lock-closed" size={12} color={Colors.white} />
      )}
    </TouchableOpacity>
  );
};

const DayAvailabilityRow = ({ day, availability, bookings, onToggleSlot }) => {
  const isSlotBooked = (time) => {
    return bookings.some(booking => {
      const bookingTime = booking.start_time?.slice(0, 5);
      return bookingTime === time && booking.status !== 'cancelled';
    });
  };

  const isSlotSelected = (time) => {
    return availability[day.key]?.includes(time) || false;
  };

  return (
    <View style={styles.dayRow}>
      <View style={styles.dayHeader}>
        <Text style={styles.dayLabel}>{day.short}</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeSlotsContainer}>
        {TIME_SLOTS.map((time) => (
          <TimeSlotButton
            key={time}
            time={time}
            isSelected={isSlotSelected(time)}
            isBooked={isSlotBooked(time)}
            isDisabled={false}
            onPress={() => onToggleSlot(day.key, time)}
          />
        ))}
      </ScrollView>
    </View>
  );
};

export default function AvailabilityManagement({ stadiumId, onSave, onClose }) {
  const [availability, setAvailability] = useState({
    monday: [],
    tuesday: [],
    wednesday: [],
    thursday: [],
    friday: [],
    saturday: [],
    sunday: [],
  });
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (stadiumId) {
      fetchAvailabilityData();
    }
  }, [stadiumId]);

  const fetchAvailabilityData = async () => {
    try {
      setLoading(true);
      
      // Fetch current availability settings
      const { data: stadiumData, error: stadiumError } = await supabase
        .from('stadiums')
        .select('available_hours')
        .eq('id', stadiumId)
        .single();

      if (stadiumError) throw stadiumError;

      // Parse existing availability or set defaults
      if (stadiumData?.available_hours) {
        setAvailability(stadiumData.available_hours);
      } else {
        // Set default availability (9 AM to 9 PM, all days)
        const defaultSchedule = {};
        DAYS_OF_WEEK.forEach(day => {
          defaultSchedule[day.key] = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];
        });
        setAvailability(defaultSchedule);
      }

      // Fetch upcoming bookings for the next 30 days
      const today = new Date();
      const thirtyDaysLater = new Date(today.getTime() + (30 * 24 * 60 * 60 * 1000));
      
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('booking_date, start_time, end_time, status')
        .eq('stadium_id', stadiumId)
        .gte('booking_date', today.toISOString().split('T')[0])
        .lte('booking_date', thirtyDaysLater.toISOString().split('T')[0])
        .in('status', ['confirmed', 'pending']);

      if (bookingsError) throw bookingsError;
      setUpcomingBookings(bookingsData || []);

    } catch (error) {
      console.error('Error fetching availability data:', error);
      Alert.alert('Error', 'Failed to load availability data');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSlot = (day, time) => {
    setAvailability(prev => {
      const daySlots = prev[day] || [];
      const isSelected = daySlots.includes(time);
      
      if (isSelected) {
        // Remove time slot
        return {
          ...prev,
          [day]: daySlots.filter(slot => slot !== time)
        };
      } else {
        // Add time slot
        return {
          ...prev,
          [day]: [...daySlots, time].sort()
        };
      }
    });
  };

  const handleSelectAll = (day) => {
    setAvailability(prev => ({
      ...prev,
      [day]: [...TIME_SLOTS]
    }));
  };

  const handleClearAll = (day) => {
    setAvailability(prev => ({
      ...prev,
      [day]: []
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      const { error } = await supabase
        .from('stadiums')
        .update({
          available_hours: availability,
          updated_at: new Date().toISOString()
        })
        .eq('id', stadiumId);

      if (error) throw error;

      Alert.alert('Success', 'Availability schedule updated successfully');
      onSave && onSave();
    } catch (error) {
      console.error('Error saving availability:', error);
      Alert.alert('Error', 'Failed to save availability schedule');
    } finally {
      setSaving(false);
    }
  };

  const getBookingsForToday = () => {
    const today = new Date().toISOString().split('T')[0];
    return upcomingBookings.filter(booking => booking.booking_date === today);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading availability data...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color={Colors.secondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Manage Availability</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={styles.saveButton}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.legendContainer}>
          <Text style={styles.sectionTitle}>Legend</Text>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.availableSlot]} />
              <Text style={styles.legendText}>Available</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.selectedSlot]} />
              <Text style={styles.legendText}>Selected</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.bookedSlot]} />
              <Text style={styles.legendText}>Booked</Text>
            </View>
          </View>
        </View>

        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {DAYS_OF_WEEK.map((day) => (
              <View key={day.key} style={styles.dayQuickActions}>
                <Text style={styles.dayName}>{day.short}</Text>
                <View style={styles.quickActionButtons}>
                  <TouchableOpacity
                    style={styles.quickActionButton}
                    onPress={() => handleSelectAll(day.key)}
                  >
                    <Text style={styles.quickActionText}>All</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.quickActionButton, styles.clearButton]}
                    onPress={() => handleClearAll(day.key)}
                  >
                    <Text style={styles.quickActionText}>Clear</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>
        </View>

        <View style={styles.scheduleContainer}>
          <Text style={styles.sectionTitle}>Weekly Schedule</Text>
          {DAYS_OF_WEEK.map((day) => (
            <DayAvailabilityRow
              key={day.key}
              day={day}
              availability={availability}
              bookings={upcomingBookings.filter(booking => {
                const bookingDate = new Date(booking.booking_date);
                const dayOfWeek = bookingDate.getDay();
                const dayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Convert Sunday (0) to 6, Monday (1) to 0, etc.
                return DAYS_OF_WEEK[dayIndex]?.key === day.key;
              })}
              onToggleSlot={handleToggleSlot}
            />
          ))}
        </View>

        <View style={styles.upcomingBookingsContainer}>
          <Text style={styles.sectionTitle}>Today's Bookings</Text>
          {getBookingsForToday().length === 0 ? (
            <Text style={styles.noBookingsText}>No bookings for today</Text>
          ) : (
            getBookingsForToday().map((booking, index) => (
              <View key={index} style={styles.bookingItem}>
                <Text style={styles.bookingTime}>
                  {booking.start_time?.slice(0, 5)} - {booking.end_time?.slice(0, 5)}
                </Text>
                <View style={[styles.bookingStatus, 
                  booking.status === 'confirmed' ? styles.confirmedStatus : styles.pendingStatus
                ]}>
                  <Text style={styles.bookingStatusText}>{booking.status}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  headerTitle: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '600',
    color: Colors.secondary,
  },
  saveButton: {
    fontSize: Fonts.sizes.md,
    fontWeight: '600',
    color: Colors.primary,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Fonts.sizes.md,
    color: Colors.gray,
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: Fonts.sizes.md,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 12,
  },
  legendContainer: {
    marginBottom: 24,
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  legendItem: {
    alignItems: 'center',
  },
  legendColor: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginBottom: 4,
  },
  legendText: {
    fontSize: Fonts.sizes.xs,
    color: Colors.gray,
  },
  quickActionsContainer: {
    marginBottom: 24,
  },
  dayQuickActions: {
    alignItems: 'center',
    marginRight: 16,
  },
  dayName: {
    fontSize: Fonts.sizes.sm,
    fontWeight: '500',
    color: Colors.secondary,
    marginBottom: 8,
  },
  quickActionButtons: {
    flexDirection: 'row',
  },
  quickActionButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginHorizontal: 2,
  },
  clearButton: {
    backgroundColor: Colors.error,
  },
  quickActionText: {
    fontSize: Fonts.sizes.xs,
    color: Colors.white,
    fontWeight: '500',
  },
  scheduleContainer: {
    marginBottom: 24,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dayHeader: {
    width: 50,
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: Fonts.sizes.sm,
    fontWeight: '500',
    color: Colors.secondary,
  },
  timeSlotsContainer: {
    flex: 1,
  },
  timeSlot: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    marginRight: 4,
    minWidth: 50,
    alignItems: 'center',
    borderWidth: 1,
  },
  availableSlot: {
    backgroundColor: Colors.white,
    borderColor: Colors.lightGray,
  },
  selectedSlot: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  bookedSlot: {
    backgroundColor: Colors.error,
    borderColor: Colors.error,
  },
  disabledSlot: {
    backgroundColor: Colors.lightGray,
    borderColor: Colors.lightGray,
  },
  timeSlotText: {
    fontSize: Fonts.sizes.xs,
    fontWeight: '500',
  },
  upcomingBookingsContainer: {
    marginBottom: 24,
  },
  noBookingsText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.gray,
    textAlign: 'center',
    padding: 20,
  },
  bookingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.lightGray,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  bookingTime: {
    fontSize: Fonts.sizes.sm,
    fontWeight: '500',
    color: Colors.secondary,
  },
  bookingStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confirmedStatus: {
    backgroundColor: Colors.success,
  },
  pendingStatus: {
    backgroundColor: Colors.warning,
  },
  bookingStatusText: {
    fontSize: Fonts.sizes.xs,
    fontWeight: '600',
    color: Colors.white,
    textTransform: 'capitalize',
  },
});