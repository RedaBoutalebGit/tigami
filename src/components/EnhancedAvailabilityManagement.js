import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';
import { supabase } from '../services/supabase';

const DAYS_OF_WEEK = [
  { key: 0, label: 'Sunday', short: 'Sun' },
  { key: 1, label: 'Monday', short: 'Mon' },
  { key: 2, label: 'Tuesday', short: 'Tue' },
  { key: 3, label: 'Wednesday', short: 'Wed' },
  { key: 4, label: 'Thursday', short: 'Thu' },
  { key: 5, label: 'Friday', short: 'Fri' },
  { key: 6, label: 'Saturday', short: 'Sat' },
];

const TIME_SLOTS = [
  '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
  '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
];

const SLOT_STATES = {
  DEFAULT: 'default',      // Use default schedule
  AVAILABLE: 'available',   // Force available
  UNAVAILABLE: 'unavailable', // Force unavailable (maintenance, events, etc.)
  BOOKED: 'booked'         // Already booked (read-only)
};

const DateRangePicker = ({ visible, onClose, onSelect, selectedRange }) => {
  const [startDate, setStartDate] = useState(selectedRange?.start || new Date());
  const [endDate, setEndDate] = useState(selectedRange?.end || new Date());
  const [mode, setMode] = useState('start'); // 'start' or 'end'

  const generateCalendarDays = () => {
    const today = new Date();
    const days = [];
    
    // Generate next 60 days
    for (let i = 0; i < 60; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isDateInRange = (date) => {
    return date >= startDate && date <= endDate;
  };

  const handleDatePress = (date) => {
    if (mode === 'start') {
      setStartDate(date);
      if (date > endDate) {
        setEndDate(date);
      }
      setMode('end');
    } else {
      if (date >= startDate) {
        setEndDate(date);
      } else {
        setStartDate(date);
        setEndDate(startDate);
      }
    }
  };

  const handleConfirm = () => {
    onSelect({ start: startDate, end: endDate });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.datePickerContainer}>
        <View style={styles.datePickerHeader}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.secondary} />
          </TouchableOpacity>
          <Text style={styles.datePickerTitle}>Select Date Range</Text>
          <TouchableOpacity onPress={handleConfirm}>
            <Text style={styles.confirmButton}>Done</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.dateRangeInfo}>
          <View style={styles.dateInfo}>
            <Text style={styles.dateLabel}>Start Date</Text>
            <Text style={[styles.dateValue, mode === 'start' && styles.activeDate]}>
              {formatDate(startDate)}
            </Text>
          </View>
          <View style={styles.dateInfo}>
            <Text style={styles.dateLabel}>End Date</Text>
            <Text style={[styles.dateValue, mode === 'end' && styles.activeDate]}>
              {formatDate(endDate)}
            </Text>
          </View>
        </View>

        <Text style={styles.instructionText}>
          Tap to select {mode === 'start' ? 'start' : 'end'} date
        </Text>

        <FlatList
          data={generateCalendarDays()}
          numColumns={7}
          keyExtractor={(item) => item.toISOString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.calendarDay,
                isDateInRange(item) && styles.calendarDayInRange,
                (item.getTime() === startDate.getTime() || item.getTime() === endDate.getTime()) && styles.calendarDaySelected
              ]}
              onPress={() => handleDatePress(item)}
            >
              <Text style={[
                styles.calendarDayText,
                isDateInRange(item) && styles.calendarDayTextInRange
              ]}>
                {item.getDate()}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.calendarContainer}
        />
      </View>
    </Modal>
  );
};

const TimeSlotButton = ({ time, state, onPress, onLongPress }) => {
  const getButtonStyle = () => {
    switch (state) {
      case SLOT_STATES.AVAILABLE:
        return [styles.timeSlot, styles.availableSlot];
      case SLOT_STATES.UNAVAILABLE:
        return [styles.timeSlot, styles.unavailableSlot];
      case SLOT_STATES.BOOKED:
        return [styles.timeSlot, styles.bookedSlot];
      default:
        return [styles.timeSlot, styles.defaultSlot];
    }
  };

  const getTextColor = () => {
    switch (state) {
      case SLOT_STATES.AVAILABLE:
        return Colors.white;
      case SLOT_STATES.UNAVAILABLE:
        return Colors.white;
      case SLOT_STATES.BOOKED:
        return Colors.white;
      default:
        return Colors.secondary;
    }
  };

  const getIcon = () => {
    switch (state) {
      case SLOT_STATES.AVAILABLE:
        return 'checkmark';
      case SLOT_STATES.UNAVAILABLE:
        return 'close';
      case SLOT_STATES.BOOKED:
        return 'lock-closed';
      default:
        return null;
    }
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={onPress}
      onLongPress={onLongPress}
      disabled={state === SLOT_STATES.BOOKED}
    >
      <Text style={[styles.timeSlotText, { color: getTextColor() }]}>
        {time}
      </Text>
      {getIcon() && (
        <Ionicons name={getIcon()} size={10} color={getTextColor()} />
      )}
    </TouchableOpacity>
  );
};

