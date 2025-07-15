import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';
import { useNotifications } from '../context/NotificationContext';

const NotificationItem = ({ notification, onPress, onMarkAsRead }) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'booking_created':
        return 'calendar-outline';
      case 'booking_confirmed':
        return 'checkmark-circle-outline';
      case 'booking_cancelled':
        return 'close-circle-outline';
      case 'payment_received':
        return 'card-outline';
      case 'stadium_approved':
        return 'checkmark-outline';
      case 'stadium_rejected':
        return 'warning-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getIconColor = () => {
    switch (notification.type) {
      case 'booking_confirmed':
      case 'payment_received':
      case 'stadium_approved':
        return Colors.success;
      case 'booking_cancelled':
      case 'stadium_rejected':
        return Colors.error;
      case 'booking_created':
        return Colors.primary;
      default:
        return Colors.gray;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !notification.read && styles.unreadNotification
      ]}
      onPress={() => {
        if (!notification.read) {
          onMarkAsRead(notification.id);
        }
        onPress(notification);
      }}
    >
      <View style={styles.notificationLeft}>
        <View style={[styles.iconContainer, { backgroundColor: getIconColor() + '20' }]}>
          <Ionicons name={getIcon()} size={20} color={getIconColor()} />
        </View>
        <View style={styles.notificationContent}>
          <Text style={[
            styles.notificationTitle,
            !notification.read && styles.unreadText
          ]}>
            {notification.title}
          </Text>
          <Text style={styles.notificationBody} numberOfLines={2}>
            {notification.body}
          </Text>
          <Text style={styles.notificationTime}>
            {formatDate(notification.created_at)}
          </Text>
        </View>
      </View>
      <View style={styles.notificationRight}>
        {!notification.read && <View style={styles.unreadDot} />}
        <Ionicons name="chevron-forward" size={16} color={Colors.gray} />
      </View>
    </TouchableOpacity>
  );
};

export default function NotificationsScreen({ navigation }) {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    handleNotificationPress,
  } = useNotifications();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  };

  const handleNotificationItemPress = (notification) => {
    // Handle navigation based on notification type
    handleNotificationPress(notification.data);
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="notifications-outline" size={80} color={Colors.gray} />
      <Text style={styles.emptyStateTitle}>No Notifications</Text>
      <Text style={styles.emptyStateText}>
        You'll see booking updates, payments, and other important notifications here
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllAsRead}>
            <Text style={styles.markAllButton}>Mark All Read</Text>
          </TouchableOpacity>
        )}
      </View>

      {unreadCount > 0 && (
        <View style={styles.unreadBanner}>
          <Text style={styles.unreadBannerText}>
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </Text>
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NotificationItem
            notification={item}
            onPress={handleNotificationItemPress}
            onMarkAsRead={markAsRead}
          />
        )}
        contentContainerStyle={[
          styles.listContainer,
          notifications.length === 0 && styles.emptyListContainer
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={renderEmptyState}
      />
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.primary,
  },
  headerTitle: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '600',
    color: Colors.white,
    flex: 1,
    textAlign: 'center',
  },
  markAllButton: {
    fontSize: Fonts.sizes.sm,
    color: Colors.white,
    fontWeight: '500',
  },
  unreadBanner: {
    backgroundColor: Colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  unreadBannerText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.white,
    fontWeight: '500',
  },
  listContainer: {
    paddingVertical: 8,
  },
  emptyListContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  unreadNotification: {
    backgroundColor: Colors.primary + '05',
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: Fonts.sizes.md,
    fontWeight: '500',
    color: Colors.secondary,
    marginBottom: 4,
  },
  unreadText: {
    fontWeight: '600',
  },
  notificationBody: {
    fontSize: Fonts.sizes.sm,
    color: Colors.gray,
    lineHeight: 18,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: Fonts.sizes.xs,
    color: Colors.gray,
  },
  notificationRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginRight: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: Fonts.sizes.xl,
    fontWeight: '600',
    color: Colors.secondary,
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: Fonts.sizes.md,
    color: Colors.gray,
    textAlign: 'center',
    lineHeight: 22,
  },
});