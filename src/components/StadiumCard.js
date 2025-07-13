import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';
import PrimaryButton from './PrimaryButton';

const { width } = Dimensions.get('window');

export default function StadiumCard({ stadium, onPress, variant = 'default' }) {
  const renderAmenityIcon = (amenity, iconName) => {
    if (!stadium[amenity]) return null;
    
    return (
      <View style={styles.amenityIcon}>
        <Ionicons name={iconName} size={14} color={Colors.primary} />
      </View>
    );
  };

  if (variant === 'featured') {
    return (
      <TouchableOpacity style={styles.featuredCard} onPress={onPress}>
        <View style={styles.featuredImageContainer}>
          {stadium.photos && stadium.photos.length > 0 ? (
            <Image source={{ uri: stadium.photos[0] }} style={styles.featuredImage} />
          ) : (
            <LinearGradient
              colors={[Colors.primary, Colors.lightGreen]}
              style={styles.featuredImagePlaceholder}
            >
              <Ionicons name="football-outline" size={60} color={Colors.white} />
            </LinearGradient>
          )}
          
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.featuredOverlay}
          />
          
          <View style={styles.featuredContent}>
            <View style={styles.featuredRating}>
              <Ionicons name="star" size={14} color={Colors.accent} />
              <Text style={styles.featuredRatingText}>{stadium.rating || '4.5'}</Text>
            </View>
            
            <Text style={styles.featuredStadiumName}>{stadium.name}</Text>
            <View style={styles.featuredLocation}>
              <Ionicons name="location-outline" size={16} color={Colors.white} />
              <Text style={styles.featuredLocationText}>{stadium.city}</Text>
            </View>
            
            <View style={styles.featuredFooter}>
              <Text style={styles.featuredPrice}>{stadium.price_per_hour} MAD/hour</Text>
              <PrimaryButton
                title="Book"
                size="small"
                variant="accent"
                onPress={onPress}
              />
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.imageContainer}>
        {stadium.photos && stadium.photos.length > 0 ? (
          <Image source={{ uri: stadium.photos[0] }} style={styles.stadiumImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="football-outline" size={40} color={Colors.gray} />
          </View>
        )}
        
        <View style={styles.ratingBadge}>
          <Ionicons name="star" size={12} color={Colors.accent} />
          <Text style={styles.ratingText}>{stadium.rating || '4.5'}</Text>
        </View>
      </View>
      
      <View style={styles.cardContent}>
        <Text style={styles.stadiumName}>{stadium.name}</Text>
        
        <View style={styles.locationRow}>
          <Ionicons name="location-outline" size={14} color={Colors.gray} />
          <Text style={styles.locationText}>{stadium.city}</Text>
        </View>
        
        <View style={styles.amenitiesRow}>
          {renderAmenityIcon('has_parking', 'car-outline')}
          {renderAmenityIcon('has_lighting', 'bulb-outline')}
          {renderAmenityIcon('has_showers', 'water-outline')}
          {renderAmenityIcon('has_changing_rooms', 'shirt-outline')}
        </View>
        
        <View style={styles.cardFooter}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceText}>{stadium.price_per_hour}</Text>
            <Text style={styles.priceUnit}>MAD/hour</Text>
          </View>
          
          <TouchableOpacity style={styles.bookButton} onPress={onPress}>
            <Text style={styles.bookButtonText}>Book</Text>
            <Ionicons name="arrow-forward" size={14} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: Colors.secondary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    overflow: 'hidden',
  },
  featuredCard: {
    width: width - 40,
    height: 280,
    borderRadius: 20,
    marginRight: 16,
    overflow: 'hidden',
    shadowColor: Colors.secondary,
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
  },
  imageContainer: {
    position: 'relative',
    height: 180,
  },
  featuredImageContainer: {
    flex: 1,
    position: 'relative',
  },
  stadiumImage: {
    width: '100%',
    height: '100%',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  ratingBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    shadowColor: Colors.secondary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featuredRating: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  ratingText: {
    fontSize: Fonts.sizes.xs,
    fontWeight: '600',
    color: Colors.secondary,
    marginLeft: 2,
  },
  featuredRatingText: {
    fontSize: Fonts.sizes.xs,
    fontWeight: '600',
    color: Colors.white,
    marginLeft: 2,
  },
  featuredContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  cardContent: {
    padding: 16,
  },
  stadiumName: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '700',
    color: Colors.secondary,
    marginBottom: 6,
  },
  featuredStadiumName: {
    fontSize: Fonts.sizes.xl,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featuredLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.gray,
    marginLeft: 4,
  },
  featuredLocationText: {
    fontSize: Fonts.sizes.sm,
    color: Colors.white,
    marginLeft: 4,
    opacity: 0.9,
  },
  amenitiesRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  amenityIcon: {
    backgroundColor: Colors.lightGray,
    padding: 6,
    borderRadius: 8,
    marginRight: 6,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  featuredFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceText: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '700',
    color: Colors.primary,
  },
  priceUnit: {
    fontSize: Fonts.sizes.sm,
    color: Colors.gray,
    marginLeft: 2,
  },
  featuredPrice: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '700',
    color: Colors.white,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  bookButtonText: {
    fontSize: Fonts.sizes.sm,
    fontWeight: '600',
    color: Colors.white,
    marginRight: 4,
  },
});