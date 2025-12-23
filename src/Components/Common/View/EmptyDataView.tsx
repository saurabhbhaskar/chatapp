import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {
  horizontalScale,
  moderateScale,
  verticalScale,
} from './ResponsiveDesign';
import {colors} from '../../../Helper/colors';
import {fonts} from '../../../Helper/fontsUtils';

interface EmptyDataViewProps {
  message?: string;
  icon?: string;
}

const EmptyDataView: React.FC<EmptyDataViewProps> = ({
  message = 'No data available',
  icon = '📭',
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: verticalScale(40),
  },
  icon: {
    fontSize: moderateScale(48),
    marginBottom: verticalScale(16),
  },
  message: {
    fontSize: moderateScale(16),
    ...fonts.regular,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});

export default EmptyDataView;

