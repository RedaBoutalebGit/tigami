import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  RefreshControl,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

const BookingCard = ({ booking, onPress }) => {
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
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <TouchableOpacity style={styles.bookingCard} onPress={onPress}>
      <View style={styles.bookingHeader}>
        <View style={styles.stadiumInfo}>
          <Text style={styles.stadiumName}>
            {booking.stadiums?.name || 'Unknown Stadium'}
          </Text>
          <View style={styles.locationContainer}>
            <Ionicons name="location-outline" size={14} color={Colors.gray} />
            <Text style={styles.locationText}>
              {booking.stadiums?.city || 'Unknown Location'}
            </Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(booking.status) }]}>
          <Text style={styles.statusText}>{booking.status}</Text>
        </View>
      </View>
      
      <View style={styles.bookingDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="calendar-outline" size={16} color={Colors.gray} />
          <Text style={styles.detailText}>{formatDate(booking.booking_date)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color={Colors.gray} />
          <Text style={styles.detailText}>
            {booking.start_time?.slice(0, 5)} - {booking.end_time?.slice(0, 5)}
          </Text>
        </View>
        <View style={styles.detailRow}>
          <Ionicons name="card-outline" size={16} color={Colors.gray} />
          <Text style={styles.detailText}>{booking.total_price} MAD</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const StatCard = ({ icon, title, value, color = Colors.primary }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIcon, { backgroundColor: color }]}>
      <Ionicons name={icon} size={24} color={Colors.white} />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
  </View>
);

export default function ProfileScreen({ navigation }) {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    totalBookings: 0,
    totalSpent: 0,
    favoriteStadium: 'None',
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      
      // Fetch user profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching profile:', profileError);
      } else {
        setProfile(profileData);
      }

      // Fetch user bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          stadiums (
            name,
            city,
            photos
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (bookingsError) {
        console.error('Error fetching bookings:', bookingsError);
      } else {
        setBookings(bookingsData || []);
        calculateStats(bookingsData || []);
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (bookingsData) => {
    const confirmedBookings = bookingsData.filter(b => b.status === 'confirmed');
    const totalSpent = confirmedBookings.reduce((sum, booking) => sum + (booking.total_price || 0), 0);
    
    // Find most frequently booked stadium
    const stadiumCounts = {};
    confirmedBookings.forEach(booking => {
      const stadiumName = booking.stadiums?.name;
      if (stadiumName) {
        stadiumCounts[stadiumName] = (stadiumCounts[stadiumName] || 0) + 1;
      }
    });
    
    const favoriteStadium = Object.keys(stadiumCounts).length > 0
      ? Object.keys(stadiumCounts).reduce((a, b) => stadiumCounts[a] > stadiumCounts[b] ? a : b)
      : 'None';

    setStats({
      totalBookings: confirmedBookings.length,
      totalSpent,
      favoriteStadium,
    });
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchProfileData();
    setRefreshing(false);
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile', { profile });
  };

  const handleBookingPress = (booking) => {
    navigation.navigate('BookingDetails', { booking });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.profileSection}>
            <View style={styles.avatarContainer}>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={40} color={Colors.gray} />
                </View>
              )}
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>
                {profile?.full_name || user?.user_metadata?.full_name || 'User'}
              </Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
              {profile?.position && (
                <View style={styles.positionBadge}>
                  <Ionicons name="football-outline" size={12} color={Colors.primary} />
                  <Text style={styles.positionText}>{profile.position}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
              <Ionicons name="create-outline" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>Your Stats</Text>
          <View style={styles.statsContainer}>
            <StatCard
              icon="calendar-outline"
              title="Total Bookings"
              value={stats.totalBookings}
              color={Colors.primary}
            />
            <StatCard
              icon="card-outline"
              title="Total Spent"
              value={`${stats.totalSpent} MAD`}
              color={Colors.accent}
            />
            <StatCard
              icon="star-outline"
              title="Favorite Stadium"
              value={stats.favoriteStadium.length > 15 
                ? `${stats.favoriteStadium.slice(0, 15)}...` 
                : stats.favoriteStadium}
              color={Colors.success}
            />
          </View>
        </View>

        <View style={styles.bookingsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Bookings</Text>
            <TouchableOpacity onPress={() => navigation.navigate('BookingHistory')}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          {bookings.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={60} color={Colors.gray} />
              <Text style={styles.emptyStateTitle}>No Bookings Yet</Text>
              <Text style={styles.emptyStateText}>
                Start booking stadiums to see your history here
              </Text>
              <TouchableOpacity
                style={styles.bookNowButton}
                onPress={() => navigation.navigate('Home')}
              >
                <Text style={styles.bookNowButtonText}>Book Now</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={bookings}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <BookingCard booking={item} onPress={() => handleBookingPress(item)} />
              )}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="notifications-outline" size={20} color={Colors.gray} />
            <Text style={styles.settingText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.gray} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="help-circle-outline" size={20} color={Colors.gray} />
            <Text style={styles.settingText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.gray} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <Ionicons name="document-text-outline" size={20} color={Colors.gray} />
            <Text style={styles.settingText}>Terms & Privacy</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.gray} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={20} color={Colors.error} />
            <Text style={[styles.settingText, { color: Colors.error }]}>Sign Out</Text>
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
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 30,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: Fonts.sizes.xl,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: Fonts.sizes.sm,
    color: Colors.white,
    opacity: 0.8,
    marginBottom: 8,
  },
  positionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  positionText: {
    fontSize: Fonts.sizes.xs,
    color: Colors.primary,
    marginLeft: 4,
    fontWeight: '500',
  },
  editButton: {
    backgroundColor: Colors.white,
    padding: 8,
    borderRadius: 20,
  },
  statsSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 16,
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
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: Fonts.sizes.xs,
    color: Colors.gray,
    textAlign: 'center',
  },
  bookingsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
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
  bookNowButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  bookNowButtonText: {
    fontSize: Fonts.sizes.sm,
    fontWeight: '600',
    color: Colors.white,
  },
  bookingCard: {
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
  bookingHeader: {
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
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.gray,
    marginLeft: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: Fonts.sizes.xs,
    fontWeight: '600',
    color: Colors.white,
    textTransform: 'capitalize',
  },
  bookingDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailText: {
    fontSize: Fonts.sizes.xs,
    color: Colors.gray,
    marginLeft: 4,
  },
  settingsSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  settingText: {
    flex: 1,
    fontSize: Fonts.sizes.md,
    color: Colors.secondary,
    marginLeft: 12,
  },
});