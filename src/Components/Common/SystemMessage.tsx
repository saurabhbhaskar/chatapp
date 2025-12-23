import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {
  horizontalScale,
  moderateScale,
  verticalScale,
} from './View/ResponsiveDesign';
import {colors} from '../../Helper/colors';
import {fonts} from '../../Helper/fontsUtils';
import {TimeUtils} from '../../Helper/TimeUtils';

interface SystemMessageProps {
  text: string;
  timestamp: number;
}

const SystemMessage: React.FC<SystemMessageProps> = ({text, timestamp}) => {
  const messageTime = TimeUtils.formatTime(timestamp);

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.messageText}>{text}</Text>
        <Text style={styles.timeText}>{messageTime}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: verticalScale(8),
    paddingHorizontal: horizontalScale(16),
  },
  contentContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: moderateScale(8),
    paddingHorizontal: horizontalScale(12),
    paddingVertical: verticalScale(6),
    maxWidth: '85%',
  },
  messageText: {
    fontSize: moderateScale(13),
    ...fonts.medium,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: verticalScale(2),
  },
  timeText: {
    fontSize: moderateScale(10),
    ...fonts.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    opacity: 0.7,
  },
});

export default SystemMessage;

