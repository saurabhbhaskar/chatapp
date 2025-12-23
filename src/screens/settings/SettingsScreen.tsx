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
import {colors} from '../../Helper/colors';
import Avatar from '../../Components/Common/Avatar';
import BottomNavBar from '../../Components/Common/BottomNavBar';
import {AuthService, PresenceService} from '../../services';
import {logout} from '../../Redux/authSlice';
import {useDispatch} from 'react-redux';
import {UserService} from '../../services/firebase/user.service';
import {addSnackbar, SnackbarType} from '../../Redux/snackbarSlice';

interface MenuItem {
  id: string;
  title: string;
  icon: string;
  onPress: () => void;
}

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const {user} = useSelector((state: any) => state.auth);
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'calls' | 'messages' | 'settings'>('settings');
  const [userData, setUserData] = useState<any>(user);

  useFocusEffect(
    useCallback(() => {
      setActiveTab('settings');
      fetchUserData();
    }, []),
  );

  const fetchUserData = async () => {
    if (!user?.uid) return;
    try {
      const fullUserData = await UserService.getUser(user.uid);
      if (fullUserData) {
        setUserData(fullUserData);
      }
    } catch (error) {
    }
  };

  const displayName = userData?.displayName || userData?.name || 'User';
  const email = userData?.email || '';
  const avatarUri = userData?.photoURL || userData?.avatar;

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
    dispatch(
      addSnackbar({
        message: 'Edit profile functionality coming soon',
        type: SnackbarType.INFO,
      }),
    );
  };

  const handleRefresh = () => {
    fetchUserData();
    dispatch(
      addSnackbar({
        message: 'Profile data refreshed',
        type: SnackbarType.SUCCESS,
      }),
    );
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
              if (user?.uid) {
                await PresenceService.setOffline(user.uid);
              }
              await AuthService.logout();
              dispatch(logout());
              dispatch(
                addSnackbar({
                  message: 'Logged out successfully',
                  type: SnackbarType.SUCCESS,
                }),
              );
              (navigation as any).reset({
                index: 0,
                routes: [{name: 'LoginScreen'}],
              });
            } catch (error) {
              dispatch(
                addSnackbar({
                  message: 'Failed to logout. Please try again',
                  type: SnackbarType.ERROR,
                }),
              );
            }
          },
        },
      ],
    );
  };

  const handlePersonalDetails = () => {
    dispatch(
      addSnackbar({
        message: 'Personal details screen coming soon',
        type: SnackbarType.INFO,
      }),
    );
  };

  const handlePrivacySecurity = () => {
    dispatch(
      addSnackbar({
        message: 'Privacy and security settings coming soon',
        type: SnackbarType.INFO,
      }),
    );
  };

  const handleNotifications = () => {
    dispatch(
      addSnackbar({
        message: 'Notification settings coming soon',
        type: SnackbarType.INFO,
      }),
    );
  };

  const handleChatSettings = () => {
    dispatch(
      addSnackbar({
        message: 'Chat settings coming soon',
        type: SnackbarType.INFO,
      }),
    );
  };

  const handleBlockedContacts = () => {
    dispatch(
      addSnackbar({
        message: 'Blocked contacts screen coming soon',
        type: SnackbarType.INFO,
      }),
    );
  };

  const handleAbout = () => {
    dispatch(
      addSnackbar({
        message: 'Chat App v1.0.0 - A WhatsApp-style messaging app',
        type: SnackbarType.INFO,
      }),
    );
  };

  const menuItems: MenuItem[] = [
    {
      id: 'personalDetails',
      title: 'Personal Details',
      icon: 'person-outline',
      onPress: handlePersonalDetails,
    },
    {
      id: 'privacySecurity',
      title: 'Privacy & Security',
      icon: 'lock-closed-outline',
      onPress: handlePrivacySecurity,
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: 'notifications-outline',
      onPress: handleNotifications,
    },
    {
      id: 'chatSettings',
      title: 'Chat Settings',
      icon: 'chatbubbles-outline',
      onPress: handleChatSettings,
    },
    {
      id: 'blockedContacts',
      title: 'Blocked Contacts',
      icon: 'ban-outline',
      onPress: handleBlockedContacts,
    },
    {
      id: 'about',
      title: 'About',
      icon: 'information-circle-outline',
      onPress: handleAbout,
    },
    {
      id: 'logout',
      title: 'Logout',
      icon: 'log-out-outline',
      onPress: handleLogout,
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      
      <View style={[styles.header, {paddingTop: insets.top + verticalScale(12)}]}>
        <TouchableOpacity
          onPress={() => (navigation as any).goBack()}
          style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <Icon name="refresh" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Avatar
              name={displayName}
              imageUri={avatarUri}
              size={100}
            />
            <TouchableOpacity
              style={styles.editIconContainer}
              onPress={handleEditProfile}>
              <View style={styles.editIcon}>
                <Icon name="pencil" size={14} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </View>
          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profileEmail}>{email}</Text>
        </View>

        <View style={styles.menuSection}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, item.id === 'logout' && styles.menuItemLogout]}
              onPress={item.onPress}
              activeOpacity={0.7}>
              <Icon 
                name={item.icon} 
                size={24} 
                color={item.id === 'logout' ? colors.error : '#6B7280'} 
              />
              <Text style={[
                styles.menuItemText,
                item.id === 'logout' && styles.menuItemTextLogout
              ]}>
                {item.title}
              </Text>
              {item.id !== 'logout' && (
                <Icon name="chevron-forward" size={20} color="#9CA3AF" />
              )}
            </TouchableOpacity>
          ))}
        </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: horizontalScale(20),
    paddingBottom: verticalScale(16),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: horizontalScale(40),
    height: horizontalScale(40),
    borderRadius: horizontalScale(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: moderateScale(20),
    ...fonts.bold,
    color: '#1F2937',
  },
  refreshButton: {
    width: horizontalScale(40),
    height: horizontalScale(40),
    borderRadius: horizontalScale(20),
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: horizontalScale(20),
    paddingTop: verticalScale(24),
    paddingBottom: verticalScale(100),
  },
  profileSection: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: verticalScale(32),
    paddingHorizontal: horizontalScale(20),
    borderRadius: moderateScale(16),
    marginBottom: verticalScale(20),
    shadowColor: '#5B8FE8',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: verticalScale(16),
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  editIcon: {
    width: horizontalScale(32),
    height: horizontalScale(32),
    borderRadius: horizontalScale(16),
    backgroundColor: '#5B8FE8',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileName: {
    fontSize: moderateScale(24),
    ...fonts.bold,
    color: '#1F2937',
    marginBottom: verticalScale(8),
  },
  profileEmail: {
    fontSize: moderateScale(14),
    ...fonts.regular,
    color: '#6B7280',
  },
  menuSection: {
    gap: verticalScale(12),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    paddingHorizontal: horizontalScale(20),
    paddingVertical: verticalScale(18),
    borderRadius: moderateScale(12),
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  menuItemText: {
    flex: 1,
    fontSize: moderateScale(16),
    ...fonts.medium,
    color: '#1F2937',
    marginLeft: horizontalScale(16),
  },
  menuItemLogout: {
    marginTop: verticalScale(8),
    borderColor: colors.error + '30',
  },
  menuItemTextLogout: {
    color: colors.error,
  },
});

export default SettingsScreen;


