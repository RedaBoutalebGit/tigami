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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import RoleGuard from '../components/RoleGuard';

const AdminDashboardScreen = ({ navigation }) => {
  const { user, userProfile } = useAuth();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStadiums: 0,
    totalBookings: 0,
    totalRevenue: 0,
    pendingBookings: 0,
    activeStadiums: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [users, setUsers] = useState([]);
  const [stadiums, setStadiums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTab, setSelectedTab] = useState('overview');

  const tabs = [
    { key: 'overview', label: 'Overview', icon: 'analytics-outline' },
    { key: 'users', label: 'Users', icon: 'people-outline' },
    { key: 'stadiums', label: 'Stadiums', icon: 'business-outline' },
    { key: 'bookings', label: 'Bookings', icon: 'calendar-outline' },
  ];

  const fetchAdminData = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch all users
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;
      setUsers(usersData || []);

      // Fetch all stadiums
      const { data: stadiumsData, error: stadiumsError } = await supabase
        .from('stadiums')
        .select(`
          *,
          profiles!stadiums_owner_id_fkey(full_name, role)
        `)
        .order('created_at', { ascending: false });

      if (stadiumsError) throw stadiumsError;
      setStadiums(stadiumsData || []);

      // Fetch all bookings
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select(`
          *,
          stadiums(name, city),
          profiles(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (bookingsError) throw bookingsError;
      setRecentActivity(bookingsData || []);

      // Calculate stats
      const totalRevenue = bookingsData
        ?.filter(b => b.status === 'confirmed')
        .reduce((sum, b) => sum + (b.total_price || 0), 0) || 0;

      const pendingBookings = bookingsData?.filter(b => b.status === 'pending').length || 0;
      const activeStadiums = stadiumsData?.filter(s => s.is_active).length || 0;

      setStats({
        totalUsers: usersData?.length || 0,
        totalStadiums: stadiumsData?.length || 0,
        totalBookings: bookingsData?.length || 0,
        totalRevenue,
        pendingBookings,
        activeStadiums
      });

    } catch (error) {
      console.error('Error fetching admin data:', error);
      Alert.alert('Error', 'Failed to load admin data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAdminData();
  };

  const handleUserRoleChange = async (userId, newRole) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      
      Alert.alert('Success', 'User role updated successfully');
      fetchAdminData();
    } catch (error) {
      console.error('Error updating user role:', error);
      Alert.alert('Error', 'Failed to update user role');
    }
  };

  const handleStadiumToggle = async (stadiumId, isActive) => {
    try {
      const { error } = await supabase
        .from('stadiums')
        .update({ is_active: !isActive })
        .eq('id', stadiumId);

      if (error) throw error;
      
      Alert.alert('Success', `Stadium ${!isActive ? 'activated' : 'deactivated'} successfully`);
      fetchAdminData();
    } catch (error) {
      console.error('Error updating stadium status:', error);
      Alert.alert('Error', 'Failed to update stadium status');
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return '#FF9800';
      case 'stadium_owner': return '#2196F3';
      case 'player': return '#4CAF50';
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

  const renderUserItem = ({ item }) => (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.full_name || 'No Name'}</Text>
        <Text style={styles.userEmail}>{item.id}</Text>
        <Text style={styles.userDate}>Joined {formatDate(item.created_at)}</Text>
      </View>
      <View style={styles.userActions}>
        <View style={[styles.roleBadge, { backgroundColor: getRoleColor(item.role) }]}>
          <Text style={styles.roleText}>{item.role?.toUpperCase() || 'PLAYER'}</Text>
        </View>
        <TouchableOpacity
          style={styles.changeRoleButton}
          onPress={() => {
            Alert.alert(
              'Change Role',
              `Change role for ${item.full_name}?`,
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Admin', onPress: () => handleUserRoleChange(item.id, 'admin') },
                { text: 'Owner', onPress: () => handleUserRoleChange(item.id, 'stadium_owner') },
                { text: 'Player', onPress: () => handleUserRoleChange(item.id, 'player') },
              ]
            );
          }}
        >
          <Ionicons name="create-outline" size={16} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStadiumItem = ({ item }) => (
    <View style={styles.stadiumCard}>
      <View style={styles.stadiumInfo}>
        <Text style={styles.stadiumName}>{item.name}</Text>
        <Text style={styles.stadiumLocation}>{item.city}</Text>
        <Text style={styles.stadiumOwner}>Owner: {item.profiles?.full_name || 'Unknown'}</Text>
        <Text style={styles.stadiumPrice}>${item.price_per_hour}/hour</Text>
      </View>
      <View style={styles.stadiumActions}>
        <TouchableOpacity
          style={[
            styles.statusButton,
            { backgroundColor: item.is_active ? '#4CAF50' : '#F44336' }
          ]}
          onPress={() => handleStadiumToggle(item.id, item.is_active)}
        >
          <Text style={styles.statusButtonText}>
            {item.is_active ? 'Active' : 'Inactive'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderActivityItem = ({ item }) => (
    <View style={styles.activityCard}>
      <View style={styles.activityInfo}>
        <Text style={styles.activityTitle}>
          {item.profiles?.full_name} booked {item.stadiums?.name}
        </Text>
        <Text style={styles.activityDate}>{formatDate(item.created_at)}</Text>
        <Text style={styles.activityPrice}>${item.total_price}</Text>
      </View>
      <View style={[
        styles.activityStatus,
        { backgroundColor: item.status === 'confirmed' ? '#4CAF50' : 
          item.status === 'pending' ? '#FF9800' : '#F44336' }
      ]}>
        <Text style={styles.activityStatusText}>{item.status.toUpperCase()}</Text>
      </View>
    </View>
  );

  const renderOverview = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="people-outline" size={24} color="#2196F3" />
          <Text style={styles.statValue}>{stats.totalUsers}</Text>
          <Text style={styles.statLabel}>Total Users</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="business-outline" size={24} color="#4CAF50" />
          <Text style={styles.statValue}>{stats.totalStadiums}</Text>
          <Text style={styles.statLabel}>Total Stadiums</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="calendar-outline" size={24} color="#FF9800" />
          <Text style={styles.statValue}>{stats.totalBookings}</Text>
          <Text style={styles.statLabel}>Total Bookings</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="cash-outline" size={24} color="#9C27B0" />
          <Text style={styles.statValue}>${stats.totalRevenue}</Text>
          <Text style={styles.statLabel}>Total Revenue</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="time-outline" size={24} color="#F44336" />
          <Text style={styles.statValue}>{stats.pendingBookings}</Text>
          <Text style={styles.statLabel}>Pending Bookings</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="checkmark-circle-outline" size={24} color="#4CAF50" />
          <Text style={styles.statValue}>{stats.activeStadiums}</Text>
          <Text style={styles.statLabel}>Active Stadiums</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Recent Activity</Text>
      <FlatList
        data={recentActivity.slice(0, 10)}
        keyExtractor={(item) => item.id}
        renderItem={renderActivityItem}
        scrollEnabled={false}
      />
    </ScrollView>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1a5f1a" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <RoleGuard allowedRoles={['admin']}>
      <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Admin Dashboard</Text>
        <Text style={styles.headerSubtitle}>System Administration</Text>
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
      
      {selectedTab === 'users' && (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          renderItem={renderUserItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
        />
      )}
      
      {selectedTab === 'stadiums' && (
        <FlatList
          data={stadiums}
          keyExtractor={(item) => item.id}
          renderItem={renderStadiumItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
        />
      )}
      
      {selectedTab === 'bookings' && (
        <FlatList
          data={recentActivity}
          keyExtractor={(item) => item.id}
          renderItem={renderActivityItem}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContainer}
        />
      )}
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
  listContainer: {
    padding: 16,
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
    fontSize: 20,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  userDate: {
    fontSize: 12,
    color: '#999',
  },
  userActions: {
    alignItems: 'flex-end',
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  roleText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  changeRoleButton: {
    padding: 4,
  },
  stadiumCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    marginBottom: 2,
  },
  stadiumOwner: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  stadiumPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a5f1a',
  },
  stadiumActions: {
    alignItems: 'flex-end',
  },
  statusButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  activityCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  activityDate: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  activityPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a5f1a',
  },
  activityStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activityStatusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
});

export default AdminDashboardScreen;