import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';

import OnboardingScreen from './src/screens/OnboardingScreen';
import LoginScreen from './src/screens/LoginScreen';
import MainTabNavigator from './src/navigation/MainTabNavigator';
import RoleBasedNavigator from './src/navigation/RoleBasedNavigator';
import BookingDetailsScreen from './src/screens/BookingDetailsScreen';
import AllBookingsScreen from './src/screens/AllBookingsScreen';
import RoleSelectionScreen from './src/screens/RoleSelectionScreen';
import StadiumManagementScreen from './src/screens/StadiumManagementScreen';
import AdminDashboardScreen from './src/screens/AdminDashboardScreen';
import AddStadiumScreen from './src/screens/AddStadiumScreen';
import { AuthProvider } from './src/context/AuthContext';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <StatusBar style="light" backgroundColor="#1a5f1a" />
        <Stack.Navigator 
          initialRouteName="Onboarding"
          screenOptions={{
            headerShown: false,
            gestureEnabled: true,
          }}
        >
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
          <Stack.Screen name="Main" component={RoleBasedNavigator} />
          <Stack.Screen name="StadiumManagement" component={StadiumManagementScreen} />
          <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
          <Stack.Screen name="AddStadium" component={AddStadiumScreen} />
          <Stack.Screen name="BookingDetails" component={BookingDetailsScreen} />
          <Stack.Screen name="AllBookings" component={AllBookingsScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a5f1a',
  },
});