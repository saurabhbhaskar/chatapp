import React, {useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  horizontalScale,
  moderateScale,
  verticalScale,
} from '../../Components/Common/View/ResponsiveDesign';
import {fonts} from '../../Helper/fontsUtils';
import Avatar from '../../Components/Common/Avatar';
import BottomNavBar from '../../Components/Common/BottomNavBar';
import {AuthService} from '../../services';
import {logout} from '../../Redux/authSlice';
import {useDispatch} from 'react-redux';

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  iconColor: string;
  onPress: () => void;
}

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const {user} = useSelector((state: any) => state.auth);
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'calls' | 'messages' | 'settings'>('settings');

  useFocusEffect(
    useCallback(() => {
      setActiveTab('settings');
    }, []),
  );

  const displayName = user?.displayName || user?.email || 'User';
  const phoneNumber = user?.phoneNumber || user?.phone || '';
  const username = user?.username || '';
  const contactInfo = phoneNumber
    ? `${phoneNumber}${username ? ` • @${username}` : ''}`
    : username
    ? `@${username}`
    : '';

  const handleTabPress = (tab: 'calls' | 'messages' | 'settings') => {
    setActiveTab(tab);
    switch (tab) {
      case 'messages':
        (navigation as any).navigate('ChatListScreen');
        break;
      case 'calls':
        (navigation as any).navigate('CallsScreen');
        break;
      default:
        break;
    }
  };

  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'Edit profile functionality coming soon');
  };

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AuthService.logout();
              dispatch(logout());
            } catch (error) {
            }
          },
        },
      ],
    );
  };

  const menuItems: MenuItem[] = [
    {
      id: 'changePhoto',
      title: 'Change Profile Photo',
      icon: 'camera',
      iconColor: '#5B8FE8',
      onPress: () => Alert.alert('Change Photo', 'Photo change coming soon'),
    },
    {
      id: 'myProfile',
      title: 'My Profile',
      icon: 'person',
      iconColor: '#EF4444',
      onPress: () => Alert.alert('My Profile', 'Profile details coming soon'),
    },
    {
      id: 'wallet',
      title: 'Wallet',
      icon: 'wallet',
      iconColor: '#8B5CF6',
      onPress: () => Alert.alert('Wallet', 'Wallet feature coming soon'),
    },
    {
      id: 'savedMessages',
      title: 'Saved Messages',
      icon: 'bookmark',
      iconColor: '#5B8FE8',
      onPress: () => Alert.alert('Saved Messages', 'Saved messages coming soon'),
    },
    {
      id: 'recentCalls',
      title: 'Recent Calls',
      icon: 'call',
      iconColor: '#10B981',
      onPress: () => (navigation as any).navigate('CallsScreen'),
    },
    {
      id: 'devices',
      title: 'Devices',
      icon: 'phone-portrait',
      iconColor: '#F59E0B',
      onPress: () => Alert.alert('Devices', 'Device management coming soon'),
    },
    {
      id: 'chatFolder',
      title: 'Chat Folder',
      icon: 'folder',
      iconColor: '#06B6D4',
      onPress: () => Alert.alert('Chat Folder', 'Chat folders coming soon'),
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      
      <View style={[styles.topHeader, {paddingTop: insets.top + verticalScale(12)}]}>
        <TouchableOpacity
          onPress={() => (navigation as any).goBack()}
          style={styles.menuButton}>
          <Icon name="grid-outline" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <Avatar
            name={displayName}
            imageUri={user?.avatar}
            size={100}
          />
          <Text style={styles.userName}>{displayName}</Text>
          {contactInfo && (
            <Text style={styles.contactInfo}>{contactInfo}</Text>
          )}
          <TouchableOpacity
            style={styles.editButton}
            onPress={handleEditProfile}>
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.menuItem,
                index === menuItems.length - 1 && styles.lastMenuItem,
              ]}
              onPress={item.onPress}>
              <View
                style={[
                  styles.menuIconContainer,
                  {backgroundColor: `${item.iconColor}15`},
                ]}>
                <Icon name={item.icon} size={20} color={item.iconColor} />
              </View>
              <Text style={styles.menuItemText}>{item.title}</Text>
              <Icon name="chevron-forward" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      <BottomNavBar activeTab={activeTab} onTabPress={handleTabPress} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: horizontalScale(20),
    paddingBottom: verticalScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuButton: {
    padding: horizontalScale(8),
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: verticalScale(100),
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: verticalScale(32),
    paddingHorizontal: horizontalScale(20),
  },
  userName: {
    fontSize: moderateScale(24),
    ...fonts.bold,
    color: '#1F2937',
    marginTop: verticalScale(16),
    marginBottom: verticalScale(8),
  },
  contactInfo: {
    fontSize: moderateScale(14),
    ...fonts.regular,
    color: '#6B7280',
    marginBottom: verticalScale(20),
  },
  editButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: horizontalScale(24),
    paddingVertical: verticalScale(10),
    borderRadius: moderateScale(20),
  },
  editButtonText: {
    fontSize: moderateScale(14),
    ...fonts.semiBold,
    color: '#1F2937',
  },
  menuSection: {
    paddingHorizontal: horizontalScale(20),
    marginTop: verticalScale(8),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: horizontalScale(16),
    paddingVertical: verticalScale(16),
    borderRadius: moderateScale(12),
    marginBottom: verticalScale(8),
  },
  lastMenuItem: {
    marginBottom: verticalScale(16),
  },
  menuIconContainer: {
    width: horizontalScale(40),
    height: horizontalScale(40),
    borderRadius: horizontalScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: horizontalScale(12),
  },
  menuItemText: {
    flex: 1,
    fontSize: moderateScale(16),
    ...fonts.medium,
    color: '#1F2937',
  },
  logoutButton: {
    marginHorizontal: horizontalScale(20),
    marginTop: verticalScale(16),
    backgroundColor: '#FEE2E2',
    paddingVertical: verticalScale(16),
    borderRadius: moderateScale(12),
    alignItems: 'center',
  },
  logoutButtonText: {
    fontSize: moderateScale(16),
    ...fonts.semiBold,
    color: '#DC2626',
  },
});

export default SettingsScreen;

