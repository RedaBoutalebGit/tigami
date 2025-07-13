import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

export default function useAnimatedList(data, delay = 100) {
  const animations = useRef(
    data.map(() => new Animated.Value(0))
  ).current;

  useEffect(() => {
    // Reset animations when data changes
    animations.forEach(anim => anim.setValue(0));

    // Animate items in sequence
    const animationPromises = animations.map((anim, index) => {
      return new Promise(resolve => {
        setTimeout(() => {
          Animated.timing(anim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }).start(resolve);
        }, index * delay);
      });
    });

    Promise.all(animationPromises);
  }, [data, animations, delay]);

  const getItemStyle = (index) => {
    if (index >= animations.length) return {};
    
    return {
      opacity: animations[index],
      transform: [
        {
          translateY: animations[index].interpolate({
            inputRange: [0, 1],
            outputRange: [20, 0],
          }),
        },
        {
          scale: animations[index].interpolate({
            inputRange: [0, 1],
            outputRange: [0.9, 1],
          }),
        },
      ],
    };
  };

  return { getItemStyle };
}