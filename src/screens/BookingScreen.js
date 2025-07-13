import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Image,
} from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

const TimeSlot = ({ time, available, selected, onPress }) => (
  <TouchableOpacity
    style={[
      styles.timeSlot,
      !available && styles.unavailableTimeSlot,
      selected && styles.selectedTimeSlot,
    ]}
    onPress={onPress}
    disabled={!available}
  >
    <Text
      style={[
        styles.timeSlotText,
        !available && styles.unavailableTimeSlotText,
        selected && styles.selectedTimeSlotText,
      ]}
    >
      {time}
    </Text>
  </TouchableOpacity>
);

export default function BookingScreen({ route, navigation }) {
  const { stadium } = route?.params || {};
  const { user } = useAuth();
  
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  const timeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
    '20:00', '21:00', '22:00'
  ];

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedDate]);

  const fetchAvailableSlots = async () => {
    if (!stadium || !selectedDate) return;

    try {
      setLoading(true);
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select('start_time, end_time')
        .eq('stadium_id', stadium.id)
        .eq('booking_date', selectedDate)
        .in('status', ['confirmed', 'pending']);

      if (error) throw error;

      const bookedSlots = bookings?.map(booking => booking.start_time) || [];
      const available = timeSlots.filter(slot => !bookedSlots.includes(`${slot}:00`));
      setAvailableSlots(available);
    } catch (error) {
      console.error('Error fetching available slots:', error);
      Alert.alert('Error', 'Failed to load available time slots');
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = (day) => {
    const today = new Date();
    const selected = new Date(day.dateString);
    
    if (selected < today.setHours(0, 0, 0, 0)) {
      Alert.alert('Invalid Date', 'Please select a future date');
      return;
    }
    
    setSelectedDate(day.dateString);
    setSelectedTimeSlot(null);
  };

  const handleTimeSlotSelect = (time) => {
    if (availableSlots.includes(time)) {
      setSelectedTimeSlot(time);
    }
  };

  const handleBooking = async () => {
    if (!user) {
      Alert.alert('Authentication Required', 'Please log in to make a booking');
      return;
    }

    if (!selectedDate || !selectedTimeSlot) {
      Alert.alert('Incomplete Selection', 'Please select both date and time');
      return;
    }

    try {
      setBookingLoading(true);

      const startTime = `${selectedTimeSlot}:00`;
      const endHour = parseInt(selectedTimeSlot.split(':')[0]) + 1;
      const endTime = `${endHour.toString().padStart(2, '0')}:00`;

      const { data, error } = await supabase
        .from('bookings')
        .insert([
          {
            stadium_id: stadium.id,
            user_id: user.id,
            booking_date: selectedDate,
            start_time: startTime,
            end_time: endTime,
            total_price: stadium.price_per_hour,
            status: 'pending',
            payment_status: 'pending',
          }
        ])
        .select();

      if (error) throw error;

      Alert.alert(
        'Booking Confirmed!',
        `Your booking for ${stadium.name} on ${selectedDate} at ${selectedTimeSlot} has been confirmed.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Profile')
          }
        ]
      );

      // Refresh available slots
      fetchAvailableSlots();
      setSelectedTimeSlot(null);

    } catch (error) {
      console.error('Error creating booking:', error);
      Alert.alert('Booking Failed', 'Failed to create booking. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (!stadium) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Stadium information not available</Text>
        </View>
      </SafeAreaView>
    );
  }

  const today = new Date().toISOString().split('T')[0];
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={Colors.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Book Stadium</Text>
        </View>

        <View style={styles.stadiumInfo}>
          {stadium.photos && stadium.photos.length > 0 ? (
            <Image source={{ uri: stadium.photos[0] }} style={styles.stadiumImage} />
          ) : (
            <View style={[styles.stadiumImage, styles.placeholderImage]}>
              <Ionicons name="football-outline" size={60} color={Colors.gray} />
            </View>
          )}
          
          <View style={styles.stadiumDetails}>
            <Text style={styles.stadiumName}>{stadium.name}</Text>
            <View style={styles.locationContainer}>
              <Ionicons name="location-outline" size={16} color={Colors.gray} />
              <Text style={styles.locationText}>{stadium.address}, {stadium.city}</Text>
            </View>
            <Text style={styles.priceText}>{stadium.price_per_hour} MAD/hour</Text>
          </View>
        </View>

        <View style={styles.bookingSection}>
          <Text style={styles.sectionTitle}>Select Date</Text>
          <Calendar
            onDayPress={handleDateSelect}
            markedDates={{
              [selectedDate]: {
                selected: true,
                selectedColor: Colors.primary,
              },
            }}
            minDate={today}
            maxDate={maxDate.toISOString().split('T')[0]}
            theme={{
              backgroundColor: Colors.white,
              calendarBackground: Colors.white,
              textSectionTitleColor: Colors.secondary,
              selectedDayBackgroundColor: Colors.primary,
              selectedDayTextColor: Colors.white,
              todayTextColor: Colors.primary,
              dayTextColor: Colors.secondary,
              textDisabledColor: Colors.gray,
              dotColor: Colors.primary,
              selectedDotColor: Colors.white,
              arrowColor: Colors.primary,
              disabledArrowColor: Colors.gray,
              monthTextColor: Colors.secondary,
              textDayFontWeight: '500',
              textMonthFontWeight: '600',
              textDayHeaderFontWeight: '600',
            }}
          />
        </View>

        {selectedDate && (
          <View style={styles.timeSection}>
            <Text style={styles.sectionTitle}>Available Time Slots</Text>
            {loading ? (
              <ActivityIndicator size="large" color={Colors.primary} style={styles.loader} />
            ) : (
              <View style={styles.timeSlotsContainer}>
                {timeSlots.map((time) => (
                  <TimeSlot
                    key={time}
                    time={time}
                    available={availableSlots.includes(time)}
                    selected={selectedTimeSlot === time}
                    onPress={() => handleTimeSlotSelect(time)}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {selectedDate && selectedTimeSlot && (
          <View style={styles.summarySection}>
            <Text style={styles.sectionTitle}>Booking Summary</Text>
            <View style={styles.summaryCard}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Stadium:</Text>
                <Text style={styles.summaryValue}>{stadium.name}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Date:</Text>
                <Text style={styles.summaryValue}>{selectedDate}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Time:</Text>
                <Text style={styles.summaryValue}>{selectedTimeSlot} - {parseInt(selectedTimeSlot.split(':')[0]) + 1}:00</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Duration:</Text>
                <Text style={styles.summaryValue}>1 hour</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total:</Text>
                <Text style={styles.totalValue}>{stadium.price_per_hour} MAD</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.bookButton}
              onPress={handleBooking}
              disabled={bookingLoading}
            >
              {bookingLoading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} />
                  <Text style={styles.bookButtonText}>Confirm Booking</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
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
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 40,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: Fonts.sizes.xl,
    fontWeight: '600',
    color: Colors.white,
  },
  stadiumInfo: {
    padding: 20,
  },
  stadiumImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 16,
  },
  placeholderImage: {
    backgroundColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stadiumDetails: {
    backgroundColor: Colors.lightGray,
    padding: 16,
    borderRadius: 12,
  },
  stadiumName: {
    fontSize: Fonts.sizes.xl,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.gray,
    marginLeft: 4,
    flex: 1,
  },
  priceText: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '700',
    color: Colors.primary,
  },
  bookingSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 16,
  },
  timeSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  loader: {
    marginVertical: 20,
  },
  timeSlotsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlot: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
    marginRight: 8,
    marginBottom: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  unavailableTimeSlot: {
    backgroundColor: Colors.gray,
    opacity: 0.5,
  },
  selectedTimeSlot: {
    backgroundColor: Colors.primary,
  },
  timeSlotText: {
    fontSize: Fonts.sizes.sm,
    fontWeight: '500',
    color: Colors.secondary,
  },
  unavailableTimeSlotText: {
    color: Colors.white,
  },
  selectedTimeSlotText: {
    color: Colors.white,
  },
  summarySection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: Colors.lightGray,
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: Fonts.sizes.md,
    color: Colors.gray,
  },
  summaryValue: {
    fontSize: Fonts.sizes.md,
    fontWeight: '500',
    color: Colors.secondary,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.gray,
    paddingTop: 12,
    marginTop: 8,
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '600',
    color: Colors.secondary,
  },
  totalValue: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '700',
    color: Colors.primary,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  bookButtonText: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '600',
    color: Colors.white,
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: Fonts.sizes.lg,
    color: Colors.gray,
  },
});