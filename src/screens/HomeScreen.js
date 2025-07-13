import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  FlatList,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';
import { supabase } from '../services/supabase';

const FilterButton = ({ title, active, onPress }) => (
  <TouchableOpacity
    style={[styles.filterButton, active && styles.activeFilterButton]}
    onPress={onPress}
  >
    <Text style={[styles.filterButtonText, active && styles.activeFilterButtonText]}>
      {title}
    </Text>
  </TouchableOpacity>
);

const StadiumCard = ({ stadium, onPress }) => (
  <TouchableOpacity style={styles.stadiumCard} onPress={onPress}>
    <View style={styles.stadiumImageContainer}>
      {stadium.photos && stadium.photos.length > 0 ? (
        <Image source={{ uri: stadium.photos[0] }} style={styles.stadiumImage} />
      ) : (
        <View style={[styles.stadiumImage, styles.placeholderImage]}>
          <Ionicons name="football-outline" size={40} color={Colors.gray} />
        </View>
      )}
      <View style={styles.ratingContainer}>
        <Ionicons name="star" size={12} color={Colors.accent} />
        <Text style={styles.ratingText}>{stadium.rating || '4.5'}</Text>
      </View>
    </View>
    
    <View style={styles.stadiumInfo}>
      <Text style={styles.stadiumName}>{stadium.name}</Text>
      <View style={styles.locationContainer}>
        <Ionicons name="location-outline" size={14} color={Colors.gray} />
        <Text style={styles.locationText}>{stadium.city}</Text>
      </View>
      
      <View style={styles.amenitiesContainer}>
        {stadium.has_parking && (
          <View style={styles.amenityTag}>
            <Ionicons name="car-outline" size={12} color={Colors.primary} />
          </View>
        )}
        {stadium.has_lighting && (
          <View style={styles.amenityTag}>
            <Ionicons name="bulb-outline" size={12} color={Colors.primary} />
          </View>
        )}
        {stadium.has_showers && (
          <View style={styles.amenityTag}>
            <Ionicons name="water-outline" size={12} color={Colors.primary} />
          </View>
        )}
      </View>
      
      <View style={styles.priceContainer}>
        <Text style={styles.priceText}>{stadium.price_per_hour} MAD/hour</Text>
        <TouchableOpacity style={styles.bookButton}>
          <Text style={styles.bookButtonText}>Book</Text>
        </TouchableOpacity>
      </View>
    </View>
  </TouchableOpacity>
);

export default function HomeScreen({ navigation }) {
  const [stadiums, setStadiums] = useState([]);
  const [filteredStadiums, setFilteredStadiums] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [priceRange, setPriceRange] = useState('All');

  const filters = ['All', 'Nearby', 'Highly Rated', 'Available Now'];
  const priceFilters = ['All', 'Under 100 MAD', '100-200 MAD', 'Above 200 MAD'];

  useEffect(() => {
    fetchStadiums();
  }, []);

  useEffect(() => {
    filterStadiums();
  }, [stadiums, searchQuery, selectedFilter, priceRange]);

  const fetchStadiums = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stadiums')
        .select('*')
        .eq('is_active', true)
        .order('rating', { ascending: false });

      if (error) throw error;
      setStadiums(data || []);
    } catch (error) {
      console.error('Error fetching stadiums:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterStadiums = () => {
    let filtered = [...stadiums];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(stadium =>
        stadium.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stadium.city.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    switch (selectedFilter) {
      case 'Highly Rated':
        filtered = filtered.filter(stadium => stadium.rating >= 4.0);
        break;
      case 'Available Now':
        // In a real app, this would check current availability
        break;
      case 'Nearby':
        // In a real app, this would use location services
        break;
    }

    // Price filter
    switch (priceRange) {
      case 'Under 100 MAD':
        filtered = filtered.filter(stadium => stadium.price_per_hour < 100);
        break;
      case '100-200 MAD':
        filtered = filtered.filter(stadium => 
          stadium.price_per_hour >= 100 && stadium.price_per_hour <= 200
        );
        break;
      case 'Above 200 MAD':
        filtered = filtered.filter(stadium => stadium.price_per_hour > 200);
        break;
    }

    setFilteredStadiums(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStadiums();
    setRefreshing(false);
  };

  const handleStadiumPress = (stadium) => {
    navigation.navigate('Booking', { stadium });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover Stadiums</Text>
        <Text style={styles.headerSubtitle}>Find your perfect pitch in Morocco</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color={Colors.gray} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search stadiums, locations..."
            placeholderTextColor={Colors.gray}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterIconButton}>
          <Ionicons name="options-outline" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScrollView}
        contentContainerStyle={styles.filterContainer}
      >
        {filters.map((filter) => (
          <FilterButton
            key={filter}
            title={filter}
            active={selectedFilter === filter}
            onPress={() => setSelectedFilter(filter)}
          />
        ))}
      </ScrollView>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.priceFilterScrollView}
        contentContainerStyle={styles.filterContainer}
      >
        {priceFilters.map((filter) => (
          <FilterButton
            key={filter}
            title={filter}
            active={priceRange === filter}
            onPress={() => setPriceRange(filter)}
          />
        ))}
      </ScrollView>

      <FlatList
        data={filteredStadiums}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <StadiumCard
            stadium={item}
            onPress={() => handleStadiumPress(item)}
          />
        )}
        contentContainerStyle={styles.stadiumsList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    backgroundColor: Colors.primary,
  },
  headerTitle: {
    fontSize: Fonts.sizes.xxl,
    fontWeight: '700',
    color: Colors.white,
  },
  headerSubtitle: {
    fontSize: Fonts.sizes.sm,
    color: Colors.white,
    opacity: 0.8,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightGray,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: Fonts.sizes.md,
    color: Colors.secondary,
  },
  filterIconButton: {
    marginLeft: 12,
    padding: 8,
    backgroundColor: Colors.lightGray,
    borderRadius: 8,
  },
  filterScrollView: {
    marginBottom: 8,
  },
  priceFilterScrollView: {
    marginBottom: 16,
  },
  filterContainer: {
    paddingHorizontal: 20,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.lightGray,
    borderRadius: 20,
    marginRight: 8,
  },
  activeFilterButton: {
    backgroundColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: Fonts.sizes.sm,
    fontWeight: '500',
    color: Colors.gray,
  },
  activeFilterButtonText: {
    color: Colors.white,
  },
  stadiumsList: {
    paddingHorizontal: 20,
  },
  stadiumCard: {
    backgroundColor: Colors.white,
    borderRadius: 16,
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
  stadiumImageContainer: {
    position: 'relative',
  },
  stadiumImage: {
    width: '100%',
    height: 180,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  placeholderImage: {
    backgroundColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ratingText: {
    fontSize: Fonts.sizes.xs,
    fontWeight: '600',
    color: Colors.secondary,
    marginLeft: 2,
  },
  stadiumInfo: {
    padding: 16,
  },
  stadiumName: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '600',
    color: Colors.secondary,
    marginBottom: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.gray,
    marginLeft: 4,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  amenityTag: {
    backgroundColor: Colors.lightGray,
    padding: 6,
    borderRadius: 6,
    marginRight: 6,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '700',
    color: Colors.primary,
  },
  bookButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  bookButtonText: {
    fontSize: Fonts.sizes.sm,
    fontWeight: '600',
    color: Colors.white,
  },
});