export default function EnhancedAvailabilityManagement({ stadiumId, onSave, onClose }) {
  const [defaultSchedule, setDefaultSchedule] = useState({
    0: [], 1: [], 2: [], 3: [], 4: [], 5: [], 6: [] // Sunday to Saturday
  });
  const [dateSpecificSchedules, setDateSpecificSchedules] = useState({});
  const [selectedDateRange, setSelectedDateRange] = useState({
    start: new Date(),
    end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default to next 7 days
  });
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedView, setSelectedView] = useState('range'); // 'default' or 'range'

  useEffect(() => {
    if (stadiumId) {
      fetchAvailabilityData();
    }
  }, [stadiumId]);

  const convertAvailableHours = (availableHours) => {
    if (!availableHours) {
      // Set default availability (9 AM to 9 PM, all days)
      const defaultSchedule = {};
      DAYS_OF_WEEK.forEach(day => {
        defaultSchedule[day.key] = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];
      });
      return defaultSchedule;
    }

    const convertedSchedule = {};
    DAYS_OF_WEEK.forEach(day => {
      const dayKey = day.label.toLowerCase();
      convertedSchedule[day.key] = availableHours[dayKey] || [];
    });
    return convertedSchedule;
  };

  const fetchAvailabilityData = async () => {
    try {
      setLoading(true);
      
      // Fetch stadium data with default schedule
      const { data: stadiumData, error: stadiumError } = await supabase
        .from('stadiums')
        .select('available_hours, date_specific_availability')
        .eq('id', stadiumId)
        .single();

      if (stadiumError) {
        // If date_specific_availability column doesn't exist, fetch without it
        if (stadiumError.code === '42703') {
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('stadiums')
            .select('available_hours')
            .eq('id', stadiumId)
            .single();
          
          if (fallbackError) throw fallbackError;
          
          // Use fallback data and set empty date-specific availability
          setDefaultSchedule(convertAvailableHours(fallbackData?.available_hours));
          setDateSpecificSchedules({});
        } else {
          throw stadiumError;
        }
      } else {
        // Normal flow when column exists
        setDefaultSchedule(convertAvailableHours(stadiumData?.available_hours));
        setDateSpecificSchedules(stadiumData?.date_specific_availability || {});
      }

      // Fetch bookings for the selected date range
      await fetchBookingsForRange(selectedDateRange);

    } catch (error) {
      console.error('Error fetching availability data:', error);
      Alert.alert('Error', 'Failed to load availability data');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookingsForRange = async (range) => {
    try {
      const { data: bookingsData, error } = await supabase
        .from('bookings')
        .select('booking_date, start_time, end_time, status')
        .eq('stadium_id', stadiumId)
        .gte('booking_date', range.start.toISOString().split('T')[0])
        .lte('booking_date', range.end.toISOString().split('T')[0])
        .in('status', ['confirmed', 'pending']);

      if (error) throw error;
      setBookings(bookingsData || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const generateDatesInRange = () => {
    const dates = [];
    const current = new Date(selectedDateRange.start);
    const end = new Date(selectedDateRange.end);
    
    while (current <= end) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  };

  const getSlotState = (date, time) => {
    const dateStr = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay();
    
    // Check if booked
    const isBooked = bookings.some(booking => 
      booking.booking_date === dateStr && 
      booking.start_time?.slice(0, 5) === time &&
      booking.status !== 'cancelled'
    );
    
    if (isBooked) return SLOT_STATES.BOOKED;
    
    // Check date-specific override
    if (dateSpecificSchedules[dateStr]) {
      const daySchedule = dateSpecificSchedules[dateStr];
      if (daySchedule.available?.includes(time)) return SLOT_STATES.AVAILABLE;
      if (daySchedule.unavailable?.includes(time)) return SLOT_STATES.UNAVAILABLE;
    }
    
    // Check default schedule
    if (defaultSchedule[dayOfWeek]?.includes(time)) {
      return SLOT_STATES.AVAILABLE;
    }
    
    return SLOT_STATES.DEFAULT;
  };

  const handleSlotPress = (date, time) => {
    const currentState = getSlotState(date, time);
    if (currentState === SLOT_STATES.BOOKED) return;
    
    const dateStr = date.toISOString().split('T')[0];
    
    setDateSpecificSchedules(prev => {
      const newSchedules = { ...prev };
      if (!newSchedules[dateStr]) {
        newSchedules[dateStr] = { available: [], unavailable: [] };
      }
      
      const daySchedule = newSchedules[dateStr];
      
      // Cycle through states: default -> available -> unavailable -> default
      switch (currentState) {
        case SLOT_STATES.DEFAULT:
          daySchedule.available = [...(daySchedule.available || []), time];
          daySchedule.unavailable = (daySchedule.unavailable || []).filter(t => t !== time);
          break;
        case SLOT_STATES.AVAILABLE:
          daySchedule.available = (daySchedule.available || []).filter(t => t !== time);
          daySchedule.unavailable = [...(daySchedule.unavailable || []), time];
          break;
        case SLOT_STATES.UNAVAILABLE:
          daySchedule.available = (daySchedule.available || []).filter(t => t !== time);
          daySchedule.unavailable = (daySchedule.unavailable || []).filter(t => t !== time);
          break;
      }
      
      return newSchedules;
    });
  };

  const handleDefaultSlotToggle = (dayOfWeek, time) => {
    setDefaultSchedule(prev => {
      const daySlots = prev[dayOfWeek] || [];
      const isSelected = daySlots.includes(time);
      
      return {
        ...prev,
        [dayOfWeek]: isSelected
          ? daySlots.filter(slot => slot !== time)
          : [...daySlots, time].sort()
      };
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Convert default schedule back to day names
      const convertedDefaultSchedule = {};
      DAYS_OF_WEEK.forEach(day => {
        const dayKey = day.label.toLowerCase();
        convertedDefaultSchedule[dayKey] = defaultSchedule[day.key] || [];
      });
      
      // Try to save with date_specific_availability first
      let { error } = await supabase
        .from('stadiums')
        .update({
          available_hours: convertedDefaultSchedule,
          date_specific_availability: dateSpecificSchedules,
          updated_at: new Date().toISOString()
        })
        .eq('id', stadiumId);

      // If column doesn't exist, save without it
      if (error && error.code === '42703') {
        const { error: fallbackError } = await supabase
          .from('stadiums')
          .update({
            available_hours: convertedDefaultSchedule,
            updated_at: new Date().toISOString()
          })
          .eq('id', stadiumId);
        
        if (fallbackError) throw fallbackError;
        
        Alert.alert(
          'Partial Save', 
          'Default schedule saved. Date-specific availability requires database migration.\n\nPlease run the migration: supabase migration up'
        );
      } else if (error) {
        throw error;
      } else {
        Alert.alert('Success', 'Availability schedule updated successfully');
      }

      onSave && onSave();
    } catch (error) {
      console.error('Error saving availability:', error);
      Alert.alert('Error', 'Failed to save availability schedule');
    } finally {
      setSaving(false);
    }
  };

  const handleDateRangeSelect = (range) => {
    setSelectedDateRange(range);
    fetchBookingsForRange(range);
  };

  const handleBulkOperation = (operation, dates = null) => {
    const targetDates = dates || generateDatesInRange();
    
    Alert.alert(
      'Bulk Operation',
      `${operation === 'available' ? 'Mark all slots as AVAILABLE' : 'Mark all slots as UNAVAILABLE'} for ${targetDates.length} day(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            setDateSpecificSchedules(prev => {
              const newSchedules = { ...prev };
              
              targetDates.forEach(date => {
                const dateStr = date.toISOString().split('T')[0];
                if (!newSchedules[dateStr]) {
                  newSchedules[dateStr] = { available: [], unavailable: [] };
                }
                
                if (operation === 'available') {
                  newSchedules[dateStr].available = [...TIME_SLOTS];
                  newSchedules[dateStr].unavailable = [];
                } else {
                  newSchedules[dateStr].available = [];
                  newSchedules[dateStr].unavailable = [...TIME_SLOTS];
                }
              });
              
              return newSchedules;
            });
          }
        }
      ]
    );
  };

  const handleClearOverrides = () => {
    const targetDates = generateDatesInRange();
    
    Alert.alert(
      'Clear Overrides',
      `Remove all date-specific overrides for ${targetDates.length} day(s)? This will revert to default schedule.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: () => {
            setDateSpecificSchedules(prev => {
              const newSchedules = { ...prev };
              
              targetDates.forEach(date => {
                const dateStr = date.toISOString().split('T')[0];
                delete newSchedules[dateStr];
              });
              
              return newSchedules;
            });
          }
        }
      ]
    );
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

      <View style={styles.viewSelector}>
        <TouchableOpacity
          style={[styles.viewButton, selectedView === 'default' && styles.activeViewButton]}
          onPress={() => setSelectedView('default')}
        >
          <Text style={[styles.viewButtonText, selectedView === 'default' && styles.activeViewButtonText]}>
            Default Schedule
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewButton, selectedView === 'range' && styles.activeViewButton]}
          onPress={() => setSelectedView('range')}
        >
          <Text style={[styles.viewButtonText, selectedView === 'range' && styles.activeViewButtonText]}>
            Date Range
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.legendContainer}>
          <Text style={styles.sectionTitle}>Legend</Text>
          <View style={styles.legendRow}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.defaultSlot]} />
              <Text style={styles.legendText}>Default</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.availableSlot]} />
              <Text style={styles.legendText}>Available</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.unavailableSlot]} />
              <Text style={styles.legendText}>Unavailable</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, styles.bookedSlot]} />
              <Text style={styles.legendText}>Booked</Text>
            </View>
          </View>
        </View>

        {selectedView === 'default' ? (
          <View style={styles.defaultScheduleContainer}>
            <Text style={styles.sectionTitle}>Default Weekly Schedule</Text>
            <Text style={styles.sectionSubtitle}>This schedule applies to all days unless overridden</Text>
            
            {DAYS_OF_WEEK.map((day) => (
              <View key={day.key} style={styles.dayRow}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayLabel}>{day.short}</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeSlotsContainer}>
                  {TIME_SLOTS.map((time) => (
                    <TimeSlotButton
                      key={time}
                      time={time}
                      state={defaultSchedule[day.key]?.includes(time) ? SLOT_STATES.AVAILABLE : SLOT_STATES.DEFAULT}
                      onPress={() => handleDefaultSlotToggle(day.key, time)}
                    />
                  ))}
                </ScrollView>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.dateRangeContainer}>
            <View style={styles.dateRangeHeader}>
              <Text style={styles.sectionTitle}>Date-Specific Availability</Text>
              <TouchableOpacity
                style={styles.changeDateButton}
                onPress={() => setDatePickerVisible(true)}
              >
                <Ionicons name="calendar-outline" size={16} color={Colors.primary} />
                <Text style={styles.changeDateButtonText}>Change Dates</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.currentRange}>
              {selectedDateRange.start.toLocaleDateString()} - {selectedDateRange.end.toLocaleDateString()}
            </Text>
            
            <Text style={styles.instructionText}>
              Tap slots to cycle: Default → Available → Unavailable
            </Text>

            <View style={styles.bulkActionsContainer}>
              <Text style={styles.bulkActionsTitle}>Bulk Actions for Date Range</Text>
              <View style={styles.bulkActionsRow}>
                <TouchableOpacity
                  style={[styles.bulkActionButton, styles.availableBulkButton]}
                  onPress={() => handleBulkOperation('available')}
                >
                  <Ionicons name="checkmark-circle-outline" size={16} color={Colors.white} />
                  <Text style={styles.bulkActionText}>All Available</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.bulkActionButton, styles.unavailableBulkButton]}
                  onPress={() => handleBulkOperation('unavailable')}
                >
                  <Ionicons name="close-circle-outline" size={16} color={Colors.white} />
                  <Text style={styles.bulkActionText}>All Unavailable</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.bulkActionButton, styles.clearBulkButton]}
                  onPress={handleClearOverrides}
                >
                  <Ionicons name="refresh-outline" size={16} color={Colors.white} />
                  <Text style={styles.bulkActionText}>Reset to Default</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {generateDatesInRange().map((date) => (
              <View key={date.toISOString()} style={styles.dayRow}>
                <View style={styles.dayHeader}>
                  <Text style={styles.dayLabel}>
                    {DAYS_OF_WEEK[date.getDay()].short}
                  </Text>
                  <Text style={styles.dateLabel}>
                    {date.getDate()}/{date.getMonth() + 1}
                  </Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.timeSlotsContainer}>
                  {TIME_SLOTS.map((time) => (
                    <TimeSlotButton
                      key={time}
                      time={time}
                      state={getSlotState(date, time)}
                      onPress={() => handleSlotPress(date, time)}
                    />
                  ))}
                </ScrollView>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <DateRangePicker
        visible={datePickerVisible}
        onClose={() => setDatePickerVisible(false)}
        onSelect={handleDateRangeSelect}
        selectedRange={selectedDateRange}
      />
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
  viewSelector: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.lightGray,
  },
  viewButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  activeViewButton: {
    backgroundColor: Colors.primary,
  },
  viewButtonText: {
    fontSize: Fonts.sizes.sm,
    fontWeight: '500',
    color: Colors.gray,
  },
  activeViewButtonText: {
    color: Colors.white,
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
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: Fonts.sizes.sm,
    color: Colors.gray,
    marginBottom: 16,
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
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dayHeader: {
    width: 60,
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: Fonts.sizes.sm,
    fontWeight: '500',
    color: Colors.secondary,
  },
  dateLabel: {
    fontSize: Fonts.sizes.xs,
    color: Colors.gray,
  },
  timeSlotsContainer: {
    flex: 1,
  },
  timeSlot: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 4,
    minWidth: 50,
    alignItems: 'center',
    borderWidth: 1,
  },
  defaultSlot: {
    backgroundColor: Colors.white,
    borderColor: Colors.lightGray,
  },
  availableSlot: {
    backgroundColor: Colors.success,
    borderColor: Colors.success,
  },
  unavailableSlot: {
    backgroundColor: Colors.error,
    borderColor: Colors.error,
  },
  bookedSlot: {
    backgroundColor: Colors.warning,
    borderColor: Colors.warning,
  },
  timeSlotText: {
    fontSize: Fonts.sizes.xs,
    fontWeight: '500',
    marginBottom: 2,
  },
  dateRangeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  changeDateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGray,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  changeDateButtonText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  currentRange: {
    fontSize: Fonts.sizes.sm,
    color: Colors.secondary,
    fontWeight: '500',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.gray,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  datePickerContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  datePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  datePickerTitle: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '600',
    color: Colors.secondary,
  },
  confirmButton: {
    fontSize: Fonts.sizes.md,
    fontWeight: '600',
    color: Colors.primary,
  },
  dateRangeInfo: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    backgroundColor: Colors.lightGray,
  },
  dateInfo: {
    alignItems: 'center',
  },
  dateLabel: {
    fontSize: Fonts.sizes.sm,
    color: Colors.gray,
    marginBottom: 4,
  },
  dateValue: {
    fontSize: Fonts.sizes.md,
    fontWeight: '600',
    color: Colors.secondary,
  },
  activeDate: {
    color: Colors.primary,
  },
  calendarContainer: {
    padding: 20,
  },
  calendarDay: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    margin: 2,
  },
  calendarDayInRange: {
    backgroundColor: Colors.primary,
  },
  calendarDaySelected: {
    backgroundColor: Colors.accent,
  },
  calendarDayText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.secondary,
  },
  calendarDayTextInRange: {
    color: Colors.white,
  },
  bulkActionsContainer: {
    backgroundColor: Colors.lightGray,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  bulkActionsTitle: {
    fontSize: Fonts.sizes.sm,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 12,
    textAlign: 'center',
  },
  bulkActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  bulkActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  availableBulkButton: {
    backgroundColor: Colors.success,
  },
  unavailableBulkButton: {
    backgroundColor: Colors.error,
  },
  clearBulkButton: {
    backgroundColor: Colors.warning,
  },
  bulkActionText: {
    fontSize: Fonts.sizes.xs,
    fontWeight: '600',
    color: Colors.white,
    marginLeft: 4,
  },
});