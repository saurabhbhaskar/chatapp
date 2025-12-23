import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { colors } from '../../Helper/colors';
import {
  horizontalScale,
  moderateScale,
  verticalScale,
} from './View/ResponsiveDesign';

/**
 * TypingIndicator displays an animated "..." indicator to show when someone is typing.
 * Features three dots that animate in sequence with a bouncing effect.
 */
interface TypingIndicatorProps {
  backgroundColor?: string;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({
  backgroundColor = colors.gray200,
}) => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateDot = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: -8,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animation = Animated.parallel([
      animateDot(dot1, 0),
      animateDot(dot2, 150),
      animateDot(dot3, 300),
    ]);

    animation.start();

    // Cleanup: stop animations when component unmounts
    return () => {
      animation.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.messageBubbleContainer}>
      <View style={[styles.messageBubble, styles.typingBubble, { backgroundColor }]}>
        <Animated.View style={[styles.typingDot, { transform: [{ translateY: dot1 }] }]} />
        <Animated.View style={[styles.typingDot, { transform: [{ translateY: dot2 }] }]} />
        <Animated.View style={[styles.typingDot, { transform: [{ translateY: dot3 }] }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  messageBubbleContainer: {
    flexDirection: 'row',
    marginVertical: verticalScale(1.5),
    paddingHorizontal: 0,
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '70%',
    paddingHorizontal: horizontalScale(16),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(20),
  },
  typingBubble: {
    flexDirection: 'row',
    gap: horizontalScale(4),
    paddingHorizontal: horizontalScale(12),
    paddingVertical: verticalScale(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  typingDot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
    backgroundColor: colors.textSecondary,
  },
});

export default TypingIndicator;

