import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../constants/Colors';
import { Fonts } from '../constants/Fonts';

export default function PrimaryButton({
  title,
  onPress,
  disabled = false,
  loading = false,
  icon,
  variant = 'primary',
  style,
  textStyle,
  size = 'medium',
}) {
  const getButtonColors = () => {
    switch (variant) {
      case 'secondary':
        return [Colors.lightGray, Colors.lightGray];
      case 'accent':
        return [Colors.accent, Colors.warning];
      case 'success':
        return [Colors.success, Colors.lightGreen];
      default:
        return [Colors.primary, Colors.lightGreen];
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'secondary':
        return Colors.secondary;
      default:
        return Colors.white;
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case 'small':
        return { paddingVertical: 10, paddingHorizontal: 16 };
      case 'large':
        return { paddingVertical: 18, paddingHorizontal: 32 };
      default:
        return { paddingVertical: 14, paddingHorizontal: 24 };
    }
  };

  const getFontSize = () => {
    switch (size) {
      case 'small':
        return Fonts.sizes.sm;
      case 'large':
        return Fonts.sizes.lg;
      default:
        return Fonts.sizes.md;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={getButtonColors()}
        style={[styles.gradient, getButtonSize()]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <View style={styles.content}>
          {loading ? (
            <ActivityIndicator color={getTextColor()} size="small" />
          ) : (
            <>
              {icon && (
                <Ionicons
                  name={icon}
                  size={getFontSize() + 2}
                  color={getTextColor()}
                  style={styles.icon}
                />
              )}
              <Text
                style={[
                  styles.text,
                  {
                    color: getTextColor(),
                    fontSize: getFontSize(),
                  },
                  textStyle,
                ]}
              >
                {title}
              </Text>
            </>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    shadowColor: Colors.secondary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  gradient: {
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
});