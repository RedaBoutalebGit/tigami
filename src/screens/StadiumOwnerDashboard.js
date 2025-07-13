import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { bookingService } from '../services/bookingService';
import RoleGuard from '../components/RoleGuard';

const QuickActionCard = ({ title, icon, onPress, color = Colors.primary }) => (
  <TouchableOpacity style={[styles.quickActionCard, { borderColor: color }]} onPress={onPress}>
    <Ionicons name={icon} size={24} color={color} />
    <Text style={[styles.quickActionText, { color }]}>{title}</Text>
  </TouchableOpacity>
);

const RecentBookingItem = ({ booking, onConfirm, onCancel }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return Colors.success;
      case 'pending':
        return Colors.warning;
      case 'cancelled':
        return Colors.error;
      default:
        return Colors.gray;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.bookingItem}>
      <View style={styles.bookingInfo}>
        <Text style={styles.customerName}>
          {booking.profiles?.full_name || 'Customer'}
        </Text>
        <Text style={styles.bookingDate}>
          {formatDate(booking.booking_date)} • {booking.start_time?.slice(0, 5)}
        </Text>
        <Text style={styles.stadiumNameSmall}>{booking.stadiums?.name}</Text>
      </View>
      <View style={styles.bookingRight}>
        <Text style={styles.bookingPrice}>{booking.total_price} MAD</Text>
        <View style={[styles.bookingStatus, { backgroundColor: getStatusColor(booking.status) }]}>
          <Text style={styles.bookingStatusText}>{booking.status}</Text>
        </View>
        {booking.status === 'pending' && (
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.confirmQuickButton} onPress={() => onConfirm(booking)}>
              <Ionicons name="checkmark" size={16} color={Colors.white} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelQuickButton} onPress={() => onCancel(booking)}>
              <Ionicons name="close" size={16} color={Colors.white} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

