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
import { supabase } from '../services/supabase';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';
import RoleGuard from '../components/RoleGuard';
import EnhancedAvailabilityManagement from '../components/EnhancedAvailabilityManagement';

const StadiumCard = ({ stadium, onPress, onEdit, onDelete, onToggleStatus, onManageAvailability }) => (
  <View style={styles.stadiumCard}>
    <TouchableOpacity style={styles.stadiumContent} onPress={onPress}>
      <View style={styles.stadiumHeader}>
        <View style={styles.stadiumInfo}>
          <Text style={styles.stadiumName}>{stadium.name}</Text>
          <Text style={styles.stadiumLocation}>
            <Ionicons name="location-outline" size={12} color={Colors.gray} />
            {' '}{stadium.city}
          </Text>
          <View style={styles.stadiumMeta}>
            <Text style={styles.priceText}>{stadium.price_per_hour} MAD/hour</Text>
            <View style={[styles.statusBadge, stadium.is_active ? styles.activeBadge : styles.inactiveBadge]}>
              <Text style={styles.statusText}>{stadium.is_active ? 'Active' : 'Inactive'}</Text>
            </View>
          </View>
        </View>
      </View>
      
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Ionicons name="calendar-outline" size={16} color={Colors.gray} />
          <Text style={styles.statText}>{stadium.total_bookings || 0} bookings</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="star-outline" size={16} color={Colors.gray} />
          <Text style={styles.statText}>{stadium.rating || '0.0'} rating</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="time-outline" size={16} color={Colors.gray} />
          <Text style={styles.statText}>{stadium.operating_hours || 'Not set'}</Text>
        </View>
      </View>
    </TouchableOpacity>

    <View style={styles.actionButtons}>
      <TouchableOpacity 
        style={[styles.actionButton, styles.toggleButton]} 
        onPress={() => onToggleStatus(stadium)}
      >
        <Ionicons 
          name={stadium.is_active ? "pause-outline" : "play-outline"} 
          size={14} 
          color={Colors.white} 
        />
        <Text style={styles.actionButtonText}>
          {stadium.is_active ? 'Deactivate' : 'Activate'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[styles.actionButton, styles.availabilityButton]} 
        onPress={() => onManageAvailability(stadium)}
      >
        <Ionicons name="time-outline" size={14} color={Colors.white} />
        <Text style={styles.actionButtonText}>Schedule</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.actionButton, styles.editButton]} 
        onPress={() => onEdit(stadium)}
      >
        <Ionicons name="create-outline" size={14} color={Colors.white} />
        <Text style={styles.actionButtonText}>Edit</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.actionButton, styles.deleteButton]} 
        onPress={() => onDelete(stadium)}
      >
        <Ionicons name="trash-outline" size={14} color={Colors.white} />
        <Text style={styles.actionButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  </View>
);

