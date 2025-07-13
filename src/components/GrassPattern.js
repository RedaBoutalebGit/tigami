import React from 'react';
import { View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';

export default function GrassPattern({ style }) {
  return (
    <View style={[styles.container, style]}>
      <LinearGradient
        colors={[Colors.primary, Colors.lightGreen, Colors.primary]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.pattern}>
          {Array.from({ length: 20 }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.grassLine,
                {
                  left: `${(index * 5) % 100}%`,
                  opacity: 0.1 + (index % 3) * 0.1,
                },
              ]}
            />
          ))}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
  },
  gradient: {
    flex: 1,
  },
  pattern: {
    flex: 1,
    position: 'relative',
  },
  grassLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: Colors.darkGreen,
    transform: [{ skewX: '15deg' }],
  },
});