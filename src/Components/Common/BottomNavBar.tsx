import React from 'react';
import {View, TouchableOpacity, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  horizontalScale,
  moderateScale,
  verticalScale,
} from './View/ResponsiveDesign';
import {colors} from '../../Helper/colors';

interface BottomNavBarProps {
  activeTab: 'calls' | 'messages' | 'settings';
  onTabPress: (tab: 'calls' | 'messages' | 'settings') => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({activeTab, onTabPress}) => {
  return (
    <View style={styles.container}>
      {/* Calls */}
      <TouchableOpacity
        style={styles.tab}
        onPress={() => onTabPress('calls')}
        activeOpacity={0.7}>
        <Icon
          name={activeTab === 'calls' ? 'call' : 'call-outline'}
          size={moderateScale(26)}
          color={activeTab === 'calls' ? colors.primary : colors.textSecondary}
        />
      </TouchableOpacity>

      {/* Messages/Chats */}
      <TouchableOpacity
        style={styles.tab}
        onPress={() => onTabPress('messages')}
        activeOpacity={0.7}>
        <Icon
          name={activeTab === 'messages' ? 'chatbubbles' : 'chatbubbles-outline'}
          size={moderateScale(26)}
          color={activeTab === 'messages' ? colors.primary : colors.textSecondary}
        />
      </TouchableOpacity>

      {/* Profile/Settings */}
      <TouchableOpacity
        style={styles.tab}
        onPress={() => onTabPress('settings')}
        activeOpacity={0.7}>
        <Icon
          name={activeTab === 'settings' ? 'person' : 'person-outline'}
          size={moderateScale(26)}
          color={activeTab === 'settings' ? colors.primary : colors.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingVertical: verticalScale(16),
    paddingHorizontal: horizontalScale(20),
    borderTopLeftRadius: moderateScale(24),
    borderTopRightRadius: moderateScale(24),
    justifyContent: 'space-around',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 5,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(8),
  },
});

export default BottomNavBar;

