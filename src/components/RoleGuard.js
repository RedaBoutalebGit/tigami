import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';

const RoleGuard = ({ 
  children, 
  allowedRoles = [], 
  fallback = null,
  showError = true 
}) => {
  const { userProfile, getUserRole } = useAuth();
  
  const currentRole = getUserRole();
  const hasAccess = allowedRoles.includes(currentRole);

  if (!hasAccess) {
    if (fallback) {
      return fallback;
    }
    
    if (showError) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Access Denied</Text>
          <Text style={styles.errorText}>
            You don't have permission to access this feature.
          </Text>
          <Text style={styles.errorRole}>
            Your role: {currentRole}
          </Text>
        </View>
      );
    }
    
    return null;
  }

  return children;
};

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 22,
  },
  errorRole: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default RoleGuard;