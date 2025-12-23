import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {
  horizontalScale,
  moderateScale,
  verticalScale,
} from './View/ResponsiveDesign';
import {colors} from '../../Helper/colors';
import {fonts} from '../../Helper/fontsUtils';
interface SystemMessageProps {
  text: string;
  timestamp: number;
}

const SystemMessage: React.FC<SystemMessageProps> = ({text}) => {
  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.messageText}>{text}</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.80)',
    borderRadius: moderateScale(20),
    paddingHorizontal: horizontalScale(12),
    paddingVertical: verticalScale(6),
    maxWidth: '85%',
  },
  messageText: {
    fontSize: moderateScale(11),
    ...fonts.regular,
    color: '#fff',
    textAlign: 'center',
  },
});

export default SystemMessage;

