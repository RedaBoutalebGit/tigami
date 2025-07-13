import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';

export default function PulseAnimation({
  children,
  duration = 1000,
  minScale = 0.95,
  maxScale = 1.05,
  style,
}) {
  const scaleValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = () => {
      Animated.sequence([
        Animated.timing(scaleValue, {
          toValue: maxScale,
          duration: duration / 2,
          useNativeDriver: true,
        }),
        Animated.timing(scaleValue, {
          toValue: minScale,
          duration: duration / 2,
          useNativeDriver: true,
        }),
      ]).start(() => pulse());
    };

    pulse();
  }, [scaleValue, duration, minScale, maxScale]);

  return (
    <Animated.View
      style={[
        {
          transform: [{ scale: scaleValue }],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({});