const EditStadiumModal = ({ visible, stadium, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    price_per_hour: '',
    operating_hours: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (stadium) {
      setFormData({
        name: stadium.name || '',
        price_per_hour: stadium.price_per_hour?.toString() || '',
        operating_hours: stadium.operating_hours || '',
        description: stadium.description || '',
      });
    }
  }, [stadium]);

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.price_per_hour.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('stadiums')
        .update({
          name: formData.name.trim(),
          price_per_hour: parseFloat(formData.price_per_hour),
          operating_hours: formData.operating_hours.trim(),
          description: formData.description.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', stadium.id);

      if (error) throw error;

      Alert.alert('Success', 'Stadium updated successfully');
      onSave();
      onClose();
    } catch (error) {
      console.error('Error updating stadium:', error);
      Alert.alert('Error', 'Failed to update stadium');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={Colors.secondary} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Edit Stadium</Text>
          <TouchableOpacity onPress={handleSave} disabled={loading}>
            {loading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Text style={styles.saveButton}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Stadium Name *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.name}
              onChangeText={(text) => setFormData({...formData, name: text})}
              placeholder="Enter stadium name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Price per Hour (MAD) *</Text>
            <TextInput
              style={styles.textInput}
              value={formData.price_per_hour}
              onChangeText={(text) => setFormData({...formData, price_per_hour: text})}
              placeholder="Enter price per hour"
              keyboardType="numeric"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Operating Hours</Text>
            <TextInput
              style={styles.textInput}
              value={formData.operating_hours}
              onChangeText={(text) => setFormData({...formData, operating_hours: text})}
              placeholder="e.g., 06:00 - 23:00"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Description</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={formData.description}
              onChangeText={(text) => setFormData({...formData, description: text})}
              placeholder="Enter stadium description"
              multiline
              numberOfLines={4}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

export default function StadiumOwnerManagement() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [stadiums, setStadiums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [availabilityModalVisible, setAvailabilityModalVisible] = useState(false);
  const [selectedStadium, setSelectedStadium] = useState(null);

  const fetchStadiums = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data: stadiumsData, error } = await supabase
        .from('stadiums')
        .select(`
          *,
          bookings(id, status)
        `)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Calculate stats for each stadium
      const stadiumsWithStats = stadiumsData?.map(stadium => {
        const bookings = stadium.bookings || [];
        const totalBookings = bookings.length;
        const confirmedBookings = bookings.filter(b => b.status === 'confirmed').length;
        
        return {
          ...stadium,
          total_bookings: totalBookings,
          confirmed_bookings: confirmedBookings,
        };
      }) || [];

      setStadiums(stadiumsWithStats);
    } catch (error) {
      console.error('Error fetching stadiums:', error);
      Alert.alert('Error', 'Failed to load stadiums');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStadiums();
  }, [fetchStadiums]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchStadiums();
  };

  const handleAddStadium = () => {
    navigation.navigate('AddStadium');
  };

  const handleEditStadium = (stadium) => {
    setSelectedStadium(stadium);
    setEditModalVisible(true);
  };

  const handleManageAvailability = (stadium) => {
    setSelectedStadium(stadium);
    setAvailabilityModalVisible(true);
  };

  const handleDeleteStadium = (stadium) => {
    Alert.alert(
      'Delete Stadium',
      `Are you sure you want to delete "${stadium.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              const { error } = await supabase
                .from('stadiums')
                .delete()
                .eq('id', stadium.id)
                .eq('owner_id', user.id);

              if (error) throw error;

              Alert.alert('Success', 'Stadium deleted successfully');
              fetchStadiums();
            } catch (error) {
              console.error('Error deleting stadium:', error);
              Alert.alert('Error', 'Failed to delete stadium');
            } finally {
              setActionLoading(false);
            }
          }
        }
      ]
    );
  };

  const handleToggleStatus = async (stadium) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('stadiums')
        .update({ 
          is_active: !stadium.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', stadium.id)
        .eq('owner_id', user.id);

      if (error) throw error;

      Alert.alert(
        'Success', 
        `Stadium ${stadium.is_active ? 'deactivated' : 'activated'} successfully`
      );
      fetchStadiums();
    } catch (error) {
      console.error('Error updating stadium status:', error);
      Alert.alert('Error', 'Failed to update stadium status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStadiumPress = (stadium) => {
    navigation.navigate('StadiumDetails', { stadium });
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="business-outline" size={80} color={Colors.gray} />
      <Text style={styles.emptyStateTitle}>No Stadiums Yet</Text>
      <Text style={styles.emptyStateText}>
        Add your first stadium to start receiving bookings from football players
      </Text>
      <TouchableOpacity style={styles.emptyStateButton} onPress={handleAddStadium}>
        <Ionicons name="add" size={20} color={Colors.white} />
        <Text style={styles.emptyStateButtonText}>Add Your First Stadium</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading your stadiums...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <RoleGuard allowedRoles={['stadium_owner']}>
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Stadiums</Text>
          <Text style={styles.headerSubtitle}>
            {stadiums.length} stadium{stadiums.length !== 1 ? 's' : ''}
          </Text>
          <TouchableOpacity style={styles.addButton} onPress={handleAddStadium}>
            <Ionicons name="add" size={20} color={Colors.white} />
            <Text style={styles.addButtonText}>Add Stadium</Text>
          </TouchableOpacity>
        </View>

        {stadiums.length === 0 ? (
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          >
            {renderEmptyState()}
          </ScrollView>
        ) : (
          <FlatList
            data={stadiums}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <StadiumCard
                stadium={item}
                onPress={() => handleStadiumPress(item)}
                onEdit={handleEditStadium}
                onDelete={handleDeleteStadium}
                onToggleStatus={handleToggleStatus}
                onManageAvailability={handleManageAvailability}
              />
            )}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          />
        )}

        <EditStadiumModal
          visible={editModalVisible}
          stadium={selectedStadium}
          onClose={() => {
            setEditModalVisible(false);
            setSelectedStadium(null);
          }}
          onSave={fetchStadiums}
        />

        <Modal
          visible={availabilityModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <EnhancedAvailabilityManagement
            stadiumId={selectedStadium?.id}
            onSave={() => {
              fetchStadiums();
            }}
            onClose={() => {
              setAvailabilityModalVisible(false);
              setSelectedStadium(null);
            }}
          />
        </Modal>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Fonts.sizes.xl,
    fontWeight: '700',
    color: Colors.white,
    flex: 1,
  },
  headerSubtitle: {
    fontSize: Fonts.sizes.sm,
    color: Colors.white,
    opacity: 0.8,
    position: 'absolute',
    bottom: 16,
    left: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    fontSize: Fonts.sizes.sm,
    fontWeight: '600',
    color: Colors.white,
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Fonts.sizes.md,
    color: Colors.gray,
    marginTop: 12,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  listContainer: {
    padding: 20,
  },
  stadiumCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: Colors.secondary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  stadiumContent: {
    padding: 16,
  },
  stadiumHeader: {
    marginBottom: 12,
  },
  stadiumInfo: {
    flex: 1,
  },
  stadiumName: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 4,
  },
  stadiumLocation: {
    fontSize: Fonts.sizes.sm,
    color: Colors.gray,
    marginBottom: 8,
  },
  stadiumMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceText: {
    fontSize: Fonts.sizes.md,
    fontWeight: '600',
    color: Colors.primary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadge: {
    backgroundColor: Colors.success,
  },
  inactiveBadge: {
    backgroundColor: Colors.gray,
  },
  statusText: {
    fontSize: Fonts.sizes.xs,
    fontWeight: '600',
    color: Colors.white,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statText: {
    fontSize: Fonts.sizes.xs,
    color: Colors.gray,
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.lightGray,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  actionButtonText: {
    fontSize: Fonts.sizes.xs,
    fontWeight: '600',
    color: Colors.white,
    marginLeft: 4,
  },
  toggleButton: {
    backgroundColor: Colors.warning,
  },
  availabilityButton: {
    backgroundColor: Colors.accent,
  },
  editButton: {
    backgroundColor: Colors.primary,
  },
  deleteButton: {
    backgroundColor: Colors.error,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 60,
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
    marginBottom: 30,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    fontSize: Fonts.sizes.md,
    fontWeight: '600',
    color: Colors.white,
    marginLeft: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  modalTitle: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '600',
    color: Colors.secondary,
  },
  saveButton: {
    fontSize: Fonts.sizes.md,
    fontWeight: '600',
    color: Colors.primary,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: Fonts.sizes.md,
    fontWeight: '500',
    color: Colors.secondary,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: Colors.lightGray,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: Fonts.sizes.md,
    color: Colors.secondary,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
});