import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  TextInput,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  horizontalScale,
  moderateScale,
  verticalScale,
} from '../../Components/Common/View/ResponsiveDesign';
import {fonts} from '../../Helper/fontsUtils';
import {StringUtils} from '../../Helper/StringUtils';
import {UserService} from '../../services';
import {User} from '../../types';
import Avatar from '../../Components/Common/Avatar';
import EmptyDataView from '../../Components/Common/View/EmptyDataView';
import BottomNavBar from '../../Components/Common/BottomNavBar';

const ContactsScreen: React.FC = () => {
  const navigation = useNavigation();
  const {user} = useSelector((state: any) => state.auth);
  const insets = useSafeAreaInsets();
  const [contacts, setContacts] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredContacts, setFilteredContacts] = useState<User[]>([]);

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = contacts.filter(
        contact =>
          contact.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          contact.username?.toLowerCase().includes(searchQuery.toLowerCase()),
      );
      setFilteredContacts(filtered);
    } else {
      setFilteredContacts(contacts);
    }
  }, [searchQuery, contacts]);

  const loadContacts = async () => {
    try {
      setContacts([]);
      setFilteredContacts([]);
    } catch (error) {
    }
  };

  const handleContactPress = (contact: User) => {
    (navigation as any).navigate('ChatListScreen');
  };

  const renderContactItem = ({item}: {item: User}) => {
    const displayName =
      item.displayName || item.email || item.username || 'Unknown';
    const subtitle = item.email || item.phoneNumber || '';

    return (
      <TouchableOpacity
        style={styles.contactItem}
        onPress={() => handleContactPress(item)}>
        <Avatar name={displayName} imageUri={item.avatar} size={50} />
        <View style={styles.contactInfo}>
          <Text style={styles.contactName} numberOfLines={1}>
            {displayName}
          </Text>
          {subtitle && (
            <Text style={styles.contactSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
        <Icon name="chevron-forward" size={20} color="#9CA3AF" />
      </TouchableOpacity>
    );
  };

  const handleTabPress = (tab: 'calls' | 'messages' | 'contacts' | 'settings') => {
    switch (tab) {
      case 'messages':
        (navigation as any).navigate('ChatListScreen');
        break;
      case 'calls':
        (navigation as any).navigate('CallsScreen');
        break;
      case 'settings':
        (navigation as any).navigate('SettingsScreen');
        break;
      default:
        break;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#5B8FE8" barStyle="light-content" />
      
      <View style={[styles.header, {paddingTop: insets.top + verticalScale(16)}]}>
        <Text style={styles.headerTitle}>Contacts</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon name="search-outline" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search contacts"
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={filteredContacts}
        renderItem={renderContactItem}
        keyExtractor={item => item.uid}
        contentContainerStyle={
          filteredContacts.length === 0 ? styles.emptyContainer : styles.listContent
        }
        ListEmptyComponent={
          <EmptyDataView message="No contacts found" icon="👥" />
        }
      />

      <BottomNavBar activeTab="contacts" onTabPress={handleTabPress} />
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
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: horizontalScale(20),
    paddingVertical: verticalScale(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: moderateScale(12),
    paddingHorizontal: horizontalScale(16),
    height: verticalScale(44),
    gap: horizontalScale(12),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(15),
    ...fonts.regular,
    color: '#1F2937',
  },
  emptyContainer: {
    flex: 1,
  },
  listContent: {
    paddingBottom: verticalScale(80),
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: horizontalScale(20),
    paddingVertical: verticalScale(16),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  contactInfo: {
    flex: 1,
    marginLeft: horizontalScale(12),
  },
  contactName: {
    fontSize: moderateScale(16),
    ...fonts.semiBold,
    color: '#1F2937',
    marginBottom: verticalScale(2),
  },
  contactSubtitle: {
    fontSize: moderateScale(14),
    ...fonts.regular,
    color: '#6B7280',
  },
});

export default ContactsScreen;

