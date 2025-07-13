import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

const StadiumCard = ({ stadium, onPress, onEdit }) => (
  <View style={styles.stadiumCard}>
    <View style={styles.stadiumHeader}>
      <View style={styles.stadiumInfo}>
        <Text style={styles.stadiumName}>{stadium.name}</Text>
        <Text style={styles.stadiumLocation}>{stadium.city}</Text>
        <View style={styles.stadiumMeta}>
          <Text style={styles.priceText}>{stadium.price_per_hour} MAD/hour</Text>
          <View style={[styles.statusBadge, stadium.is_active ? styles.activeBadge : styles.inactiveBadge]}>
            <Text style={styles.statusText}>{stadium.is_active ? 'Active' : 'Inactive'}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.editButton} onPress={onEdit}>
        <Ionicons name="create-outline" size={20} color={Colors.primary} />
      </TouchableOpacity>
    </View>
    
    <View style={styles.statsRow}>
      <View style={styles.statItem}>
        <Ionicons name="calendar-outline" size={16} color={Colors.gray} />
        <Text style={styles.statText}>{stadium.total_bookings || 0} bookings</Text>
      </View>
      <View style={styles.statItem}>
        <Ionicons name="star-outline" size={16} color={Colors.gray} />
        <Text style={styles.statText}>{stadium.rating || '0.0'} rating</Text>
      </View>
    </View>
  </View>
);

const BookingItem = ({ booking }) => {
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
      </View>
    </View>
  );
};

export default function OwnerDashboardScreen({ navigation }) {
  const { user } = useAuth();
  const [stadiums, setStadiums] = useState([]);
  const [recentBookings, setRecentBookings] = useState([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    activeStadiums: 0,
  });
  const [loading, setLoading] = useState(true);

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
            stadiums (name),
            profiles (full_name)
          `)
          .in('stadium_id', stadiumIds)
          .order('created_at', { ascending: false })
          .limit(10);

        if (bookingsError) throw bookingsError;
        setRecentBookings(bookingsData || []);

        // Calculate stats
        const confirmedBookings = bookingsData?.filter(b => b.status === 'confirmed') || [];
        const totalRevenue = confirmedBookings.reduce((sum, booking) => sum + (booking.total_price || 0), 0);
        const activeStadiums = stadiumsData?.filter(s => s.is_active).length || 0;

        setStats({
          totalRevenue,
          totalBookings: confirmedBookings.length,
          activeStadiums,
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      Alert.alert('Error', 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddStadium = () => {
    navigation.navigate('AddStadium');
  };

  const handleEditStadium = (stadium) => {
    navigation.navigate('EditStadium', { stadium });
  };

  const handleStadiumPress = (stadium) => {
    navigation.navigate('StadiumDetails', { stadium });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Stadium Dashboard</Text>
        <Text style={styles.headerSubtitle}>Manage your football stadiums</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsSection}>
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Ionicons name="card-outline" size={24} color={Colors.primary} />
              <Text style={styles.statValue}>{stats.totalRevenue} MAD</Text>
              <Text style={styles.statLabel}>Total Revenue</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="calendar-outline" size={24} color={Colors.success} />
              <Text style={styles.statValue}>{stats.totalBookings}</Text>
              <Text style={styles.statLabel}>Total Bookings</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="business-outline" size={24} color={Colors.accent} />
              <Text style={styles.statValue}>{stats.activeStadiums}</Text>
              <Text style={styles.statLabel}>Active Stadiums</Text>
            </View>
          </View>
        </View>

        <View style={styles.stadiumsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Stadiums ({stadiums.length})</Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddStadium}>
              <Ionicons name="add" size={20} color={Colors.white} />
              <Text style={styles.addButtonText}>Add Stadium</Text>
            </TouchableOpacity>
          </View>

          {stadiums.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="business-outline" size={60} color={Colors.gray} />
              <Text style={styles.emptyStateTitle}>No Stadiums Yet</Text>
              <Text style={styles.emptyStateText}>
                Add your first stadium to start receiving bookings
              </Text>
            </View>
          ) : (
            <FlatList
              data={stadiums}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <StadiumCard
                  stadium={item}
                  onPress={() => handleStadiumPress(item)}
                  onEdit={() => handleEditStadium(item)}
                />
              )}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        <View style={styles.bookingsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Bookings</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AllBookings')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentBookings.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={60} color={Colors.gray} />
              <Text style={styles.emptyStateTitle}>No Bookings Yet</Text>
              <Text style={styles.emptyStateText}>
                Bookings will appear here once customers start booking your stadiums
              </Text>
            </View>
          ) : (
            <FlatList
              data={recentBookings}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => <BookingItem booking={item} />}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="analytics-outline" size={20} color={Colors.primary} />
            <Text style={styles.actionButtonText}>View Analytics</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons name="settings-outline" size={20} color={Colors.primary} />
            <Text style={styles.actionButtonText}>Settings</Text>
          </TouchableOpacity>
        </View>
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
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  stadiumsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '600',
    color: Colors.secondary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    fontSize: Fonts.sizes.sm,
    fontWeight: '600',
    color: Colors.white,
    marginLeft: 4,
  },
  seeAllText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.primary,
    fontWeight: '500',
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
  },
  stadiumCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.secondary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  stadiumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stadiumInfo: {
    flex: 1,
  },
  stadiumName: {
    fontSize: Fonts.sizes.md,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 4,
  },
  stadiumLocation: {
    fontSize: Fonts.sizes.sm,
    color: Colors.gray,
    marginBottom: 8,
  },
  stadiumMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceText: {
    fontSize: Fonts.sizes.sm,
    fontWeight: '600',
    color: Colors.primary,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: Colors.success,
  },
  inactiveBadge: {
    backgroundColor: Colors.gray,
  },
  statusText: {
    fontSize: Fonts.sizes.xs,
    fontWeight: '600',
    color: Colors.white,
  },
  editButton: {
    backgroundColor: Colors.lightGray,
    padding: 8,
    borderRadius: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: Fonts.sizes.xs,
    color: Colors.gray,
    marginLeft: 4,
  },
  bookingsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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
  actionsSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGray,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
  },
  actionButtonText: {
    fontSize: Fonts.sizes.md,
    color: Colors.primary,
    marginLeft: 12,
    fontWeight: '500',
  },
});