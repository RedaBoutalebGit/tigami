import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import { bookingService } from '../services/bookingService';

const StadiumDetailsScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const { stadium } = route.params;
  const [selectedTab, setSelectedTab] = useState('overview');
  const [stadiumBookings, setStadiumBookings] = useState([]);
  const [stadiumStats, setStadiumStats] = useState({
    totalBookings: 0,
    revenue: 0,
    rating: 0,
    pendingBookings: 0,
    confirmedBookings: 0
  });
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const tabs = [
    { key: 'overview', label: 'Overview', icon: 'information-circle-outline' },
    { key: 'bookings', label: 'Bookings', icon: 'calendar-outline' },
    { key: 'analytics', label: 'Analytics', icon: 'analytics-outline' },
    { key: 'settings', label: 'Settings', icon: 'settings-outline' }
  ];

  useEffect(() => {
    fetchStadiumData();
  }, []);

  const fetchStadiumData = async () => {
    if (!stadium?.id) return;

    try {
      setRefreshing(true);
      
      // Fetch stadium bookings using our booking service
      const bookingsResult = await bookingService.getOwnerBookings(user.id, { stadium_id: stadium.id });
      
      if (bookingsResult.success) {
        const allBookings = bookingsResult.bookings.filter(b => b.stadium_id === stadium.id);
        setStadiumBookings(allBookings);

        // Calculate stats
        const confirmedBookings = allBookings.filter(b => b.status === 'confirmed');
        const pendingBookings = allBookings.filter(b => b.status === 'pending');
        const revenue = confirmedBookings.reduce((sum, b) => sum + (b.total_price || 0), 0);

        setStadiumStats({
          totalBookings: allBookings.length,
          revenue,
          rating: stadium.rating || 0,
          pendingBookings: pendingBookings.length,
          confirmedBookings: confirmedBookings.length
        });
      }
    } catch (error) {
      console.error('Error fetching stadium data:', error);
      Alert.alert('Error', 'Failed to load stadium data');
    } finally {
      setRefreshing(false);
    }
  };

  const handleBookingAction = async (bookingId, action) => {
    setLoading(true);
    try {
      let result;
      if (action === 'confirm') {
        result = await bookingService.confirmBooking(bookingId);
      } else {
        result = await bookingService.cancelBooking(bookingId, 'Cancelled by stadium owner');
      }

      if (result.success) {
        Alert.alert('Success', `Booking ${action === 'confirm' ? 'confirmed' : 'cancelled'} successfully`);
        fetchStadiumData(); // Refresh data
      } else {
        Alert.alert('Error', result.error || 'Failed to update booking');
      }
    } catch (error) {
      console.error('Error updating booking:', error);
      Alert.alert('Error', 'Failed to update booking');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStadium = async () => {
    Alert.alert(
      'Toggle Stadium Status',
      `${stadium.is_active ? 'Deactivate' : 'Activate'} this stadium?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: stadium.is_active ? 'Deactivate' : 'Activate',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('stadiums')
                .update({ is_active: !stadium.is_active })
                .eq('id', stadium.id)
                .eq('owner_id', user.id);

              if (error) throw error;
              Alert.alert('Success', `Stadium ${stadium.is_active ? 'deactivated' : 'activated'} successfully`);
              navigation.goBack();
            } catch (error) {
              console.error('Error toggling stadium:', error);
              Alert.alert('Error', 'Failed to update stadium status');
            }
          }
        }
      ]
    );
  };

  const handleEditStadium = () => {
    navigation.navigate('AddStadium', { stadium });
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
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const renderOverview = () => (
    <View style={styles.overviewContainer}>
      {/* Stadium Info Card */}
      <View style={styles.stadiumInfoCard}>
        <View style={styles.stadiumHeader}>
          <View style={styles.stadiumMainInfo}>
            <Text style={styles.stadiumName}>{stadium.name}</Text>
            <Text style={styles.stadiumLocation}>{stadium.city}</Text>
            <Text style={styles.stadiumPrice}>{stadium.price_per_hour} MAD/hour</Text>
          </View>
          <View style={[
            styles.statusBadge,
            { backgroundColor: stadium.is_active ? '#4CAF50' : '#F44336' }
          ]}>
            <Text style={styles.statusText}>
              {stadium.is_active ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
        
        <Text style={styles.stadiumDescription}>{stadium.description}</Text>
        
        <View style={styles.amenitiesContainer}>
          <Text style={styles.amenitiesTitle}>Amenities</Text>
          <View style={styles.amenitiesGrid}>
            {stadium.has_parking && (
              <View style={styles.amenityItem}>
                <Ionicons name="car-outline" size={16} color="#4CAF50" />
                <Text style={styles.amenityText}>Parking</Text>
              </View>
            )}
            {stadium.has_changing_rooms && (
              <View style={styles.amenityItem}>
                <Ionicons name="shirt-outline" size={16} color="#4CAF50" />
                <Text style={styles.amenityText}>Changing Rooms</Text>
              </View>
            )}
            {stadium.has_lighting && (
              <View style={styles.amenityItem}>
                <Ionicons name="bulb-outline" size={16} color="#4CAF50" />
                <Text style={styles.amenityText}>Lighting</Text>
              </View>
            )}
            {stadium.has_showers && (
              <View style={styles.amenityItem}>
                <Ionicons name="water-outline" size={16} color="#4CAF50" />
                <Text style={styles.amenityText}>Showers</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.editButton} onPress={handleEditStadium}>
            <Ionicons name="create-outline" size={20} color="#fff" />
            <Text style={styles.editButtonText}>Edit Stadium</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.toggleButton, { backgroundColor: stadium.is_active ? '#FF9800' : '#4CAF50' }]}
            onPress={handleToggleStadium}
          >
            <Ionicons 
              name={stadium.is_active ? "pause-outline" : "play-outline"} 
              size={20} 
              color="#fff" 
            />
            <Text style={styles.toggleButtonText}>
              {stadium.is_active ? 'Deactivate' : 'Activate'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderBookings = () => (
    <View style={styles.bookingsContainer}>
      <View style={styles.bookingsHeader}>
        <Text style={styles.sectionTitle}>Stadium Bookings</Text>
        <Text style={styles.bookingsCount}>{stadiumBookings.length} total</Text>
      </View>

      <FlatList
        data={stadiumBookings}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.bookingCard}>
            <View style={styles.bookingHeader}>
              <View style={styles.bookingInfo}>
                <Text style={styles.customerName}>{item.profiles?.full_name || 'Unknown Customer'}</Text>
                <Text style={styles.bookingDate}>
                  {formatDate(item.booking_date)} • {formatTime(item.start_time)} - {formatTime(item.end_time)}
                </Text>
                <Text style={styles.bookingPrice}>{item.total_price} MAD</Text>
              </View>
              <View style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(item.status) }
              ]}>
                <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
              </View>
            </View>
            
            {item.status === 'pending' && (
              <View style={styles.bookingActions}>
                <TouchableOpacity 
                  style={styles.confirmBtn}
                  onPress={() => handleBookingAction(item.id, 'confirm')}
                  disabled={loading}
                >
                  <Text style={styles.confirmBtnText}>Confirm</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.cancelBtn}
                  onPress={() => handleBookingAction(item.id, 'cancel')}
                  disabled={loading}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateTitle}>No Bookings Yet</Text>
            <Text style={styles.emptyStateText}>Bookings will appear here when customers book this stadium</Text>
          </View>
        }
        refreshing={refreshing}
        onRefresh={fetchStadiumData}
      />
    </View>
  );

  const renderAnalytics = () => (
    <View style={styles.analyticsContainer}>
      <Text style={styles.sectionTitle}>Stadium Analytics</Text>
      
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="calendar-outline" size={24} color="#2196F3" />
          <Text style={styles.statValue}>{stadiumStats.totalBookings}</Text>
          <Text style={styles.statLabel}>Total Bookings</Text>
        </View>
        
        <View style={styles.statCard}>
          <Ionicons name="cash-outline" size={24} color="#4CAF50" />
          <Text style={styles.statValue}>{stadiumStats.revenue} MAD</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
        
        <View style={styles.statCard}>
          <Ionicons name="star-outline" size={24} color="#FF9800" />
          <Text style={styles.statValue}>{stadiumStats.rating.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
        
        <View style={styles.statCard}>
          <Ionicons name="time-outline" size={24} color="#9C27B0" />
          <Text style={styles.statValue}>{stadiumStats.pendingBookings}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      <View style={styles.chartPlaceholder}>
        <Ionicons name="bar-chart-outline" size={48} color="#ccc" />
        <Text style={styles.chartText}>Booking Trends</Text>
        <Text style={styles.chartSubtext}>Revenue and booking patterns over time</Text>
      </View>
    </View>
  );

  const renderSettings = () => (
    <View style={styles.settingsContainer}>
      <Text style={styles.sectionTitle}>Stadium Settings</Text>
      
      <View style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Stadium Status</Text>
          <Text style={styles.settingDesc}>Control stadium availability</Text>
        </View>
        <Switch
          value={stadium.is_active}
          onValueChange={handleToggleStadium}
          trackColor={{ false: '#ccc', true: '#1a5f1a' }}
        />
      </View>

      <TouchableOpacity style={styles.settingItem} onPress={handleEditStadium}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Edit Stadium Details</Text>
          <Text style={styles.settingDesc}>Update name, price, amenities</Text>
        </View>
        <Ionicons name="chevron-forward-outline" size={20} color="#666" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Pricing Rules</Text>
          <Text style={styles.settingDesc}>Set dynamic pricing and discounts</Text>
        </View>
        <Ionicons name="chevron-forward-outline" size={20} color="#666" />
      </TouchableOpacity>

      <TouchableOpacity style={styles.settingItem}>
        <View style={styles.settingInfo}>
          <Text style={styles.settingTitle}>Availability Schedule</Text>
          <Text style={styles.settingDesc}>Manage operating hours</Text>
        </View>
        <Ionicons name="chevron-forward-outline" size={20} color="#666" />
      </TouchableOpacity>
    </View>
  );

  const renderTabContent = () => {
    switch (selectedTab) {
      case 'overview':
        return renderOverview();
      case 'bookings':
        return renderBookings();
      case 'analytics':
        return renderAnalytics();
      case 'settings':
        return renderSettings();
      default:
        return renderOverview();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{stadium.name}</Text>
        <TouchableOpacity onPress={handleEditStadium}>
          <Ionicons name="create-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabButton,
                selectedTab === tab.key && styles.activeTabButton
              ]}
              onPress={() => setSelectedTab(tab.key)}
            >
              <Ionicons 
                name={tab.icon} 
                size={16} 
                color={selectedTab === tab.key ? '#fff' : '#666'} 
              />
              <Text style={[
                styles.tabButtonText,
                selectedTab === tab.key && styles.activeTabButtonText
              ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.content}>
        {renderTabContent()}
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  tabContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  activeTabButton: {
    backgroundColor: '#1a5f1a',
  },
  tabButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
    marginLeft: 6,
  },
  activeTabButtonText: {
    color: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  overviewContainer: {
    flex: 1,
  },
  stadiumInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  stadiumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stadiumMainInfo: {
    flex: 1,
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
    marginBottom: 8,
  },
  stadiumPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a5f1a',
  },
  stadiumDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 16,
  },
  amenitiesContainer: {
    marginBottom: 16,
  },
  amenitiesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 8,
  },
  amenityText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  editButton: {
    flex: 1,
    backgroundColor: '#2196F3',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  bookingsContainer: {
    flex: 1,
  },
  bookingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  bookingsCount: {
    fontSize: 14,
    color: '#666',
  },
  bookingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bookingInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  bookingDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  bookingPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a5f1a',
  },
  bookingActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
    alignItems: 'center',
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F44336',
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  analyticsContainer: {
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '48%',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  chartPlaceholder: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  chartText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  chartSubtext: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  settingsContainer: {
    flex: 1,
  },
  settingItem: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  settingDesc: {
    fontSize: 12,
    color: '#666',
  },
});

export default StadiumDetailsScreen;