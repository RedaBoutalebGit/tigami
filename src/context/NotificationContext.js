import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Platform } from 'react-native';
import { notificationService } from '../services/notificationService';
import { useAuth } from './AuthContext';

// Fallback notification context that works without expo-notifications
// To enable push notifications, install: npm install expo-notifications expo-device

const NotificationContext = createContext({});

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [expoPushToken, setExpoPushToken] = useState('');
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    if (user) {
      initializeNotifications();
      fetchNotifications();
      setupNotificationListeners();
    } else {
      cleanup();
    }

    return () => {
      cleanup();
    };
  }, [user]);

  const initializeNotifications = async () => {
    try {
      const result = await notificationService.initialize();
      if (result.success && result.token) {
        setExpoPushToken(result.token);
        console.log('Expo Push Token:', result.token);
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  };

  const setupNotificationListeners = () => {
    // Fallback: No actual listeners without expo-notifications
    console.log('Notification listeners setup (fallback mode)');
    
    // In a real implementation with expo-notifications, this would set up:
    // 1. Notification received listener
    // 2. Notification response listener
    // 3. Handle foreground notifications
  };

  const cleanup = () => {
    // Fallback: Simple cleanup without expo-notifications
    console.log('Cleaning up notifications (fallback mode)');
    setNotifications([]);
    setUnreadCount(0);
    setExpoPushToken('');
  };

  const fetchNotifications = async () => {
    try {
      const result = await notificationService.getUserNotifications(user.id);
      if (result.success) {
        setNotifications(result.notifications);
        
        // Count unread notifications
        const unread = result.notifications.filter(n => !n.read).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const result = await notificationService.markAsRead(notificationId);
      if (result.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, read: true, read_at: new Date().toISOString() }
              : notification
          )
        );
        
        // Update unread count
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const result = await notificationService.markAllAsRead(user.id);
      if (result.success) {
        // Update local state
        setNotifications(prev => 
          prev.map(notification => ({
            ...notification,
            read: true,
            read_at: new Date().toISOString()
          }))
        );
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleNotificationPress = (notificationData) => {
    console.log('Handling notification press:', notificationData);
    
    // Here you can implement navigation based on notification type
    switch (notificationData.type) {
      case 'booking_created':
      case 'booking_confirmed':
      case 'booking_cancelled':
        // Navigate to booking details or management screen
        console.log('Navigate to booking:', notificationData.bookingId);
        break;
      
      case 'payment_received':
        // Navigate to revenue/earnings screen
        console.log('Navigate to earnings');
        break;
      
      case 'stadium_approved':
      case 'stadium_rejected':
        // Navigate to stadium management
        console.log('Navigate to stadium management');
        break;
      
      default:
        console.log('Unknown notification type:', notificationData.type);
    }
  };

  const refreshNotifications = () => {
    if (user) {
      fetchNotifications();
    }
  };

  const contextValue = {
    notifications,
    unreadCount,
    expoPushToken,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
    handleNotificationPress,
  };

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}