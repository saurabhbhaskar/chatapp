import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  horizontalScale,
  moderateScale,
  verticalScale,
} from '../../Components/Common/View/ResponsiveDesign';
import {fonts} from '../../Helper/fontsUtils';
import {TimeUtils} from '../../Helper/TimeUtils';
import BottomNavBar from '../../Components/Common/BottomNavBar';
import EmptyDataView from '../../Components/Common/View/EmptyDataView';

interface CallItem {
  id: string;
  name: string;
  phoneNumber: string;
  type: 'incoming' | 'outgoing' | 'missed';
  timestamp: number;
  duration?: number;
}

const CallsScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [calls] = useState<CallItem[]>([]);
  const [activeTab, setActiveTab] = useState<'calls' | 'messages' | 'settings'>('calls');

  useFocusEffect(
    useCallback(() => {
      setActiveTab('calls');
    }, []),
  );

  const handleTabPress = (tab: 'calls' | 'messages' | 'settings') => {
    switch (tab) {
      case 'messages':
        (navigation as any).navigate('ChatListScreen');
        break;
      case 'settings':
        (navigation as any).navigate('SettingsScreen');
        break;
      default:
        break;
    }
  };

  const handleCallPress = (call: CallItem) => {
  };

  const getCallIcon = (type: string) => {
    switch (type) {
      case 'incoming':
        return 'call-received';
      case 'outgoing':
        return 'call-made';
      case 'missed':
        return 'call-missed';
      default:
        return 'call';
    }
  };

  const getCallIconColor = (type: string) => {
    switch (type) {
      case 'missed':
        return '#EF4444';
      case 'incoming':
      case 'outgoing':
        return '#10B981';
      default:
        return '#6B7280';
    }
  };

  const renderCallItem = ({item}: {item: CallItem}) => {
    const callTime = TimeUtils.formatTime(item.timestamp);

    return (
      <TouchableOpacity
        style={styles.callItem}
        onPress={() => handleCallPress(item)}>
        <View style={styles.callIconContainer}>
          <Icon
            name={getCallIcon(item.type)}
            size={24}
            color={getCallIconColor(item.type)}
          />
        </View>
        <View style={styles.callInfo}>
          <Text style={styles.callName} numberOfLines={1}>
            {item.name}
          </Text>
          <Text style={styles.callDetails} numberOfLines={1}>
            {item.phoneNumber} • {callTime}
          </Text>
        </View>
        <TouchableOpacity style={styles.callButton}>
          <Icon name="call" size={24} color="#5B8FE8" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#5B8FE8" barStyle="light-content" />
      
      <View style={[styles.header, {paddingTop: insets.top + verticalScale(16)}]}>
        <Text style={styles.headerTitle}>Calls</Text>
      </View>

      <FlatList
        data={calls}
        renderItem={renderCallItem}
        keyExtractor={item => item.id}
        contentContainerStyle={
          calls.length === 0 ? styles.emptyContainer : styles.listContent
        }
        ListEmptyComponent={
          <EmptyDataView message="No call history" icon="📞" />
        }
      />

      <BottomNavBar activeTab="calls" onTabPress={handleTabPress} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    backgroundColor: '#5B8FE8',
    paddingHorizontal: horizontalScale(20),
    paddingBottom: verticalScale(16),
  },
  headerTitle: {
    fontSize: moderateScale(28),
    ...fonts.bold,
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: verticalScale(80),
  },
  callItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: horizontalScale(20),
    paddingVertical: verticalScale(16),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  callIconContainer: {
    width: horizontalScale(48),
    height: horizontalScale(48),
    borderRadius: horizontalScale(24),
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: horizontalScale(12),
  },
  callInfo: {
    flex: 1,
  },
  callName: {
    fontSize: moderateScale(16),
    ...fonts.semiBold,
    color: '#1F2937',
    marginBottom: verticalScale(2),
  },
  callDetails: {
    fontSize: moderateScale(14),
    ...fonts.regular,
    color: '#6B7280',
  },
  callButton: {
    padding: horizontalScale(8),
  },
});

export default CallsScreen;

