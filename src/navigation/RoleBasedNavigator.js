import React from 'react';
import { useAuth } from '../context/AuthContext';
import MainTabNavigator from './MainTabNavigator';
import StadiumOwnerTabNavigator from './StadiumOwnerTabNavigator';
import StadiumManagementScreen from '../screens/StadiumManagementScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import RoleSelectionScreen from '../screens/RoleSelectionScreen';

const RoleBasedNavigator = () => {
  const { user, userProfile, loading } = useAuth();

  // Show loading screen while fetching user data
  if (loading) {
    return null;
  }

  // If no user, let the main app handle authentication
  if (!user) {
    return null;
  }

  // If user exists but no profile or role, show role selection
  if (!userProfile || !userProfile.role) {
    return <RoleSelectionScreen />;
  }

  // Route based on user role
  switch (userProfile?.role) {
    case 'admin':
      return <AdminDashboardScreen />;
    case 'stadium_owner':
      return <StadiumOwnerTabNavigator />;
    case 'player':
    default:
      return <MainTabNavigator />;
  }
};

export default RoleBasedNavigator;