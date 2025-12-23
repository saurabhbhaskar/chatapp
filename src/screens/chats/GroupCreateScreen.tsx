import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  horizontalScale,
  moderateScale,
  verticalScale,
} from '../../Components/Common/View/ResponsiveDesign';
import {fonts} from '../../Helper/fontsUtils';
import {colors} from '../../Helper/colors';
import {ChatService} from '../../services';
import {addChat, setCurrentChat} from '../../Redux/chatSlice';
import {getUser} from '../../firebase/database';
import Avatar from '../../Components/Common/Avatar';
import Loader from '../../Components/Common/View/Loader';
import {addSnackbar, SnackbarType} from '../../Redux/snackbarSlice';
import {Chat, User} from '../../types';

const GroupCreateScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const {user} = useSelector((state: any) => state.auth);
  const {chats} = useSelector((state: any) => state.chat);
  const insets = useSafeAreaInsets();

  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [nameError, setNameError] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
  const [availableContacts, setAvailableContacts] = useState<User[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadContactsFromChats();
    }, [chats, user]),
  );

  const loadContactsFromChats = async () => {
    if (!user) return;

    try {
      setLoadingContacts(true);
      const contactMap = new Map<string, User>();

      for (const chat of chats) {
        if (chat.participants) {
          const participants = Array.isArray(chat.participants)
            ? chat.participants
            : Object.keys(chat.participants || {});

          for (const participantId of participants) {
            if (participantId !== user.uid && !contactMap.has(participantId)) {
              try {
                const userData = await getUser(participantId);
                if (userData) {
                  contactMap.set(participantId, userData);
                }
              } catch (error) {
              }
            }
          }
        }
      }

      setAvailableContacts(Array.from(contactMap.values()));
    } catch (error) {
      dispatch(
        addSnackbar({
          message: 'Failed to load contacts',
          type: SnackbarType.ERROR,
        }),
      );
    } finally {
      setLoadingContacts(false);
    }
  };

  const filteredContacts = availableContacts.filter(contact => {
    const searchLower = searchQuery.toLowerCase();
    return (
      contact.displayName?.toLowerCase().includes(searchLower) ||
      contact.username?.toLowerCase().includes(searchLower) ||
      contact.email?.toLowerCase().includes(searchLower)
    );
  });

  const toggleMemberSelection = (userId: string) => {
    setSelectedMembers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return newSet;
    });
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      setNameError('Group name is required');
      return;
    }

    if (!user) return;

    if (selectedMembers.size === 0) {
      dispatch(
        addSnackbar({
          message: 'Please select at least one member',
          type: SnackbarType.WARNING,
        }),
      );
      return;
    }

    try {
      setLoading(true);
      const participantIds = [user.uid, ...Array.from(selectedMembers)];
      
      const chat = await ChatService.createGroupChat(
        participantIds,
        {
          name: groupName,
          description: groupDescription || undefined,
          createdBy: user.uid,
          admins: [user.uid],
          members: participantIds,
        },
        user.uid,
      );

      dispatch(addChat(chat));
      dispatch(setCurrentChat(chat));
      dispatch(
        addSnackbar({
          message: 'Group created successfully',
          type: SnackbarType.SUCCESS,
        }),
      );
      navigation.navigate('ChatScreen' as never, {chatId: chat.chatId});
    } catch (error) {
      dispatch(
        addSnackbar({
          message: 'Failed to create group',
          type: SnackbarType.ERROR,
        }),
      );
    } finally {
      setLoading(false);
    }
  };

  const renderContactItem = ({item}: {item: User}) => {
    const isSelected = selectedMembers.has(item.uid);
    const displayName = item.displayName || item.username || item.email || 'User';

    return (
      <TouchableOpacity
        style={styles.contactItem}
        onPress={() => toggleMemberSelection(item.uid)}>
        <Avatar
          name={displayName}
          imageUri={item.photoURL}
          size={50}
        />
        <View style={styles.contactInfo}>
          <Text style={styles.contactName} numberOfLines={1}>
            {displayName}
          </Text>
          {item.email && (
            <Text style={styles.contactEmail} numberOfLines={1}>
              {item.email}
            </Text>
          )}
        </View>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && (
            <Icon name="checkmark" size={20} color={colors.white} />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={colors.white} barStyle="dark-content" />
      
      <View style={[styles.header, {paddingTop: insets.top + verticalScale(12)}]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Group</Text>
        <TouchableOpacity
          onPress={handleCreateGroup}
          disabled={loading || !groupName.trim() || selectedMembers.size === 0}
          style={[
            styles.createButton,
            (!groupName.trim() || selectedMembers.size === 0) && styles.createButtonDisabled,
          ]}>
          <Text
            style={[
              styles.createButtonText,
              (!groupName.trim() || selectedMembers.size === 0) && styles.createButtonTextDisabled,
            ]}>
            Create
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Group Name</Text>
          <TextInput
            style={[styles.input, nameError && styles.inputError]}
            placeholder="Enter group name"
            placeholderTextColor={colors.textSecondary}
            value={groupName}
            onChangeText={text => {
              setGroupName(text);
              setNameError('');
            }}
            maxLength={50}
          />
          {nameError ? (
            <Text style={styles.errorText}>{nameError}</Text>
          ) : null}
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter group description"
            placeholderTextColor={colors.textSecondary}
            value={groupDescription}
            onChangeText={setGroupDescription}
            multiline
            numberOfLines={3}
            maxLength={200}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Add Members ({selectedMembers.size} selected)
          </Text>
          
          <View style={styles.searchContainer}>
            <Icon name="search-outline" size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search contacts..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>

          {loadingContacts ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>Loading contacts...</Text>
            </View>
          ) : filteredContacts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="people-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>
                {searchQuery
                  ? 'No contacts found'
                  : 'No contacts available. Start chatting to add people here.'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredContacts}
              renderItem={renderContactItem}
              keyExtractor={item => item.uid}
              scrollEnabled={false}
              ListHeaderComponent={
                <Text style={styles.contactsSubtitle}>
                  Select people from your existing chats
                </Text>
              }
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: horizontalScale(16),
    paddingBottom: verticalScale(12),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    flex: 1,
    fontSize: moderateScale(20),
    ...fonts.semiBold,
    color: colors.text,
  },
  createButton: {
    paddingHorizontal: horizontalScale(16),
    paddingVertical: verticalScale(8),
    borderRadius: moderateScale(8),
    backgroundColor: colors.primary,
  },
  createButtonDisabled: {
    backgroundColor: colors.border,
  },
  createButtonText: {
    fontSize: moderateScale(16),
    ...fonts.semiBold,
    color: colors.white,
  },
  createButtonTextDisabled: {
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: horizontalScale(16),
    paddingBottom: verticalScale(32),
  },
  inputSection: {
    marginBottom: verticalScale(24),
  },
  inputLabel: {
    fontSize: moderateScale(14),
    ...fonts.semiBold,
    color: colors.text,
    marginBottom: verticalScale(8),
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: moderateScale(12),
    paddingHorizontal: horizontalScale(16),
    paddingVertical: verticalScale(12),
    fontSize: moderateScale(16),
    ...fonts.regular,
    color: colors.text,
  },
  inputError: {
    borderColor: colors.error,
  },
  textArea: {
    minHeight: verticalScale(80),
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: moderateScale(12),
    ...fonts.regular,
    color: colors.error,
    marginTop: verticalScale(4),
  },
  section: {
    marginTop: verticalScale(8),
  },
  sectionTitle: {
    fontSize: moderateScale(18),
    ...fonts.semiBold,
    color: colors.text,
    marginBottom: verticalScale(16),
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: moderateScale(12),
    paddingHorizontal: horizontalScale(16),
    height: verticalScale(44),
    marginBottom: verticalScale(16),
    gap: horizontalScale(12),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(15),
    ...fonts.regular,
    color: colors.text,
  },
  contactsSubtitle: {
    fontSize: moderateScale(13),
    ...fonts.regular,
    color: colors.textSecondary,
    marginBottom: verticalScale(12),
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: verticalScale(12),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
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
  contactEmail: {
    fontSize: moderateScale(13),
    ...fonts.regular,
    color: colors.textSecondary,
  },
  checkbox: {
    width: horizontalScale(24),
    height: horizontalScale(24),
    borderRadius: moderateScale(12),
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: horizontalScale(12),
  },
  checkboxSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(40),
    gap: horizontalScale(12),
  },
  loadingText: {
    fontSize: moderateScale(14),
    ...fonts.regular,
    color: colors.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(60),
  },
  emptyText: {
    fontSize: moderateScale(14),
    ...fonts.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: verticalScale(16),
    paddingHorizontal: horizontalScale(32),
  },
});

export default GroupCreateScreen;