export default function StadiumOwnerDashboard({ navigation }) {
  const { user } = useAuth();
  const [stadiums, setStadiums] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    activeStadiums: 0,
    totalBookings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch owner's stadiums
      const { data: stadiumsData, error: stadiumsError } = await supabase
        .from('stadiums')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (stadiumsError) throw stadiumsError;
      setStadiums(stadiumsData || []);

      // Fetch recent bookings for owner's stadiums
      if (stadiumsData && stadiumsData.length > 0) {
        const stadiumIds = stadiumsData.map(s => s.id);
        
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select(`
            *,
            stadiums (name)
          `)
          .in('stadium_id', stadiumIds)
          .order('created_at', { ascending: false })
          .limit(5);

        if (bookingsError) throw bookingsError;

        // Fetch user profiles separately
        if (bookingsData && bookingsData.length > 0) {
          const userIds = bookingsData.map(booking => booking.user_id);
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', userIds);

          // Merge profiles with bookings
          const bookingsWithProfiles = bookingsData.map(booking => ({
            ...booking,
            profiles: profilesData?.find(p => p.id === booking.user_id) || { full_name: 'Unknown User' }
          }));

          setRecentBookings(bookingsWithProfiles);
        } else {
          setRecentBookings([]);
        }

        // Calculate stats
        const allBookings = bookingsData || [];
        const confirmedBookings = allBookings.filter(b => b.status === 'confirmed');
        const pendingBookings = allBookings.filter(b => b.status === 'pending');
        const totalRevenue = confirmedBookings.reduce((sum, booking) => sum + (booking.total_price || 0), 0);
        const activeStadiums = stadiumsData?.filter(s => s.is_active).length || 0;

        setStats({
          totalRevenue,
          pendingBookings: pendingBookings.length,
          confirmedBookings: confirmedBookings.length,
          activeStadiums,
          totalBookings: allBookings.length,
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const handleConfirmBooking = async (booking) => {
    Alert.alert(
      'Confirm Booking',
      `Confirm booking for ${booking.profiles?.full_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Confirm', 
          onPress: async () => {
            const result = await bookingService.confirmBooking(booking.id);
            if (result.success) {
              Alert.alert('Success', 'Booking confirmed successfully');
              fetchDashboardData();
            } else {
              Alert.alert('Error', result.error || 'Failed to confirm booking');
            }
          }
        }
      ]
    );
  };

  const handleCancelBooking = async (booking) => {
    Alert.alert(
      'Cancel Booking',
      `Cancel booking for ${booking.profiles?.full_name}?`,
      [
        { text: 'No', style: 'cancel' },
        { 
          text: 'Yes', 
          onPress: async () => {
            const result = await bookingService.cancelBooking(booking.id, 'Cancelled by stadium owner');
            if (result.success) {
              Alert.alert('Success', 'Booking cancelled successfully');
              fetchDashboardData();
            } else {
              Alert.alert('Error', result.error || 'Failed to cancel booking');
            }
          }
        }
      ]
    );
  };

  return (
    <RoleGuard allowedRoles={['stadium_owner']}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Stadium Dashboard</Text>
          <Text style={styles.headerSubtitle}>Manage your football stadiums</Text>
        </View>

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Stats Section */}
          <View style={styles.statsSection}>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Ionicons name="card-outline" size={24} color={Colors.primary} />
                <Text style={styles.statValue}>{stats.totalRevenue} MAD</Text>
                <Text style={styles.statLabel}>Total Revenue</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="business-outline" size={24} color={Colors.success} />
                <Text style={styles.statValue}>{stats.activeStadiums}</Text>
                <Text style={styles.statLabel}>Active Stadiums</Text>
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Ionicons name="time-outline" size={24} color={Colors.warning} />
                <Text style={styles.statValue}>{stats.pendingBookings}</Text>
                <Text style={styles.statLabel}>Pending Bookings</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="checkmark-circle-outline" size={24} color={Colors.accent} />
                <Text style={styles.statValue}>{stats.confirmedBookings}</Text>
                <Text style={styles.statLabel}>Confirmed Bookings</Text>
              </View>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActionsSection}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              <QuickActionCard
                title="Add Stadium"
                icon="add-circle-outline"
                onPress={() => navigation.navigate('AddStadium')}
                color={Colors.primary}
              />
              <QuickActionCard
                title="View All Bookings"
                icon="calendar-outline"
                onPress={() => navigation.navigate('AllBookings')}
                color={Colors.success}
              />
            </View>
          </View>

          {/* Recent Bookings */}
          <View style={styles.recentBookingsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Bookings</Text>
              {recentBookings.length > 0 && (
                <TouchableOpacity onPress={() => navigation.navigate('AllBookings')}>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              )}
            </View>

            {recentBookings.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={60} color={Colors.gray} />
                <Text style={styles.emptyStateTitle}>No Recent Bookings</Text>
                <Text style={styles.emptyStateText}>
                  Bookings will appear here once customers start booking your stadiums
                </Text>
              </View>
            ) : (
              <FlatList
                data={recentBookings}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <RecentBookingItem 
                    booking={item} 
                    onConfirm={handleConfirmBooking}
                    onCancel={handleCancelBooking}
                  />
                )}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
              />
            )}
          </View>

          {/* Stadium Overview */}
          <View style={styles.stadiumOverviewSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Stadium Overview</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Management')}>
                <Text style={styles.seeAllText}>Manage All</Text>
              </TouchableOpacity>
            </View>

            {stadiums.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="business-outline" size={60} color={Colors.gray} />
                <Text style={styles.emptyStateTitle}>No Stadiums Yet</Text>
                <Text style={styles.emptyStateText}>
                  Add your first stadium to start receiving bookings
                </Text>
                <TouchableOpacity 
                  style={styles.addStadiumButton} 
                  onPress={() => navigation.navigate('AddStadium')}
                >
                  <Text style={styles.addStadiumButtonText}>Add Stadium</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.stadiumSummary}>
                <Text style={styles.stadiumSummaryText}>
                  You have {stadiums.length} stadium{stadiums.length !== 1 ? 's' : ''} 
                  ({stats.activeStadiums} active)
                </Text>
                <TouchableOpacity 
                  style={styles.manageButton}
                  onPress={() => navigation.navigate('Management')}
                >
                  <Text style={styles.manageButtonText}>Manage Stadiums</Text>
                  <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </RoleGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: Colors.primary,
  },
  headerTitle: {
    fontSize: Fonts.sizes.xxl,
    fontWeight: '700',
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: Fonts.sizes.sm,
    color: Colors.white,
    opacity: 0.8,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  statsSection: {
    padding: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.lightGray,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '700',
    color: Colors.secondary,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: Fonts.sizes.xs,
    color: Colors.gray,
    textAlign: 'center',
  },
  quickActionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginHorizontal: 6,
    shadowColor: Colors.secondary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionText: {
    fontSize: Fonts.sizes.sm,
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.primary,
    fontWeight: '500',
  },
  recentBookingsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  stadiumOverviewSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateTitle: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '600',
    color: Colors.secondary,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.gray,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  addStadiumButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addStadiumButtonText: {
    fontSize: Fonts.sizes.md,
    fontWeight: '600',
    color: Colors.white,
  },
  stadiumSummary: {
    backgroundColor: Colors.lightGray,
    padding: 20,
    borderRadius: 12,
  },
  stadiumSummaryText: {
    fontSize: Fonts.sizes.md,
    color: Colors.secondary,
    marginBottom: 12,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 12,
    borderRadius: 8,
  },
  manageButtonText: {
    fontSize: Fonts.sizes.sm,
    fontWeight: '600',
    color: Colors.primary,
    marginRight: 8,
  },
  bookingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: Colors.secondary,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  bookingInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: Fonts.sizes.md,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 4,
  },
  bookingDate: {
    fontSize: Fonts.sizes.sm,
    color: Colors.gray,
    marginBottom: 2,
  },
  stadiumNameSmall: {
    fontSize: Fonts.sizes.xs,
    color: Colors.gray,
  },
  bookingRight: {
    alignItems: 'flex-end',
  },
  bookingPrice: {
    fontSize: Fonts.sizes.sm,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: 4,
  },
  bookingStatus: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  bookingStatusText: {
    fontSize: Fonts.sizes.xs,
    fontWeight: '600',
    color: Colors.white,
    textTransform: 'capitalize',
  },
  quickActions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  confirmQuickButton: {
    backgroundColor: Colors.success,
    padding: 6,
    borderRadius: 6,
    marginRight: 6,
  },
  cancelQuickButton: {
    backgroundColor: Colors.error,
    padding: 6,
    borderRadius: 6,
  },
});