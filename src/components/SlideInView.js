import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

export default function SlideInView({
  children,
  direction = 'left',
  delay = 0,
  duration = 500,
  style,
}) {
  const translateX = useRef(
    new Animated.Value(direction === 'left' ? -screenWidth : screenWidth)
  ).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: duration * 0.8,
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, duration, translateX, opacity]);

  return (
    <Animated.View
      style={[
        {
          opacity,
          transform: [{ translateX }],
        },
        style,
      ]}
    >
      {children}
    </Animated.View>
  );
}