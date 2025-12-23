import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSelector, useDispatch} from 'react-redux';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  horizontalScale,
  moderateScale,
  verticalScale,
} from '../../Components/Common/View/ResponsiveDesign';
import {colors} from '../../Helper/colors';
import {fonts} from '../../Helper/fontsUtils';
import {ChatService, GroupService} from '../../services';
import {User} from '../../types';
import Avatar from '../../Components/Common/Avatar';
import {getDatabase} from '../../firebase/database';
import {addSnackbar, SnackbarType} from '../../Redux/snackbarSlice';

const AddMembersScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const {chatId} = route.params as {chatId: string};
  const {user} = useSelector((state: any) => state.auth);
  const insets = useSafeAreaInsets();
  
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [addingMembers, setAddingMembers] = useState(false);
  const [existingMemberIds, setExistingMemberIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const loadChat = async () => {
      try {
        const chat = await ChatService.getChat(chatId);
        if (chat?.participants) {
          const participantIds = Array.isArray(chat.participants)
            ? chat.participants
            : Object.keys(chat.participants || {});
          setExistingMemberIds(new Set(participantIds));
        }
      } catch (error) {
        console.error('Error loading chat:', error);
      }
    };
    loadChat();
  }, [chatId]);

  useEffect(() => {
    if (!user) return;

    const loadAllUsers = async () => {
      try {
        setLoading(true);
        const db = getDatabase();
        const snapshot = await db.ref('users').once('value');
        const usersData = snapshot.val();
        
        if (usersData) {
          const usersList: User[] = [];
          for (const userId in usersData) {
            const userData = usersData[userId];
            if (userData && userData.uid) {
              if (userData.uid !== user.uid && !existingMemberIds.has(userData.uid)) {
                usersList.push(userData);
              }
            }
          }
          setAllUsers(usersList);
          setFilteredUsers(usersList);
        }
      } catch (error) {
        console.error('Error loading users:', error);
        dispatch(
          addSnackbar({
            message: 'Failed to load contacts',
            type: SnackbarType.ERROR,
          }),
        );
      } finally {
        setLoading(false);
      }
    };

    loadAllUsers();
  }, [user, existingMemberIds, dispatch]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredUsers(allUsers);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = allUsers.filter(
      (contact) =>
        contact.displayName?.toLowerCase().includes(query) ||
        contact.email?.toLowerCase().includes(query) ||
        contact.username?.toLowerCase().includes(query) ||
        contact.phoneNumber?.includes(query),
    );
    setFilteredUsers(filtered);
  }, [searchQuery, allUsers]);

  const handleToggleSelect = (userId: string) => {
    setSelectedMembers((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedMembers.size === filteredUsers.length) {
      setSelectedMembers(new Set());
    } else {
      setSelectedMembers(new Set(filteredUsers.map((u) => u.uid)));
    }
  };

  const handleAddMembers = async () => {
    if (selectedMembers.size === 0) {
      dispatch(
        addSnackbar({
          message: 'Please select at least one member to add',
          type: SnackbarType.WARNING,
        }),
      );
      return;
    }

    try {
      setAddingMembers(true);
      const memberIds = Array.from(selectedMembers);
      await GroupService.addMembers(chatId, memberIds, user?.uid || '');
      
      dispatch(
        addSnackbar({
          message: `${memberIds.length} member${memberIds.length > 1 ? 's' : ''} added successfully`,
          type: SnackbarType.SUCCESS,
        }),
      );
      
      navigation.goBack();
    } catch (error: any) {
      dispatch(
        addSnackbar({
          message: error?.message || 'Failed to add members. Please try again.',
          type: SnackbarType.ERROR,
        }),
      );
    } finally {
      setAddingMembers(false);
    }
  };

  const renderContactItem = ({item}: {item: User}) => {
    const displayName = item.displayName || item.email || item.username || 'Unknown';
    const subtitle = item.email || item.phoneNumber || '';
    const isSelected = selectedMembers.has(item.uid);

    return (
      <TouchableOpacity
        style={[styles.contactItem, isSelected && styles.contactItemSelected]}
        onPress={() => handleToggleSelect(item.uid)}
        activeOpacity={0.7}>
        <Avatar
          name={displayName}
          imageUri={item.photoURL || item.avatar}
          size={50}
        />
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
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Icon name="checkmark" size={20} color={colors.white} />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      
      <View style={[styles.header, {paddingTop: insets.top + verticalScale(12)}]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Members</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon name="search-outline" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search contacts..."
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

      {filteredUsers.length > 0 && (
        <View style={styles.selectAllContainer}>
          <TouchableOpacity
            style={styles.selectAllButton}
            onPress={handleSelectAll}
            activeOpacity={0.7}>
            <Text style={styles.selectAllText}>
              {selectedMembers.size === filteredUsers.length
                ? 'Deselect All'
                : 'Select All'}
            </Text>
          </TouchableOpacity>
          {selectedMembers.size > 0 && (
            <Text style={styles.selectedCount}>
              {selectedMembers.size} selected
            </Text>
          )}
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading contacts...</Text>
        </View>
      ) : filteredUsers.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="people-outline" size={64} color={colors.textSecondary} />
          <Text style={styles.emptyText}>
            {searchQuery ? 'No contacts found' : 'No contacts available'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderContactItem}
          keyExtractor={(item) => item.uid}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {selectedMembers.size > 0 && (
        <View style={[styles.confirmContainer, {paddingBottom: insets.bottom + verticalScale(12)}]}>
          <TouchableOpacity
            style={[styles.confirmButton, addingMembers && styles.confirmButtonDisabled]}
            onPress={handleAddMembers}
            disabled={addingMembers}
            activeOpacity={0.8}>
            {addingMembers ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <>
                <Text style={styles.confirmButtonText}>
                  Add {selectedMembers.size} Member{selectedMembers.size > 1 ? 's' : ''}
                </Text>
                <Icon name="checkmark-circle" size={24} color={colors.white} />
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: horizontalScale(16),
    paddingBottom: verticalScale(12),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    padding: horizontalScale(8),
    marginRight: horizontalScale(8),
  },
  headerTitle: {
    fontSize: moderateScale(18),
    ...fonts.semiBold,
    color: '#1F2937',
    flex: 1,
    textAlign: 'center',
  },
  placeholder: {
    width: horizontalScale(40),
  },
  searchContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: horizontalScale(16),
    paddingVertical: verticalScale(12),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: moderateScale(12),
    paddingHorizontal: horizontalScale(16),
    paddingVertical: verticalScale(10),
    gap: horizontalScale(12),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(16),
    ...fonts.regular,
    color: colors.text,
  },
  selectAllContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: horizontalScale(16),
    paddingVertical: verticalScale(12),
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  selectAllButton: {
    paddingVertical: verticalScale(6),
  },
  selectAllText: {
    fontSize: moderateScale(15),
    ...fonts.semiBold,
    color: colors.primary,
  },
  selectedCount: {
    fontSize: moderateScale(14),
    ...fonts.medium,
    color: colors.textSecondary,
  },
  listContent: {
    paddingBottom: verticalScale(20),
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: horizontalScale(16),
    paddingVertical: verticalScale(14),
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  contactItemSelected: {
    backgroundColor: '#F0F9FF',
  },
  contactInfo: {
    flex: 1,
    marginLeft: horizontalScale(12),
  },
  contactName: {
    fontSize: moderateScale(16),
    ...fonts.semiBold,
    color: colors.text,
    marginBottom: verticalScale(2),
  },
  contactSubtitle: {
    fontSize: moderateScale(14),
    ...fonts.regular,
    color: colors.textSecondary,
  },
  checkbox: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: moderateScale(14),
    ...fonts.regular,
    color: colors.textSecondary,
    marginTop: verticalScale(12),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: verticalScale(40),
  },
  emptyText: {
    fontSize: moderateScale(16),
    ...fonts.regular,
    color: colors.textSecondary,
    marginTop: verticalScale(16),
  },
  confirmContainer: {
    backgroundColor: colors.white,
    paddingHorizontal: horizontalScale(16),
    paddingTop: verticalScale(12),
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: -2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 5,
  },
  confirmButton: {
    backgroundColor: colors.primary,
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(14),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: horizontalScale(8),
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    fontSize: moderateScale(16),
    ...fonts.semiBold,
    color: colors.white,
  },
});

export default AddMembersScreen;
