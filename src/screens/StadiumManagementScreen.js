import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { bookingService } from '../services/bookingService';
import { supabase } from '../services/supabase';
import RoleGuard from '../components/RoleGuard';

const StadiumManagementScreen = ({ navigation: navProp }) => {
  const { user, userProfile } = useAuth();
  const navigation = useNavigation();
  const [stadiums, setStadiums] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    pendingBookings: 0,
    confirmedBookings: 0,
    totalStadiums: 0,
    pendingRevenue: 0,
    totalBookings: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const tabs = [
    { key: 'overview', label: 'Overview', icon: 'analytics-outline' },
    { key: 'stadiums', label: 'Stadiums', icon: 'business-outline' },
    { key: 'bookings', label: 'Bookings', icon: 'calendar-outline' },
  ];

  const fetchData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch stadiums
      const { data: stadiumsData, error: stadiumsError } = await supabase
        .from('stadiums')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (stadiumsError) throw stadiumsError;
      setStadiums(stadiumsData || []);

      // Fetch bookings and calculate real stats
      const bookingsResult = await bookingService.getOwnerBookings(user.id);
      if (bookingsResult.success) {
        const allBookings = bookingsResult.bookings;
        setBookings(allBookings);
        
        // Calculate stats from the bookings
        const pendingBookings = allBookings.filter(b => b.status === 'pending').length;
        const confirmedBookings = allBookings.filter(b => b.status === 'confirmed').length;
        const totalRevenue = allBookings
          .filter(b => b.status === 'confirmed')
          .reduce((sum, b) => sum + (b.total_price || 0), 0);
        const pendingRevenue = allBookings
          .filter(b => b.status === 'pending')
          .reduce((sum, b) => sum + (b.total_price || 0), 0);
        
        setStats({
          totalRevenue,
          pendingBookings,
          confirmedBookings,
          totalStadiums: stadiumsData?.length || 0,
          pendingRevenue,
          totalBookings: allBookings.length
        });
      }

    } catch (error) {
      console.error('Error fetching data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
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
            setActionLoading(true);
            const result = await bookingService.confirmBooking(booking.id);
            if (result.success) {
              Alert.alert('Success', 'Booking confirmed successfully');
              fetchData();
            } else {
              Alert.alert('Error', result.error || 'Failed to confirm booking');
            }
            setActionLoading(false);
          }
        }
      ]
    );
  };

  const handleCancelBooking = (booking) => {
    setSelectedBooking(booking);
    setModalVisible(true);
  };

  const confirmCancelBooking = async () => {
    if (!selectedBooking) return;

    setActionLoading(true);
    const result = await bookingService.cancelBooking(selectedBooking.id, 'Cancelled by stadium owner');
    
    if (result.success) {
      Alert.alert('Success', 'Booking cancelled successfully');
      setModalVisible(false);
      setSelectedBooking(null);
      fetchData();
    } else {
      Alert.alert('Error', result.error || 'Failed to cancel booking');
    }
    setActionLoading(false);
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

  const handleAddStadium = () => {
    console.log('Add Stadium button pressed');
    console.log('Navigation object:', navigation);
    try {
      navigation.navigate('AddStadium');
      console.log('Navigation successful');
    } catch (error) {
      console.error('Navigation error:', error);
      Alert.alert('Navigation Error', `Failed to open Add Stadium screen: ${error.message}`);
    }
  };

  const handleEditStadium = (stadium) => {
    navigation.navigate('AddStadium', { stadium });
  };

  const handleToggleStadium = async (stadium) => {
    Alert.alert(
      'Toggle Stadium Status',
      `${stadium.is_active ? 'Deactivate' : 'Activate'} ${stadium.name}?`,
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
              fetchData();
            } catch (error) {
              console.error('Error toggling stadium:', error);
              Alert.alert('Error', 'Failed to update stadium status');
            }
          }
        }
      ]
    );
  };

  const handleDeleteStadium = async (stadium) => {
    Alert.alert(
      'Delete Stadium',
      `Are you sure you want to delete ${stadium.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('stadiums')
                .delete()
                .eq('id', stadium.id)
                .eq('owner_id', user.id);

              if (error) throw error;
              Alert.alert('Success', 'Stadium deleted successfully');
              fetchData();
            } catch (error) {
              console.error('Error deleting stadium:', error);
              Alert.alert('Error', 'Failed to delete stadium');
            }
          }
        }
      ]
    );
  };

  const renderStadiumCard = ({ item }) => (
    <TouchableOpacity style={styles.stadiumCard}>
      <View style={styles.stadiumHeader}>
        <View style={styles.stadiumInfo}>
          <Text style={styles.stadiumName}>{item.name}</Text>
          <Text style={styles.stadiumLocation}>{item.city}</Text>
          <Text style={styles.stadiumPrice}>${item.price_per_hour}/hour</Text>
        </View>
        <View style={[
          styles.statusBadge,
          { backgroundColor: item.is_active ? '#4CAF50' : '#F44336' }
        ]}>
          <Text style={styles.statusText}>
            {item.is_active ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>
      <View style={styles.stadiumStats}>
        <Text style={styles.statText}>
          {item.total_bookings || 0} bookings • {item.rating || '0.0'} rating
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderBookingItem = ({ item }) => (
    <View style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <View style={styles.bookingInfo}>
          <Text style={styles.customerName}>{item.profiles?.full_name || 'Unknown Customer'}</Text>
          <Text style={styles.stadiumName}>{item.stadiums?.name}</Text>
          <Text style={styles.bookingDate}>
            {formatDate(item.booking_date)} • {formatTime(item.start_time)} - {formatTime(item.end_time)}
          </Text>
        </View>
        <View>
          <Text style={styles.bookingPrice}>${item.total_price}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>
      
      {item.status === 'pending' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.confirmButton}
            onPress={() => handleConfirmBooking(item)}
            disabled={actionLoading}
          >
            <Text style={styles.confirmButtonText}>Confirm</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => handleCancelBooking(item)}
            disabled={actionLoading}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderOverview = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Ionicons name="cash-outline" size={24} color="#4CAF50" />
          <Text style={styles.statValue}>{stats.totalRevenue} MAD</Text>
          <Text style={styles.statLabel}>Total Revenue</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="time-outline" size={24} color="#FF9800" />
          <Text style={styles.statValue}>{stats.pendingBookings}</Text>
          <Text style={styles.statLabel}>Pending Bookings</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle-outline" size={24} color="#4CAF50" />
          <Text style={styles.statValue}>{stats.confirmedBookings}</Text>
          <Text style={styles.statLabel}>Confirmed</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="business-outline" size={24} color="#2196F3" />
          <Text style={styles.statValue}>{stats.totalStadiums}</Text>
          <Text style={styles.statLabel}>My Stadiums</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="calculator-outline" size={24} color="#9C27B0" />
          <Text style={styles.statValue}>{stats.pendingRevenue} MAD</Text>
          <Text style={styles.statLabel}>Pending Revenue</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="calendar-outline" size={24} color="#607D8B" />
          <Text style={styles.statValue}>{stats.totalBookings}</Text>
          <Text style={styles.statLabel}>Total Bookings</Text>
        </View>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => {
            console.log('Quick action - View All Bookings pressed');
            try {
              navigation.navigate('AllBookings');
              console.log('Quick action navigation successful');
            } catch (error) {
              console.error('Quick action navigation error:', error);
              Alert.alert('Navigation Error', `Failed to open All Bookings: ${error.message}`);
            }
          }}
        >
          <Ionicons name="calendar-outline" size={32} color="#2196F3" />
          <Text style={styles.actionTitle}>View All Bookings</Text>
          <Text style={styles.actionSubtitle}>Manage all stadium bookings</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionCard}
          onPress={handleAddStadium}
        >
          <Ionicons name="add-circle-outline" size={32} color="#4CAF50" />
          <Text style={styles.actionTitle}>Add Stadium</Text>
          <Text style={styles.actionSubtitle}>Register a new stadium</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.recentBookings}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Bookings</Text>
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => {
              console.log('View All Bookings pressed');
              try {
                navigation.navigate('AllBookings');
                console.log('Navigation to AllBookings successful');
              } catch (error) {
                console.error('AllBookings navigation error:', error);
                Alert.alert('Navigation Error', `Failed to open All Bookings: ${error.message}`);
              }
            }}
          >
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        {bookings.slice(0, 5).map((booking) => (
          <View key={booking.id}>
            {renderBookingItem({ item: booking })}
          </View>
        ))}
        {bookings.length === 0 && (
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>No bookings yet</Text>
            <Text style={styles.emptySubtext}>Bookings will appear here once customers book your stadiums</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );

  const renderStadiums = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>My Stadiums ({stadiums.length})</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.addButtonText}>Add Stadium</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={stadiums}
        keyExtractor={(item) => item.id}
        renderItem={renderStadiumCard}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="business-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No stadiums found</Text>
            <Text style={styles.emptySubtext}>Add your first stadium to start receiving bookings</Text>
          </View>
        }
      />
    </View>
  );

  const renderBookings = () => (
    <View style={styles.tabContent}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>All Bookings ({bookings.length})</Text>
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={() => navigation.navigate('AllBookings')}
        >
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={bookings.slice(0, 20)}
        keyExtractor={(item) => item.id}
        renderItem={renderBookingItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="calendar-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No bookings found</Text>
          </View>
        }
      />
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Stadium Management</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a5f1a" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <RoleGuard allowedRoles={['stadium_owner', 'admin']}>
      <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Stadium Management</Text>
        <Text style={styles.headerSubtitle}>Welcome, {userProfile?.full_name}</Text>
      </View>

      <View style={styles.tabContainer}>
        <FlatList
          horizontal
          data={tabs}
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.key}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.tabButton,
                selectedTab === item.key && styles.activeTabButton
              ]}
              onPress={() => setSelectedTab(item.key)}
            >
              <Ionicons 
                name={item.icon} 
                size={20} 
                color={selectedTab === item.key ? '#fff' : '#666'} 
              />
              <Text style={[
                styles.tabButtonText,
                selectedTab === item.key && styles.activeTabButtonText
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {selectedTab === 'overview' && renderOverview()}
      {selectedTab === 'stadiums' && renderStadiums()}
      {selectedTab === 'bookings' && renderBookings()}

      {/* Cancel Booking Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cancel Booking</Text>
            <Text style={styles.modalSubtitle}>
              Cancel booking for {selectedBooking?.profiles?.full_name}?
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalCancelButton}
                onPress={() => {
                  setModalVisible(false);
                  setSelectedBooking(null);
                }}
              >
                <Text style={styles.modalCancelButtonText}>No</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalConfirmButton}
                onPress={confirmCancelBooking}
                disabled={actionLoading}
              >
                {actionLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalConfirmButtonText}>Yes, Cancel</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </SafeAreaView>
    </RoleGuard>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#1a5f1a',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#fff',
    fontSize: 14,
    opacity: 0.8,
    marginTop: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  tabContent: {
    flex: 1,
    padding: 16,
  },
  statsContainer: {
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
    width: '32%',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    lineHeight: 12,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    width: '48%',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    textAlign: 'center',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a5f1a',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  viewAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  viewAllText: {
    color: '#1a5f1a',
    fontSize: 14,
    fontWeight: '500',
  },
  stadiumCard: {
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
  stadiumHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  stadiumInfo: {
    flex: 1,
  },
  stadiumName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  stadiumLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  stadiumPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a5f1a',
  },
  stadiumStats: {
    marginTop: 8,
  },
  statText: {
    fontSize: 12,
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
    marginBottom: 2,
  },
  bookingDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  bookingPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a5f1a',
    marginBottom: 4,
    textAlign: 'right',
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
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F44336',
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  recentBookings: {
    marginTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    fontWeight: '500',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    marginRight: 8,
    alignItems: 'center',
  },
  modalCancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  modalConfirmButton: {
    flex: 1,
    backgroundColor: '#F44336',
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 8,
    alignItems: 'center',
  },
  modalConfirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default StadiumManagementScreen;