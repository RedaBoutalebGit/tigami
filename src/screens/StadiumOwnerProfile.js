import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';
import RoleGuard from '../components/RoleGuard';

const SettingItem = ({ icon, title, subtitle, onPress, rightComponent, showArrow = true }) => (
  <TouchableOpacity style={styles.settingItem} onPress={onPress}>
    <View style={styles.settingLeft}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={20} color={Colors.primary} />
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
    </View>
    <View style={styles.settingRight}>
      {rightComponent}
      {showArrow && !rightComponent && (
        <Ionicons name="chevron-forward" size={20} color={Colors.gray} />
      )}
    </View>
  </TouchableOpacity>
);

export default function StadiumOwnerProfile() {
  const { user, userProfile, signOut } = useAuth();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [stats, setStats] = useState({
    totalStadiums: 0,
    totalBookings: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    if (user) {
      fetchOwnerStats();
    }
  }, [user]);

  const fetchOwnerStats = async () => {
    try {
      // Fetch stadium count
      const { data: stadiums, error: stadiumsError } = await supabase
        .from('stadiums')
        .select('id')
        .eq('owner_id', user.id);

      if (stadiumsError) throw stadiumsError;

      if (stadiums && stadiums.length > 0) {
        const stadiumIds = stadiums.map(s => s.id);

        // Fetch bookings and revenue
        const { data: bookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('total_price, status')
          .in('stadium_id', stadiumIds);

        if (bookingsError) throw bookingsError;

        const totalBookings = bookings?.length || 0;
        const totalRevenue = bookings
          ?.filter(b => b.status === 'confirmed')
          ?.reduce((sum, b) => sum + (b.total_price || 0), 0) || 0;

        setStats({
          totalStadiums: stadiums.length,
          totalBookings,
          totalRevenue,
        });
      }
    } catch (error) {
      console.error('Error fetching owner stats:', error);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (error) {
              console.error('Error signing out:', error);
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your stadiums and bookings will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Account',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Final Confirmation',
              'Are you absolutely sure? This will permanently delete your account and all associated data.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Forever',
                  style: 'destructive',
                  onPress: async () => {
                    // Here you would implement account deletion logic
                    Alert.alert('Feature Coming Soon', 'Account deletion will be available in a future update.');
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <RoleGuard allowedRoles={['stadium_owner']}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile & Settings</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Profile Section */}
          <View style={styles.profileSection}>
            <View style={styles.profileAvatar}>
              <Ionicons name="person" size={40} color={Colors.white} />
            </View>
            <Text style={styles.profileName}>{userProfile?.full_name || 'Stadium Owner'}</Text>
            <Text style={styles.profileEmail}>{user?.email}</Text>
            <Text style={styles.profileRole}>Stadium Owner</Text>
          </View>

          {/* Stats Section */}
          <View style={styles.statsSection}>
            <Text style={styles.sectionTitle}>Your Statistics</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.totalStadiums}</Text>
                <Text style={styles.statLabel}>Stadiums</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.totalBookings}</Text>
                <Text style={styles.statLabel}>Total Bookings</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.totalRevenue} MAD</Text>
                <Text style={styles.statLabel}>Revenue</Text>
              </View>
            </View>
          </View>

          {/* Account Settings */}
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Account Settings</Text>
            
            <SettingItem
              icon="person-circle-outline"
              title="Edit Profile"
              subtitle="Update your personal information"
              onPress={() => Alert.alert('Coming Soon', 'Profile editing will be available soon')}
            />

            <SettingItem
              icon="card-outline"
              title="Payment Methods"
              subtitle="Manage your payment and payout methods"
              onPress={() => Alert.alert('Coming Soon', 'Payment methods will be available soon')}
            />

            <SettingItem
              icon="shield-checkmark-outline"
              title="Privacy & Security"
              subtitle="Manage your privacy settings"
              onPress={() => Alert.alert('Coming Soon', 'Privacy settings will be available soon')}
            />
          </View>

          {/* Notification Settings */}
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            
            <SettingItem
              icon="notifications-outline"
              title="Push Notifications"
              subtitle="Get notified about new bookings and updates"
              rightComponent={
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  trackColor={{ false: Colors.lightGray, true: Colors.primary }}
                  thumbColor={notificationsEnabled ? Colors.white : Colors.gray}
                />
              }
              showArrow={false}
              onPress={() => setNotificationsEnabled(!notificationsEnabled)}
            />

            <SettingItem
              icon="mail-outline"
              title="Email Notifications"
              subtitle="Receive booking updates via email"
              rightComponent={
                <Switch
                  value={emailNotifications}
                  onValueChange={setEmailNotifications}
                  trackColor={{ false: Colors.lightGray, true: Colors.primary }}
                  thumbColor={emailNotifications ? Colors.white : Colors.gray}
                />
              }
              showArrow={false}
              onPress={() => setEmailNotifications(!emailNotifications)}
            />
          </View>

          {/* Business Settings */}
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Business</Text>
            
            <SettingItem
              icon="analytics-outline"
              title="Analytics & Reports"
              subtitle="View detailed business analytics"
              onPress={() => Alert.alert('Coming Soon', 'Analytics will be available soon')}
            />

            <SettingItem
              icon="time-outline"
              title="Operating Hours"
              subtitle="Set your default operating schedule"
              onPress={() => Alert.alert('Feature Available', 'Use the Schedule button on your stadiums to manage availability')}
            />

            <SettingItem
              icon="pricetag-outline"
              title="Pricing & Promotions"
              subtitle="Manage pricing and special offers"
              onPress={() => Alert.alert('Coming Soon', 'Pricing management will be available soon')}
            />
          </View>

          {/* Support & Legal */}
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Support & Legal</Text>
            
            <SettingItem
              icon="help-circle-outline"
              title="Help & Support"
              subtitle="Get help with your account"
              onPress={() => Alert.alert('Support', 'Contact support at support@tigami.com')}
            />

            <SettingItem
              icon="document-text-outline"
              title="Terms of Service"
              subtitle="Read our terms and conditions"
              onPress={() => Alert.alert('Coming Soon', 'Terms of service will be available soon')}
            />

            <SettingItem
              icon="shield-outline"
              title="Privacy Policy"
              subtitle="Learn about our privacy practices"
              onPress={() => Alert.alert('Coming Soon', 'Privacy policy will be available soon')}
            />
          </View>

          {/* Danger Zone */}
          <View style={styles.dangerSection}>
            <Text style={styles.sectionTitle}>Account Actions</Text>
            
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
              <Ionicons name="log-out-outline" size={20} color={Colors.white} />
              <Text style={styles.signOutButtonText}>Sign Out</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
              <Ionicons name="trash-outline" size={20} color={Colors.white} />
              <Text style={styles.deleteButtonText}>Delete Account</Text>
            </TouchableOpacity>
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
    fontSize: Fonts.sizes.xl,
    fontWeight: '700',
    color: Colors.white,
  },
  content: {
    flex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: Colors.lightGray,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  profileName: {
    fontSize: Fonts.sizes.xl,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: Fonts.sizes.md,
    color: Colors.gray,
    marginBottom: 4,
  },
  profileRole: {
    fontSize: Fonts.sizes.sm,
    color: Colors.primary,
    fontWeight: '500',
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
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    shadowColor: Colors.secondary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: Fonts.sizes.xs,
    color: Colors.gray,
    textAlign: 'center',
  },
  settingsSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: Fonts.sizes.md,
    fontWeight: '500',
    color: Colors.secondary,
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: Fonts.sizes.sm,
    color: Colors.gray,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dangerSection: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.warning,
    paddingVertical: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  signOutButtonText: {
    fontSize: Fonts.sizes.md,
    fontWeight: '600',
    color: Colors.white,
    marginLeft: 8,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.error,
    paddingVertical: 16,
    borderRadius: 8,
  },
  deleteButtonText: {
    fontSize: Fonts.sizes.md,
    fontWeight: '600',
    color: Colors.white,
    marginLeft: 8,
  },
});