import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';
import FootballLoader from './FootballLoader';

export default function LoadingState({
  message = 'Loading...',
  size = 'medium',
  variant = 'default',
  style,
}) {
  const getContainerStyle = () => {
    switch (size) {
      case 'small':
        return styles.smallContainer;
      case 'large':
        return styles.largeContainer;
      default:
        return styles.mediumContainer;
    }
  };

  const getLoaderSize = () => {
    switch (size) {
      case 'small':
        return 24;
      case 'large':
        return 60;
      default:
        return 40;
    }
  };

  const getTextStyle = () => {
    switch (size) {
      case 'small':
        return styles.smallText;
      case 'large':
        return styles.largeText;
      default:
        return styles.mediumText;
    }
  };

  const getBackgroundStyle = () => {
    switch (variant) {
      case 'overlay':
        return styles.overlayBackground;
      case 'transparent':
        return styles.transparentBackground;
      default:
        return styles.defaultBackground;
    }
  };

  return (
    <View style={[getContainerStyle(), getBackgroundStyle(), style]}>
      <FootballLoader size={getLoaderSize()} />
      <Text style={[getTextStyle(), styles.loadingText]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  smallContainer: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediumContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  largeContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  defaultBackground: {
    backgroundColor: Colors.white,
  },
  overlayBackground: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  transparentBackground: {
    backgroundColor: 'transparent',
  },
  loadingText: {
    marginTop: 16,
    color: Colors.gray,
    textAlign: 'center',
  },
  smallText: {
    fontSize: Fonts.sizes.sm,
  },
  mediumText: {
    fontSize: Fonts.sizes.md,
  },
  largeText: {
    fontSize: Fonts.sizes.lg,
    fontWeight: '500',
  },
});