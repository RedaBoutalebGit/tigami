import React, { useEffect, useRef } from 'react';
import {
  View,
  Animated,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Colors } from '../constants/Colors';

export default function AnimatedCard({
  children,
  delay = 0,
  duration = 600,
  onPress,
  style,
}) {
  const translateY = useRef(new Animated.Value(50)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, duration, translateY, opacity, scale]);

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (onPress) {
      onPress();
    }
  };

  const animatedStyle = {
    opacity,
    transform: [
      { translateY },
      { scale },
    ],
  };

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handlePress}
        style={style}
      >
        <Animated.View style={[styles.card, animatedStyle]}>
          {children}
        </Animated.View>
      </TouchableOpacity>
    );
  }

  return (
    <Animated.View style={[styles.card, animatedStyle, style]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    shadowColor: Colors.secondary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
});