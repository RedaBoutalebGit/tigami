import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import StadiumOwnerDashboard from '../screens/StadiumOwnerDashboard';
import StadiumOwnerManagement from '../screens/StadiumOwnerManagement';
import StadiumOwnerProfile from '../screens/StadiumOwnerProfile';

const Tab = createBottomTabNavigator();

export default function StadiumOwnerTabNavigator() {
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'analytics' : 'analytics-outline';
          } else if (route.name === 'Management') {
            iconName = focused ? 'business' : 'business-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.gray,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.lightGray,
          borderTopWidth: 1,
          paddingBottom: Math.max(insets.bottom, 5),
          paddingTop: 5,
          height: 60 + Math.max(insets.bottom, 0),
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={StadiumOwnerDashboard}
        options={{ tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen 
        name="Management" 
        component={StadiumOwnerManagement}
        options={{ tabBarLabel: 'My Stadiums' }}
      />
      <Tab.Screen 
        name="Profile" 
        component={StadiumOwnerProfile}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
}