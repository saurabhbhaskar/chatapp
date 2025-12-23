import React, {useState, useCallback, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSelector} from 'react-redux';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  horizontalScale,
  moderateScale,
  verticalScale,
} from '../../Components/Common/View/ResponsiveDesign';
import {colors} from '../../Helper/colors';
import {fonts} from '../../Helper/fontsUtils';
import {StringUtils} from '../../Helper/StringUtils';
import {UserService, GroupService, ChatService} from '../../services';
import {User} from '../../types';
import strings from '../../Constants/strings';

const AddMembersScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {chatId} = route.params as {chatId: string};
  const {user} = useSelector((state: any) => state.auth);
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [addingMembers, setAddingMembers] = useState(false);
  const [currentChat, setCurrentChat] = useState<any>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load current chat to get existing members
  useEffect(() => {
    const loadChat = async () => {
      try {
        const chat = await ChatService.getChat(chatId);
        setCurrentChat(chat);
      } catch (error) {
      }
    };
    loadChat();
  }, [chatId]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);

      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      if (!query || !query.trim()) {
        setSearchResults([]);
        setSearchError('');
        return;
      }

      const trimmedQuery = query.trim();

      if (trimmedQuery.length < 2) {
        setSearchResults([]);
        setSearchError('');
        return;
      }

      searchTimeoutRef.current = setTimeout(async () => {
        setIsSearching(true);
        setSearchError('');

        try {
          const searchPromise = UserService.searchUser(trimmedQuery);
          const timeoutPromise = new Promise<null>((resolve) =>
            setTimeout(() => {
              resolve(null);
            }, 5000),
          );

          const foundUser = await Promise.race([searchPromise, timeoutPromise]);

          if (foundUser) {
            const isCurrentUser = foundUser.uid === user?.uid;
            const isExistingMember =
              currentChat?.participants?.includes(foundUser.uid);
            const isAlreadySelected = selectedMembers.includes(foundUser.uid);

            if (isCurrentUser) {
              setSearchResults([]);
              setSearchError('This is your own profile');
            } else if (isExistingMember) {
              setSearchResults([]);
              setSearchError('User is already in the group');
            } else if (isAlreadySelected) {
              setSearchResults([]);
              setSearchError('User already selected');
            } else {
              setSearchResults([foundUser]);
              setSearchError('');
            }
          } else {
            setSearchResults([]);
            setSearchError('No user found');
          }
        } catch (error) {
          setSearchError('Error searching user');
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    },
    [user, currentChat, selectedMembers],
  );

  const handleSelectMember = (selectedUser: User) => {
    if (selectedMembers.includes(selectedUser.uid)) {
      setSelectedMembers(selectedMembers.filter(id => id !== selectedUser.uid));
    } else {
      setSelectedMembers([...selectedMembers, selectedUser.uid]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleAddMembers = async () => {
    if (selectedMembers.length === 0 || !user) {
      Alert.alert('Error', 'Please select at least one member to add');
      return;
    }

    try {
      setAddingMembers(true);
      await GroupService.addMembers(chatId, selectedMembers, user.uid);
      Alert.alert('Success', 'Members added successfully', [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.message || 'Failed to add members. Please try again.',
      );
    } finally {
      setAddingMembers(false);
    }
  };

  // Render search result item
  const renderSearchResult = ({item}: {item: User}) => {
    const displayName =
      item.displayName || item.email || item.username || 'Unknown User';
    const subtitle = item.email || item.phoneNumber || item.username || '';
    const isSelected = selectedMembers.includes(item.uid);

    return (
      <TouchableOpacity
        style={[
          styles.searchResultItem,
          isSelected && styles.searchResultItemSelected,
        ]}
        onPress={() => handleSelectMember(item)}>
        <View style={styles.searchAvatar}>
          <Text style={styles.searchAvatarText}>
            {StringUtils.getInitials(displayName)}
          </Text>
        </View>
        <View style={styles.searchResultContent}>
          <Text style={styles.searchResultName} numberOfLines={1}>
            {displayName}
          </Text>
          {subtitle && (
            <Text style={styles.searchResultSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Text style={styles.selectedIndicatorText}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Render selected member
  const renderSelectedMember = ({item: userId}: {item: string}) => {
    // For now, just show UID. In production, you'd fetch user details
    return (
      <View style={styles.selectedMemberChip}>
        <Text style={styles.selectedMemberText}>{userId.substring(0, 8)}</Text>
        <TouchableOpacity
          onPress={() =>
            setSelectedMembers(selectedMembers.filter(id => id !== userId))
          }>
          <Text style={styles.removeButton}>✕</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={colors.primary} barStyle="light-content" />
      <View style={[styles.header, {paddingTop: insets.top + verticalScale(12)}]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>{strings.back}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Members</Text>
        <TouchableOpacity
          onPress={handleAddMembers}
          disabled={selectedMembers.length === 0 || addingMembers}>
          <Text
            style={[
              styles.addButton,
              (selectedMembers.length === 0 || addingMembers) &&
                styles.addButtonDisabled,
            ]}>
            {addingMembers ? 'Adding...' : 'Add'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Selected Members */}
      {selectedMembers.length > 0 && (
        <View style={styles.selectedContainer}>
          <Text style={styles.selectedLabel}>
            Selected ({selectedMembers.length}):
          </Text>
          <FlatList
            data={selectedMembers}
            renderItem={renderSelectedMember}
            keyExtractor={item => item}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.selectedList}
          />
        </View>
      )}

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search by username, phone, or email..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="default"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setSearchResults([]);
                setSearchError('');
                if (searchTimeoutRef.current) {
                  clearTimeout(searchTimeoutRef.current);
                }
              }}
              style={styles.clearButton}>
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Search Results */}
      {isSearching && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      )}

      {searchError && !isSearching && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{searchError}</Text>
        </View>
      )}

      {searchResults.length > 0 && !isSearching && (
        <FlatList
          data={searchResults}
          renderItem={renderSearchResult}
          keyExtractor={item => item.uid}
          style={styles.resultsList}
        />
      )}

      {!isSearching &&
        searchResults.length === 0 &&
        !searchError &&
        searchQuery.length >= 2 && (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: horizontalScale(16),
    paddingBottom: verticalScale(12),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    fontSize: moderateScale(16),
    ...fonts.medium,
    color: colors.white,
  },
  headerTitle: {
    fontSize: moderateScale(18),
    ...fonts.semiBold,
    color: colors.white,
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    fontSize: moderateScale(16),
    ...fonts.semiBold,
    color: colors.white,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  selectedContainer: {
    backgroundColor: colors.white,
    paddingVertical: verticalScale(12),
    paddingHorizontal: horizontalScale(16),
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  selectedLabel: {
    fontSize: moderateScale(14),
    ...fonts.semiBold,
    color: colors.text,
    marginBottom: verticalScale(8),
  },
  selectedList: {
    gap: horizontalScale(8),
  },
  selectedMemberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: horizontalScale(12),
    paddingVertical: verticalScale(6),
    borderRadius: moderateScale(16),
    marginRight: horizontalScale(8),
  },
  selectedMemberText: {
    fontSize: moderateScale(12),
    ...fonts.medium,
    color: colors.white,
    marginRight: horizontalScale(6),
  },
  removeButton: {
    fontSize: moderateScale(14),
    color: colors.white,
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
    backgroundColor: colors.background,
    borderRadius: moderateScale(20),
    paddingHorizontal: horizontalScale(16),
    paddingVertical: verticalScale(8),
  },
  searchInput: {
    flex: 1,
    fontSize: moderateScale(16),
    ...fonts.regular,
    color: colors.text,
  },
  clearButton: {
    padding: horizontalScale(4),
  },
  clearButtonText: {
    fontSize: moderateScale(18),
    color: colors.textSecondary,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(20),
  },
  loadingText: {
    fontSize: moderateScale(14),
    ...fonts.regular,
    color: colors.textSecondary,
    marginLeft: horizontalScale(8),
  },
  errorContainer: {
    padding: horizontalScale(16),
    alignItems: 'center',
  },
  errorText: {
    fontSize: moderateScale(14),
    ...fonts.regular,
    color: colors.error,
  },
  resultsList: {
    flex: 1,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: horizontalScale(16),
    paddingVertical: verticalScale(12),
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchResultItemSelected: {
    backgroundColor: colors.primaryLight + '20',
  },
  searchAvatar: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: horizontalScale(12),
  },
  searchAvatarText: {
    fontSize: moderateScale(16),
    ...fonts.semiBold,
    color: colors.white,
  },
  searchResultContent: {
    flex: 1,
  },
  searchResultName: {
    fontSize: moderateScale(16),
    ...fonts.semiBold,
    color: colors.text,
    marginBottom: verticalScale(2),
  },
  searchResultSubtitle: {
    fontSize: moderateScale(14),
    ...fonts.regular,
    color: colors.textSecondary,
  },
  selectedIndicator: {
    width: moderateScale(24),
    height: moderateScale(24),
    borderRadius: moderateScale(12),
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedIndicatorText: {
    fontSize: moderateScale(16),
    ...fonts.semiBold,
    color: colors.white,
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
  },
});

export default AddMembersScreen;

