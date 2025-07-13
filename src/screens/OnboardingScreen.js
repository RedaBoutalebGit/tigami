import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';

const { width, height } = Dimensions.get('window');

const onboardingData = [
  {
    id: 1,
    title: 'Find Your Perfect Pitch',
    subtitle: 'Discover the best 7-a-side football stadiums near you',
    icon: 'location-outline',
    gradient: [Colors.primary, Colors.lightGreen],
  },
  {
    id: 2,
    title: 'Book in Seconds',
    subtitle: 'No more WhatsApp chaos. Book your game time instantly',
    icon: 'time-outline',
    gradient: [Colors.lightGreen, Colors.primary],
  },
  {
    id: 3,
    title: 'Build Your Squad',
    subtitle: 'Create teams, invite friends, and dominate the pitch',
    icon: 'people-outline',
    gradient: [Colors.primary, Colors.darkGreen],
  },
];

export default function OnboardingScreen({ navigation }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      navigation.navigate('Login');
    }
  };

  const handleSkip = () => {
    navigation.navigate('Login');
  };

  const currentItem = onboardingData[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={currentItem.gradient}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <View style={styles.iconBackground}>
              <Ionicons
                name={currentItem.icon}
                size={80}
                color={Colors.accent}
              />
            </View>
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.title}>{currentItem.title}</Text>
            <Text style={styles.subtitle}>{currentItem.subtitle}</Text>
          </View>

          <View style={styles.pagination}>
            {onboardingData.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  { backgroundColor: index === currentIndex ? Colors.accent : Colors.white }
                ]}
              />
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
            <Text style={styles.nextButtonText}>
              {currentIndex === onboardingData.length - 1 ? 'Get Started' : 'Next'}
            </Text>
            <Ionicons name="arrow-forward" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.footballPattern}>
          <Ionicons name="football-outline" size={24} color={Colors.white} style={styles.football1} />
          <Ionicons name="football-outline" size={18} color={Colors.white} style={styles.football2} />
          <Ionicons name="football-outline" size={20} color={Colors.white} style={styles.football3} />
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  skipButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  skipText: {
    color: Colors.white,
    fontSize: Fonts.sizes.md,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  iconContainer: {
    marginBottom: 40,
  },
  iconBackground: {
    width: 160,
    height: 160,
    backgroundColor: Colors.white,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.secondary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: Fonts.sizes.xxxl,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: Fonts.sizes.lg,
    color: Colors.white,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 25,
    shadowColor: Colors.secondary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  nextButtonText: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '600',
    color: Colors.primary,
    marginRight: 8,
  },
  footballPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  football1: {
    position: 'absolute',
    top: 100,
    left: 30,
    transform: [{ rotate: '15deg' }],
  },
  football2: {
    position: 'absolute',
    top: 200,
    right: 40,
    transform: [{ rotate: '-20deg' }],
  },
  football3: {
    position: 'absolute',
    bottom: 150,
    left: 50,
    transform: [{ rotate: '45deg' }],
  },
});