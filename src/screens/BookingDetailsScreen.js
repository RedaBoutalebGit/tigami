import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { bookingService } from '../services/bookingService';

const BookingDetailsScreen = ({ route, navigation }) => {
  const { booking } = route.params;
  const { user } = useAuth();
  const [isOwner, setIsOwner] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [bookingData, setBookingData] = useState(booking);

  useEffect(() => {
    checkOwnership();
  }, []);

  const checkOwnership = async () => {
    if (user && booking.stadiums?.owner_id) {
      setIsOwner(user.id === booking.stadiums.owner_id);
    }
  };

  const handleConfirmBooking = () => {
    Alert.alert(
      'Confirm Booking',
      `Confirm this booking for ${booking.profiles?.full_name || 'customer'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: async () => {
            setActionLoading(true);
            const result = await bookingService.confirmBooking(booking.id);
            if (result.success) {
              setBookingData({ ...bookingData, status: 'confirmed' });
              Alert.alert('Success', 'Booking confirmed successfully');
            } else {
              Alert.alert('Error', result.error || 'Failed to confirm booking');
            }
            setActionLoading(false);
          }
        }
      ]
    );
  };

  const handleCancelBooking = () => {
    Alert.alert(
      'Cancel Booking',
      isOwner ? 'Cancel this booking as stadium owner?' : 'Are you sure you want to cancel this booking?',
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes', 
          onPress: async () => {
            setActionLoading(true);
            const reason = isOwner ? 'Cancelled by stadium owner' : 'Cancelled by customer';
            const result = await bookingService.cancelBooking(booking.id, reason);
            if (result.success) {
              setBookingData({ ...bookingData, status: 'cancelled' });
              Alert.alert('Success', 'Booking cancelled successfully');
            } else {
              Alert.alert('Error', result.error || 'Failed to cancel booking');
            }
            setActionLoading(false);
          }
        }
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return '#4CAF50';
      case 'pending': return '#FF9800';
      case 'cancelled': return '#F44336';
      default: return '#9E9E9E';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.stadiumSection}>
          <Image 
            source={{ uri: booking.stadiums?.photos?.[0] }} 
            style={styles.stadiumImage}
          />
          <View style={styles.stadiumInfo}>
            <Text style={styles.stadiumName}>{booking.stadiums?.name}</Text>
            <Text style={styles.stadiumLocation}>{booking.stadiums?.city}</Text>
          </View>
        </View>

        <View style={styles.detailsSection}>
          <View style={styles.statusContainer}>
            <Text style={styles.sectionTitle}>Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(bookingData.status) }]}>
              <Text style={styles.statusText}>{bookingData.status.toUpperCase()}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Booking ID</Text>
            <Text style={styles.detailValue}>{booking.id}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{formatDate(booking.booking_date)}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Time</Text>
            <Text style={styles.detailValue}>
              {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Price</Text>
            <Text style={styles.priceValue}>${booking.total_price}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Payment Status</Text>
            <Text style={[styles.detailValue, { color: getStatusColor(booking.payment_status) }]}>
              {booking.payment_status?.toUpperCase()}
            </Text>
          </View>

          {booking.notes && (
            <View style={styles.notesSection}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.notesText}>{booking.notes}</Text>
            </View>
          )}
        </View>

        {(bookingData.status === 'pending' || (isOwner && bookingData.status === 'confirmed')) && (
          <View style={styles.actionsSection}>
            {isOwner ? (
              <>
                {bookingData.status === 'pending' && (
                  <TouchableOpacity 
                    style={styles.confirmButton} 
                    onPress={handleConfirmBooking}
                    disabled={actionLoading}
                  >
                    {actionLoading ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <Text style={styles.confirmButtonText}>Confirm Booking</Text>
                    )}
                  </TouchableOpacity>
                )}
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={handleCancelBooking}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.cancelButtonText}>Cancel Booking</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              bookingData.status === 'pending' && (
                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={handleCancelBooking}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.cancelButtonText}>Cancel Booking</Text>
                  )}
                </TouchableOpacity>
              )
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1a5f1a',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  stadiumSection: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  stadiumImage: {
    width: '100%',
    height: 200,
  },
  stadiumInfo: {
    padding: 16,
  },
  stadiumName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  stadiumLocation: {
    fontSize: 14,
    color: '#666',
  },
  detailsSection: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a5f1a',
  },
  notesSection: {
    marginTop: 16,
  },
  notesText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    lineHeight: 20,
  },
  actionsSection: {
    marginHorizontal: 16,
    marginBottom: 32,
  },
  cancelButton: {
    backgroundColor: '#F44336',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default BookingDetailsScreen;