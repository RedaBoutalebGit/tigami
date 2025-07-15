import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabase';

const AddStadiumScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const isEdit = route?.params?.stadium;
  const existingStadium = route?.params?.stadium;

  const [formData, setFormData] = useState({
    name: existingStadium?.name || '',
    description: existingStadium?.description || '',
    address: existingStadium?.address || '',
    city: existingStadium?.city || '',
    price_per_hour: existingStadium?.price_per_hour?.toString() || '',
    capacity: existingStadium?.capacity?.toString() || '22',
    has_parking: existingStadium?.has_parking || false,
    has_changing_rooms: existingStadium?.has_changing_rooms || false,
    has_lighting: existingStadium?.has_lighting || false,
    has_showers: existingStadium?.has_showers || false,
    surface_type: existingStadium?.surface_type || 'artificial_grass',
    is_active: existingStadium?.is_active !== undefined ? existingStadium.is_active : true,
  });

  const [loading, setLoading] = useState(false);

  const surfaceTypes = [
    { value: 'natural_grass', label: 'Natural Grass' },
    { value: 'artificial_grass', label: 'Artificial Grass' },
    { value: 'indoor', label: 'Indoor Court' },
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Stadium name is required');
      return false;
    }
    if (!formData.city.trim()) {
      Alert.alert('Error', 'City is required');
      return false;
    }
    if (!formData.address.trim()) {
      Alert.alert('Error', 'Address is required');
      return false;
    }
    if (!formData.price_per_hour || isNaN(parseFloat(formData.price_per_hour))) {
      Alert.alert('Error', 'Valid price per hour is required');
      return false;
    }
    if (!formData.capacity || isNaN(parseInt(formData.capacity))) {
      Alert.alert('Error', 'Valid capacity is required');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      const stadiumData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        price_per_hour: parseFloat(formData.price_per_hour),
        capacity: parseInt(formData.capacity),
        has_parking: formData.has_parking,
        has_changing_rooms: formData.has_changing_rooms,
        has_lighting: formData.has_lighting,
        has_showers: formData.has_showers,
        surface_type: formData.surface_type,
        is_active: formData.is_active,
        photos: ['https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=800'], // Default photo
      };

      let result;
      if (isEdit) {
        result = await supabase
          .from('stadiums')
          .update(stadiumData)
          .eq('id', existingStadium.id)
          .eq('owner_id', user.id)
          .select();
      } else {
        result = await supabase
          .from('stadiums')
          .insert([{
            ...stadiumData,
            owner_id: user.id
          }])
          .select();
      }

      if (result.error) throw result.error;

      Alert.alert(
        'Success',
        `Stadium ${isEdit ? 'updated' : 'created'} successfully!`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Error saving stadium:', error);
      Alert.alert('Error', `Failed to ${isEdit ? 'update' : 'create'} stadium`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!isEdit) return;

    Alert.alert(
      'Delete Stadium',
      'Are you sure you want to delete this stadium? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              const { error } = await supabase
                .from('stadiums')
                .delete()
                .eq('id', existingStadium.id)
                .eq('owner_id', user.id);

              if (error) throw error;

              Alert.alert(
                'Success',
                'Stadium deleted successfully!',
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.goBack()
                  }
                ]
              );
            } catch (error) {
              console.error('Error deleting stadium:', error);
              Alert.alert('Error', 'Failed to delete stadium');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEdit ? 'Edit Stadium' : 'Add Stadium'}
        </Text>
        {isEdit && (
          <TouchableOpacity onPress={handleDelete} disabled={loading}>
            <Ionicons name="trash-outline" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Basic Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Stadium Name *</Text>
            <TextInput
              style={styles.input}
              value={formData.name}
              onChangeText={(value) => handleInputChange('name', value)}
              placeholder="Enter stadium name"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.description}
              onChangeText={(value) => handleInputChange('description', value)}
              placeholder="Describe your stadium"
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>City *</Text>
            <TextInput
              style={styles.input}
              value={formData.city}
              onChangeText={(value) => handleInputChange('city', value)}
              placeholder="Enter city"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address *</Text>
            <TextInput
              style={styles.input}
              value={formData.address}
              onChangeText={(value) => handleInputChange('address', value)}
              placeholder="Enter full address"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pricing & Capacity</Text>
          
          <View style={styles.row}>
            <View style={[styles.inputGroup, styles.half]}>
              <Text style={styles.label}>Price per Hour (MAD) *</Text>
              <TextInput
                style={styles.input}
                value={formData.price_per_hour}
                onChangeText={(value) => handleInputChange('price_per_hour', value)}
                placeholder="100"
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, styles.half]}>
              <Text style={styles.label}>Capacity *</Text>
              <TextInput
                style={styles.input}
                value={formData.capacity}
                onChangeText={(value) => handleInputChange('capacity', value)}
                placeholder="22"
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Surface Type</Text>
          <View style={styles.surfaceTypes}>
            {surfaceTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.surfaceOption,
                  formData.surface_type === type.value && styles.selectedSurface
                ]}
                onPress={() => handleInputChange('surface_type', type.value)}
              >
                <Text style={[
                  styles.surfaceText,
                  formData.surface_type === type.value && styles.selectedSurfaceText
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amenities</Text>
          
          <View style={styles.amenityRow}>
            <Text style={styles.amenityLabel}>Parking Available</Text>
            <Switch
              value={formData.has_parking}
              onValueChange={(value) => handleInputChange('has_parking', value)}
              trackColor={{ false: '#ccc', true: '#1a5f1a' }}
            />
          </View>

          <View style={styles.amenityRow}>
            <Text style={styles.amenityLabel}>Changing Rooms</Text>
            <Switch
              value={formData.has_changing_rooms}
              onValueChange={(value) => handleInputChange('has_changing_rooms', value)}
              trackColor={{ false: '#ccc', true: '#1a5f1a' }}
            />
          </View>

          <View style={styles.amenityRow}>
            <Text style={styles.amenityLabel}>Lighting</Text>
            <Switch
              value={formData.has_lighting}
              onValueChange={(value) => handleInputChange('has_lighting', value)}
              trackColor={{ false: '#ccc', true: '#1a5f1a' }}
            />
          </View>

          <View style={styles.amenityRow}>
            <Text style={styles.amenityLabel}>Showers</Text>
            <Switch
              value={formData.has_showers}
              onValueChange={(value) => handleInputChange('has_showers', value)}
              trackColor={{ false: '#ccc', true: '#1a5f1a' }}
            />
          </View>

          <View style={styles.amenityRow}>
            <Text style={styles.amenityLabel}>Active Stadium</Text>
            <Switch
              value={formData.is_active}
              onValueChange={(value) => handleInputChange('is_active', value)}
              trackColor={{ false: '#ccc', true: '#1a5f1a' }}
            />
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>
              {isEdit ? 'Update Stadium' : 'Create Stadium'}
            </Text>
          )}
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
  header: {
    backgroundColor: '#1a5f1a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  half: {
    width: '48%',
  },
  surfaceTypes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  surfaceOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: '#f8f8f8',
  },
  selectedSurface: {
    backgroundColor: '#1a5f1a',
    borderColor: '#1a5f1a',
  },
  surfaceText: {
    fontSize: 14,
    color: '#666',
  },
  selectedSurfaceText: {
    color: '#fff',
  },
  amenityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  amenityLabel: {
    fontSize: 16,
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#1a5f1a',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  saveButtonDisabled: {
    backgroundColor: '#ccc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AddStadiumScreen;