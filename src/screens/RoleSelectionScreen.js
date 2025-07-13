import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const RoleSelectionScreen = ({ navigation }) => {
  const { user, updateUserRole } = useAuth();
  const [selectedRole, setSelectedRole] = useState(null);
  const [loading, setLoading] = useState(false);

  const roles = [
    {
      key: 'player',
      title: 'Player',
      description: 'Book stadiums, join teams, and play football',
      icon: 'person-outline',
      color: '#4CAF50',
    },
    {
      key: 'stadium_owner',
      title: 'Stadium Owner',
      description: 'Manage stadiums, handle bookings, and earn revenue',
      icon: 'business-outline',
      color: '#2196F3',
    },
    {
      key: 'admin',
      title: 'Administrator',
      description: 'Manage the entire platform and oversee operations',
      icon: 'shield-checkmark-outline',
      color: '#FF9800',
    },
  ];

  const handleRoleSelection = async () => {
    if (!selectedRole) {
      Alert.alert('Error', 'Please select a role');
      return;
    }

    setLoading(true);
    const result = await updateUserRole(user.id, selectedRole);
    
    if (result.success) {
      Alert.alert(
        'Success', 
        'Role updated successfully!',
        [
          {
            text: 'Continue',
            onPress: () => {
              // Navigate based on role
              switch (selectedRole) {
                case 'admin':
                  navigation.replace('AdminDashboard');
                  break;
                case 'stadium_owner':
                  navigation.replace('StadiumManagement');
                  break;
                default:
                  navigation.replace('Main');
              }
            }
          }
        ]
      );
    } else {
      Alert.alert('Error', result.error || 'Failed to update role');
    }
    setLoading(false);
  };

  const renderRoleCard = (role) => (
    <TouchableOpacity
      key={role.key}
      style={[
        styles.roleCard,
        selectedRole === role.key && styles.selectedRoleCard,
        { borderColor: role.color }
      ]}
      onPress={() => setSelectedRole(role.key)}
    >
      <View style={[styles.roleIcon, { backgroundColor: role.color }]}>
        <Ionicons name={role.icon} size={32} color="#fff" />
      </View>
      <View style={styles.roleInfo}>
        <Text style={styles.roleTitle}>{role.title}</Text>
        <Text style={styles.roleDescription}>{role.description}</Text>
      </View>
      <View style={styles.radioContainer}>
        <View style={[
          styles.radioButton,
          selectedRole === role.key && styles.radioButtonSelected
        ]}>
          {selectedRole === role.key && (
            <Ionicons name="checkmark" size={16} color="#fff" />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Choose Your Role</Text>
          <Text style={styles.subtitle}>
            Select how you want to use Tigami
          </Text>
        </View>

        <View style={styles.rolesContainer}>
          {roles.map(renderRoleCard)}
        </View>

        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedRole && styles.continueButtonDisabled
          ]}
          onPress={handleRoleSelection}
          disabled={!selectedRole || loading}
        >
          <Text style={[
            styles.continueButtonText,
            !selectedRole && styles.continueButtonTextDisabled
          ]}>
            {loading ? 'Setting up...' : 'Continue'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.skipButton}
          onPress={() => navigation.replace('Main')}
        >
          <Text style={styles.skipButtonText}>Skip for now</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    paddingTop: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  rolesContainer: {
    marginBottom: 40,
  },
  roleCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedRoleCard: {
    borderWidth: 2,
    elevation: 4,
    shadowOpacity: 0.15,
  },
  roleIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  roleInfo: {
    flex: 1,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  roleDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  radioContainer: {
    marginLeft: 16,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonSelected: {
    backgroundColor: '#1a5f1a',
    borderColor: '#1a5f1a',
  },
  continueButton: {
    backgroundColor: '#1a5f1a',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  continueButtonDisabled: {
    backgroundColor: '#ccc',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  continueButtonTextDisabled: {
    color: '#999',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  skipButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default RoleSelectionScreen;