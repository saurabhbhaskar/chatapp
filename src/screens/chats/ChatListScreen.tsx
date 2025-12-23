import React, {useEffect, useState, useCallback, useRef} from 'react';
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
import {TimeUtils} from '../../Helper/TimeUtils';
import {StringUtils} from '../../Helper/StringUtils';
import {ChatService, UserService} from '../../services';
import {getUser} from '../../firebase/database';
import {setChats, setCurrentChat} from '../../Redux/chatSlice';
import {logout} from '../../Redux/authSlice';
import {AuthService} from '../../services';
import strings from '../../Constants/strings';
import EmptyDataView from '../../Components/Common/View/EmptyDataView';
import Loader from '../../Components/Common/View/Loader';
import BottomNavBar from '../../Components/Common/BottomNavBar';
import {Chat, User} from '../../types';

const ChatListScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const {chats, loading} = useSelector((state: any) => state.chat);
  const {user} = useSelector((state: any) => state.auth);
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'calls' | 'messages' | 'settings'>('messages');
  const [showFABMenu, setShowFABMenu] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (user) {
        loadChats();
      }
      setActiveTab('messages');
    }, [user]),
  );

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const loadChats = async () => {
    if (!user) return;

    try {
      const chatIds = await ChatService.getUserChats(user.uid);
      
      if (chatIds.length === 0) {
        dispatch(setChats([]));
        return;
      }

      const chatPromises = chatIds.map(id => ChatService.getChat(id));
      const chatList = await Promise.all(chatPromises);
      const validChats = chatList.filter(chat => chat !== null) as Chat[];
      
      const chatsWithDetails = await Promise.all(
        validChats.map(async (chat) => {
          if (chat.type === 'direct' && chat.participants) {
            const otherUserId = chat.participants.find(
              (id: string) => id !== user.uid,
            );
            if (otherUserId) {
              try {
                const otherUser = await getUser(otherUserId);
                if (otherUser) {
                  chat.participantDetails = [otherUser];
                }
              } catch (error) {
              }
            }
          }
          return chat;
        }),
      );

      chatsWithDetails.sort((a, b) => {
        const timeA = a.lastMessageTime || 0;
        const timeB = b.lastMessageTime || 0;
        return timeB - timeA;
      });

      dispatch(setChats(chatsWithDetails));
    } catch (error: any) {
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadChats();
    setRefreshing(false);
  };

  const handleChatPress = (chat: Chat) => {
    dispatch(setCurrentChat(chat));
    (navigation as any).navigate('ChatScreen', {chatId: chat.chatId});
  };

  const handleLogout = async () => {
    try {
      await AuthService.logout();
      dispatch(logout());
    } catch (error) {
    }
  };

  const handleSearch = useCallback(
    (text: string) => {
      setSearchQuery(text);
      setSearchError('');

      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      if (text.length < 2) {
        setSearchResults([]);
        setShowSearchResults(false);
        setIsSearching(false);
        return;
      }

      setShowSearchResults(true);
      setIsSearching(true);

      searchTimeoutRef.current = setTimeout(async () => {
        try {
          const results = await UserService.searchUsers(text);
          const filteredResults = results.filter(
            (foundUser: User) => foundUser.uid !== user?.uid,
          );
          setSearchResults(filteredResults || []);
          setSearchError('');
        } catch (error) {
          setSearchError('Error searching user');
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 300);
    },
    [user],
  );

  const handleSearchResultPress = async (selectedUser: User) => {
    if (!user || !selectedUser) return;

    try {
      setShowSearchResults(false);
      setSearchQuery('');
      setSearchResults([]);
      setIsSearching(false);

      const chat = await ChatService.createDirectChat([user.uid, selectedUser.uid]);
      
      if (chat) {
        if (chat.type === 'direct' && chat.participants) {
          const otherUserId = chat.participants.find(
            (id: string) => id !== user.uid,
          );
          if (otherUserId) {
            try {
              const otherUserData = await getUser(otherUserId);
              if (otherUserData) {
                chat.participantDetails = [otherUserData];
                }
              } catch (error) {
              }
            }
          }
        
        await loadChats();
        dispatch(setCurrentChat(chat));
        (navigation as any).navigate('ChatScreen', {chatId: chat.chatId});
      } else {
        setSearchError('Error creating chat');
      }
    } catch (error) {
      setSearchError('Error opening chat');
    }
  };

  const renderSearchResult = ({item}: {item: User}) => {
    const displayName = item.displayName || item.email || item.username || 'Unknown User';
    const subtitle = item.email || item.phoneNumber || item.username || '';

    return (
      <TouchableOpacity
        style={styles.searchResultItem}
        onPress={() => handleSearchResultPress(item)}>
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
      </TouchableOpacity>
    );
  };

  const renderChatItem = ({item}: {item: Chat}) => {
    let chatName = 'Unknown';
    if (item.type === 'group') {
      chatName = item.groupInfo?.name || 'Group';
    } else if (item.type === 'direct') {
      const otherParticipant = item.participantDetails?.find(
        (p: User) => p.uid !== user?.uid,
      );
      if (otherParticipant) {
        chatName =
          otherParticipant.displayName ||
          otherParticipant.email ||
          otherParticipant.username ||
          'Unknown';
      } else {
        const otherParticipantId = item.participants.find(
          (p: string) => p !== user?.uid,
        );
        if (otherParticipantId) {
          chatName = 'Loading...';
        }
      }
    }

    const lastMessage = item.lastMessage?.text || 'No messages yet';
    const lastMessageTime = item.lastMessageTime
      ? TimeUtils.formatTime(item.lastMessageTime)
      : '';
    const unreadCount = item.unreadCount || 0;

    const avatarColors = ['#5B8FE8', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];
    const colorIndex = chatName.charCodeAt(0) % avatarColors.length;
    const avatarColor = avatarColors[colorIndex];

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => handleChatPress(item)}>
        <View style={[styles.avatar, {backgroundColor: avatarColor}]}>
          <Text style={styles.avatarText}>
            {StringUtils.getInitials(chatName)}
          </Text>
        </View>
        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatName} numberOfLines={1}>
              {chatName}
            </Text>
            {lastMessageTime && (
              <Text style={styles.chatTime}>{lastMessageTime}</Text>
            )}
          </View>
          <View style={styles.chatFooter}>
            <Text style={styles.chatLastMessage} numberOfLines={1}>
              {lastMessage}
            </Text>
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const handleTabPress = (tab: 'calls' | 'messages' | 'settings') => {
    setActiveTab(tab);
    switch (tab) {
      case 'messages':
        break;
      case 'calls':
        (navigation as any).navigate('CallsScreen');
        break;
      case 'settings':
        (navigation as any).navigate('SettingsScreen');
        break;
    }
  };

  const handleFABPress = () => {
    setShowFABMenu(!showFABMenu);
  };

  const handleFABOption = (option: string) => {
    setShowFABMenu(false);
    switch (option) {
      case 'Chat':
        break;
      case 'Group':
        (navigation as any).navigate('GroupCreateScreen');
        break;
      default:
        break;
    }
  };

  if (loading) {
    return <Loader />;
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#5B8FE8" barStyle="light-content" />
      
      <View style={[styles.header, {paddingTop: insets.top + verticalScale(16)}]}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity>
          <Icon name="notifications-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon name="search-outline" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search chats"
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={handleSearch}
            onFocus={() => {
              if (searchQuery && searchQuery.length >= 2) {
                setShowSearchResults(true);
              }
            }}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery && searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setSearchResults([]);
                setShowSearchResults(false);
                setSearchError('');
                if (searchTimeoutRef.current) {
                  clearTimeout(searchTimeoutRef.current);
                }
              }}>
              <Icon name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {showSearchResults && (
        <View style={styles.searchResultsContainer}>
          {isSearching ? (
            <View style={styles.searchLoadingContainer}>
              <ActivityIndicator size="small" color="#5B8FE8" />
              <Text style={styles.searchLoadingText}>Searching...</Text>
            </View>
          ) : searchError ? (
            <View style={styles.searchErrorContainer}>
              <Text style={styles.searchErrorText}>{searchError}</Text>
            </View>
          ) : searchResults && searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={item => item.uid}
              style={styles.searchResultsList}
            />
          ) : searchQuery && searchQuery.length >= 2 ? (
            <View style={styles.searchErrorContainer}>
              <Text style={styles.searchErrorText}>No user found</Text>
            </View>
          ) : null}
        </View>
      )}

      <FlatList
        data={chats}
        renderItem={renderChatItem}
        keyExtractor={item => item.chatId}
        contentContainerStyle={
          chats.length === 0 ? styles.emptyContainer : styles.chatListContent
        }
        ListEmptyComponent={
          <EmptyDataView message={strings.noChats} icon="💬" />
        }
        refreshing={refreshing}
        onRefresh={handleRefresh}
        style={showSearchResults ? styles.chatListHidden : undefined}
      />

      {showFABMenu && (
        <View style={styles.fabMenu}>
          <TouchableOpacity
            style={[styles.fabMenuItem, styles.fabMenuItemBorder]}
            onPress={() => handleFABOption('Chat')}>
            <Text style={styles.fabMenuText}>Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.fabMenuItem, styles.fabMenuItemBorder]}
            onPress={() => handleFABOption('Contact')}>
            <Text style={styles.fabMenuText}>Contact</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.fabMenuItem, styles.fabMenuItemBorder]}
            onPress={() => handleFABOption('Group')}>
            <Text style={styles.fabMenuText}>Group</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.fabMenuItem, styles.fabMenuItemBorder]}
            onPress={() => handleFABOption('Broadcast')}>
            <Text style={styles.fabMenuText}>Broadcast</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.fabMenuItem}
            onPress={() => handleFABOption('Team')}>
            <Text style={styles.fabMenuText}>Team</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity style={styles.fab} onPress={handleFABPress}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

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
    backgroundColor: '#5B8FE8',
    paddingHorizontal: horizontalScale(20),
    paddingBottom: verticalScale(16),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  chatListContent: {
    paddingBottom: verticalScale(80),
  },
  chatListHidden: {
    display: 'none',
  },
  chatItem: {
    flexDirection: 'row',
    paddingHorizontal: horizontalScale(20),
    paddingVertical: verticalScale(16),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  avatar: {
    width: horizontalScale(56),
    height: horizontalScale(56),
    borderRadius: horizontalScale(28),
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: horizontalScale(12),
  },
  avatarText: {
    fontSize: moderateScale(20),
    ...fonts.bold,
    color: '#FFFFFF',
  },
  chatContent: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: verticalScale(4),
  },
  chatName: {
    fontSize: moderateScale(16),
    ...fonts.semiBold,
    color: '#1F2937',
    flex: 1,
  },
  chatTime: {
    fontSize: moderateScale(12),
    ...fonts.regular,
    color: '#6B7280',
    marginLeft: horizontalScale(8),
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatLastMessage: {
    fontSize: moderateScale(14),
    ...fonts.regular,
    color: '#6B7280',
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: '#1F2937',
    borderRadius: moderateScale(10),
    minWidth: horizontalScale(20),
    height: verticalScale(20),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: horizontalScale(6),
    marginLeft: horizontalScale(8),
  },
  unreadText: {
    fontSize: moderateScale(11),
    ...fonts.semiBold,
    color: '#FFFFFF',
  },
  fab: {
    position: 'absolute',
    right: horizontalScale(24),
    bottom: verticalScale(100),
    width: horizontalScale(56),
    height: horizontalScale(56),
    borderRadius: horizontalScale(28),
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    zIndex: 10,
  },
  fabText: {
    fontSize: moderateScale(32),
    ...fonts.bold,
    color: '#FFFFFF',
  },
  fabMenu: {
    position: 'absolute',
    right: horizontalScale(24),
    bottom: verticalScale(170),
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(8),
    minWidth: horizontalScale(140),
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.2,
    shadowRadius: 8,
    zIndex: 9,
  },
  fabMenuItem: {
    paddingHorizontal: horizontalScale(20),
    paddingVertical: verticalScale(12),
  },
  fabMenuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  fabMenuText: {
    fontSize: moderateScale(15),
    ...fonts.medium,
    color: '#1F2937',
  },
  searchResultsContainer: {
    backgroundColor: '#FFFFFF',
    maxHeight: verticalScale(300),
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchResultsList: {
    flexGrow: 0,
  },
  searchResultItem: {
    flexDirection: 'row',
    paddingHorizontal: horizontalScale(20),
    paddingVertical: verticalScale(12),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchAvatar: {
    width: horizontalScale(40),
    height: horizontalScale(40),
    borderRadius: horizontalScale(20),
    backgroundColor: '#5B8FE8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: horizontalScale(12),
  },
  searchAvatarText: {
    fontSize: moderateScale(16),
    ...fonts.bold,
    color: '#FFFFFF',
  },
  searchResultContent: {
    flex: 1,
    justifyContent: 'center',
  },
  searchResultName: {
    fontSize: moderateScale(16),
    ...fonts.semiBold,
    color: '#1F2937',
    marginBottom: verticalScale(2),
  },
  searchResultSubtitle: {
    fontSize: moderateScale(14),
    ...fonts.regular,
    color: '#6B7280',
  },
  searchLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(20),
    gap: horizontalScale(12),
  },
  searchLoadingText: {
    fontSize: moderateScale(14),
    ...fonts.regular,
    color: '#6B7280',
  },
  searchErrorContainer: {
    paddingVertical: verticalScale(20),
    alignItems: 'center',
  },
  searchErrorText: {
    fontSize: moderateScale(14),
    ...fonts.regular,
    color: '#DC2626',
  },
});

export default ChatListScreen;
