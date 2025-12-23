import React, {useEffect, useState, useRef, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  Modal,
  ActivityIndicator,
  Keyboard,
  Alert,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useDispatch, useSelector} from 'react-redux';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  horizontalScale,
  moderateScale,
  verticalScale,
} from '../../Components/Common/View/ResponsiveDesign';
import {colors} from '../../Helper/colors';
import {fonts} from '../../Helper/fontsUtils';
import {MessageService, ChatService} from '../../services';
import {setMessages, updateMessage, setCurrentChat} from '../../Redux/chatSlice';
import {addSnackbar, SnackbarType} from '../../Redux/snackbarSlice';
import {Message, User} from '../../types';
import {getUser} from '../../firebase/database';
import Avatar from '../../Components/Common/Avatar';
import MessageBubble from '../../Components/Common/MessageBubble';
import SystemMessage from '../../Components/Common/SystemMessage';

const ChatScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const {chatId} = route.params as {chatId: string};
  const {messages, currentChat} = useSelector((state: any) => state.chat);
  const {user} = useSelector((state: any) => state.auth);
  const insets = useSafeAreaInsets();
  const [messageText, setMessageText] = useState('');
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [typingUsers, setTypingUsers] = useState<{[uid: string]: boolean}>({});
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const [showMessageMenu, setShowMessageMenu] = useState(false);
  const [userCache, setUserCache] = useState<{[uid: string]: User}>({});
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchingUsersRef = useRef<Set<string>>(new Set());

  const chatMessages = messages[chatId] || [];

  const getParticipantsArray = (participants: any): string[] => {
    if (!participants) return [];
    if (Array.isArray(participants)) return participants;
    if (typeof participants === 'object') return Object.keys(participants);
    return [];
  };

  useEffect(() => {
    if (!currentChat || !user) return;

    const participants = getParticipantsArray(currentChat.participants);

    if (currentChat.type === 'direct' && participants.length > 0) {
      const otherUserId = participants.find((id: string) => id !== user.uid);
      if (otherUserId) {
        getUser(otherUserId)
          .then(userData => {
            if (userData) {
              setOtherUser(userData);
            }
          })
          .catch(() => {});
      }
    }
  }, [currentChat, user]);

  useEffect(() => {
    if (!chatId || !user) return;
    const unsubscribe = ChatService.watchChat(chatId, (chat) => {
      if (chat) {
        dispatch(setCurrentChat(chat));
      }
    });

    return () => unsubscribe();
  }, [chatId, user, dispatch]);

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({animated: true});
        }, 100);
      }
    );
    
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  useEffect(() => {
    if (currentChat?.type !== 'group' || !chatMessages.length || !user) return;

    const fetchUserInfo = async () => {
      const uniqueSenderIds = new Set<string>();
      chatMessages.forEach((msg: Message) => {
        if (msg.senderId && msg.senderId !== 'system' && msg.senderId !== user.uid) {
          uniqueSenderIds.add(msg.senderId);
        }
      });

      setUserCache((prevCache) => {
        const promises: Promise<{uid: string; user: User | null}>[] = [];

        uniqueSenderIds.forEach((senderId) => {
          if (!prevCache[senderId] && !fetchingUsersRef.current.has(senderId)) {
            fetchingUsersRef.current.add(senderId);
            promises.push(
              getUser(senderId)
                .then((userData) => {
                  fetchingUsersRef.current.delete(senderId);
                  return {
                    uid: senderId,
                    user: userData,
                  };
                })
                .catch(() => {
                  fetchingUsersRef.current.delete(senderId);
                  return {
                    uid: senderId,
                    user: null,
                  };
                })
            );
          }
        });

        if (promises.length > 0) {
          Promise.all(promises).then((results) => {
            setUserCache((currentCache) => {
              const newCache = {...currentCache};
              results.forEach(({uid, user: userData}) => {
                if (userData && !newCache[uid]) {
                  newCache[uid] = userData;
                }
              });
              return newCache;
            });
          });
        }

        return prevCache;
      });
    };

    fetchUserInfo();
  }, [chatMessages.length, currentChat?.type, user?.uid]);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const msgs = await MessageService.getMessages(chatId);
        dispatch(setMessages({chatId, messages: msgs}));
      } catch {
      }
    };

    loadMessages();
    const unsubscribe = MessageService.watchMessages(
      chatId,
      (msgs: Message[]) => {
        dispatch(setMessages({chatId, messages: msgs}));
      },
    );

    return () => unsubscribe();
  }, [chatId, dispatch]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = MessageService.watchTyping(chatId, (typing) => {
      const othersTyping: {[uid: string]: boolean} = {};
      Object.keys(typing).forEach((uid) => {
        if (uid !== user.uid && typing[uid]) {
          othersTyping[uid] = true;
        }
      });
      setTypingUsers(othersTyping);
    });

    return () => unsubscribe();
  }, [chatId, user]);

  const handleTextChange = useCallback(
    (text: string) => {
      setMessageText(text);
      if (!user) return;

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (text.trim().length > 0) {
        MessageService.setTyping(chatId, user.uid);
      } else {
        MessageService.clearTyping(chatId, user.uid);
      }

      typingTimeoutRef.current = setTimeout(() => {
        MessageService.clearTyping(chatId, user.uid);
      }, 2000);
    },
    [chatId, user],
  );

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (user) {
        MessageService.clearTyping(chatId, user.uid);
      }
    };
  }, [chatId, user]);


  const handleSendMessage = async () => {
    if (!messageText.trim() || !user) return;

    try {
      MessageService.clearTyping(chatId, user.uid);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      if (replyToMessage) {
        await MessageService.sendReplyMessage(
          chatId,
          user.uid,
          messageText.trim(),
          replyToMessage.messageId,
        );
        setReplyToMessage(null);
      } else {
        await MessageService.sendTextMessage(
          chatId,
          user.uid,
          messageText.trim(),
        );
      }

      setMessageText('');
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({animated: true});
      }, 100);
    } catch {
    }
  };

  const handleLongPressMessage = (message: Message) => {
    setSelectedMessage(message);
    setShowMessageMenu(true);
  };

  const handleDeleteForMe = async () => {
    if (!selectedMessage || !user) return;
    try {
      await MessageService.deleteForMe(
        chatId,
        selectedMessage.messageId,
        user.uid,
      );
      dispatch(
        updateMessage({
          chatId,
          messageId: selectedMessage.messageId,
          updates: {
            deletedFor: {
              ...selectedMessage.deletedFor,
              [user.uid]: true,
            },
          },
        }),
      );
      setShowMessageMenu(false);
      setSelectedMessage(null);
      dispatch(
        addSnackbar({
          message: 'Message deleted',
          type: SnackbarType.SUCCESS,
        }),
      );
    } catch {
      dispatch(
        addSnackbar({
          message: 'Failed to delete message',
          type: SnackbarType.ERROR,
        }),
      );
    }
  };

  const handleDeleteForEveryone = async () => {
    if (!selectedMessage || !user) return;
    if (selectedMessage.senderId !== user.uid) {
      dispatch(
        addSnackbar({
          message: 'You can only delete your own messages',
          type: SnackbarType.WARNING,
        }),
      );
      return;
    }
    Alert.alert(
      'Delete for Everyone',
      'Are you sure you want to delete this message for everyone?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await MessageService.deleteForEveryone(
                chatId,
                selectedMessage.messageId,
              );
              dispatch(
                updateMessage({
                  chatId,
                  messageId: selectedMessage.messageId,
                  updates: {
                    deleted: true,
                    text: 'Message deleted',
                  },
                }),
              );
              setShowMessageMenu(false);
              setSelectedMessage(null);
              dispatch(
                addSnackbar({
                  message: 'Message deleted for everyone',
                  type: SnackbarType.SUCCESS,
                }),
              );
            } catch {
              dispatch(
                addSnackbar({
                  message: 'Failed to delete message',
                  type: SnackbarType.ERROR,
                }),
              );
            }
          },
        },
      ],
    );
  };

  const handleForward = async () => {
    if (!selectedMessage) return;
    dispatch(
      addSnackbar({
        message: 'Forward functionality - Coming soon',
        type: SnackbarType.INFO,
      }),
    );
    setShowMessageMenu(false);
    setSelectedMessage(null);
  };

  const handleReply = () => {
    if (!selectedMessage) return;
    setReplyToMessage(selectedMessage);
    setShowMessageMenu(false);
    setSelectedMessage(null);
  };

  const getReplyMessage = (replyToId: string): Message | null => {
    return chatMessages.find((msg: Message) => msg.messageId === replyToId) || null;
  };

  const renderMessage = ({item}: {item: Message}) => {
    if (item.type === 'system') {
      return (
        <SystemMessage
          text={item.text || ''}
          timestamp={item.timestamp}
        />
      );
    }

    const isOwnMessage = item.senderId === user?.uid;
    const isDeletedForMe = item.deletedFor?.[user?.uid || ''];
    const isDeleted = item.deleted;
    const replyMessage = item.replyTo
      ? getReplyMessage(item.replyTo)
      : null;

    if (isDeletedForMe) {
      return null;
    }

    const senderUser = item.senderId ? userCache[item.senderId] : null;
    const senderName = isOwnMessage
      ? 'You'
      : senderUser?.displayName || senderUser?.email || senderUser?.username || 'User';
    const senderAvatar = senderUser?.photoURL;

    const showSenderInfo = currentChat?.type === 'group' && !isOwnMessage;

    return (
      <MessageBubble
        text={item.text || ''}
        isOwn={isOwnMessage}
        timestamp={item.timestamp}
        replyTo={
          replyMessage
            ? {
                messageId: replyMessage.messageId,
                text: replyMessage.text || '',
                senderName:
                  replyMessage.senderId === user?.uid
                    ? 'You'
                    : userCache[replyMessage.senderId]?.displayName ||
                      userCache[replyMessage.senderId]?.email ||
                      otherUser?.displayName ||
                      'User',
              }
            : null
        }
        forwardedFrom={item.forwardedFrom ? 'Forwarded' : undefined}
        isDeleted={isDeleted}
        onLongPress={() => handleLongPressMessage(item)}
        onReply={() => {
          setReplyToMessage(item);
        }}
        senderName={showSenderInfo ? senderName : undefined}
        senderAvatar={showSenderInfo ? senderAvatar : undefined}
        showSenderInfo={showSenderInfo}
      />
    );
  };

  const renderTypingIndicator = () => {
    const typingUserIds = Object.keys(typingUsers);
    if (typingUserIds.length === 0) return null;

    return (
      <View style={styles.typingContainer}>
        <ActivityIndicator size="small" color={colors.textSecondary} />
        <Text style={styles.typingText}>
          {typingUserIds.length === 1
            ? `${otherUser?.displayName || 'Someone'} is typing...`
            : 'Multiple people are typing...'}
        </Text>
      </View>
    );
  };

  const getDisplayName = () => {
    if (currentChat?.type === 'group') {
      return currentChat.groupInfo?.name || 'Group';
    }
    return (
      otherUser?.displayName ||
      otherUser?.email ||
      otherUser?.username ||
      'Chat'
    );
  };

  const getSubtitle = () => {
    if (currentChat?.type === 'group') {
      return `${currentChat.participants?.length || 0} members`;
    }
    return otherUser?.email || otherUser?.phoneNumber || '';
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={colors.white} barStyle="dark-content" />
      
      <View style={[styles.header, {paddingTop: insets.top + verticalScale(12)}]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButtonContainer}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.profileContainer}>
          <Avatar
            name={getDisplayName()}
            imageUri={otherUser?.photoURL || currentChat?.groupInfo?.photoURL}
            size={40}
          />
          <View style={styles.profileInfo}>
            <Text style={styles.headerName} numberOfLines={1}>
              {getDisplayName()}
            </Text>
            <Text style={styles.headerSubtitle} numberOfLines={1}>
              {getSubtitle()}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={() => {
            (navigation as any).navigate('GroupInfoScreen', {chatId});
          }}
          style={styles.menuButton}>
          <Icon name="ellipsis-vertical" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.messagesContainer}>
        <FlatList
          ref={flatListRef}
          data={chatMessages}
          renderItem={renderMessage}
          keyExtractor={item => item.messageId}
          contentContainerStyle={styles.messagesList}
          inverted={false}
          onContentSizeChange={() => {
            flatListRef.current?.scrollToEnd({animated: true});
          }}
          ListFooterComponent={renderTypingIndicator}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        />
      </View>

      {replyToMessage && (
        <View style={styles.replyBar}>
          <View style={styles.replyBarContent}>
            <View style={styles.replyBarLine} />
            <View style={styles.replyBarText}>
              <Text style={styles.replyBarLabel}>Replying to</Text>
              <Text style={styles.replyBarMessage} numberOfLines={1}>
                {replyToMessage.text || 'Media'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => setReplyToMessage(null)}
            style={styles.replyBarClose}>
            <Text style={styles.replyBarCloseText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <View
          style={[
            styles.inputContainer,
            {
              paddingBottom: Platform.OS === 'ios' 
                ? Math.max(insets.bottom, verticalScale(10))
                : keyboardHeight > 0 
                  ? verticalScale(10)
                  : Math.max(insets.bottom, verticalScale(10)),
            },
          ]}>
          <TouchableOpacity style={styles.attachButton}>
            <Icon name="add-circle" size={28} color={colors.primary} />
          </TouchableOpacity>
          
          <TextInput
            style={styles.input}
            placeholder="Message"
            placeholderTextColor={colors.textSecondary}
            value={messageText}
            onChangeText={handleTextChange}
            multiline
            onSubmitEditing={handleSendMessage}
          />
          
          {messageText.trim() ? (
            <TouchableOpacity
              style={styles.sendButton}
              onPress={handleSendMessage}>
              <Icon name="send" size={24} color={colors.primary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.micButton}>
              <Icon name="mic" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>

      <Modal
        visible={showMessageMenu}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMessageMenu(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMessageMenu(false)}>
          <View style={styles.messageMenu}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleReply}>
              <Text style={styles.menuItemText}>Reply</Text>
            </TouchableOpacity>
            {selectedMessage?.senderId === user?.uid && (
              <TouchableOpacity
                style={styles.menuItem}
                onPress={handleDeleteForEveryone}>
                <Text style={[styles.menuItemText, styles.deleteText]}>
                  Delete for Everyone
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleDeleteForMe}>
              <Text style={[styles.menuItemText, styles.deleteText]}>
                Delete for Me
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleForward}>
              <Text style={styles.menuItemText}>Forward</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.menuItem, styles.menuItemCancel]}
              onPress={() => setShowMessageMenu(false)}>
              <Text style={styles.menuItemText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  backButtonContainer: {
    padding: horizontalScale(8),
    marginRight: horizontalScale(8),
  },
  profileContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
    marginLeft: horizontalScale(12),
  },
  headerName: {
    fontSize: moderateScale(18),
    ...fonts.bold,
    color: colors.text,
    marginBottom: verticalScale(2),
  },
  headerSubtitle: {
    fontSize: moderateScale(13),
    ...fonts.regular,
    color: colors.textSecondary,
  },
  menuButton: {
    padding: horizontalScale(8),
    marginLeft: horizontalScale(8),
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  messagesList: {
    paddingHorizontal: horizontalScale(16),
    paddingTop: verticalScale(12),
    paddingBottom: verticalScale(8),
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: horizontalScale(16),
    paddingVertical: verticalScale(8),
  },
  typingText: {
    fontSize: moderateScale(12),
    ...fonts.regular,
    color: colors.textSecondary,
    marginLeft: horizontalScale(8),
  },
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: horizontalScale(16),
    paddingVertical: verticalScale(8),
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  replyBarContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyBarLine: {
    width: 3,
    height: '100%',
    backgroundColor: colors.primary,
    marginRight: horizontalScale(8),
  },
  replyBarText: {
    flex: 1,
  },
  replyBarLabel: {
    fontSize: moderateScale(12),
    ...fonts.semiBold,
    color: colors.primary,
  },
  replyBarMessage: {
    fontSize: moderateScale(14),
    ...fonts.regular,
    color: colors.text,
  },
  replyBarClose: {
    padding: horizontalScale(8),
  },
  replyBarCloseText: {
    fontSize: moderateScale(18),
    color: colors.textSecondary,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: horizontalScale(12),
    paddingTop: verticalScale(10),
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'flex-end',
    minHeight: verticalScale(60),
  },
  attachButton: {
    marginRight: horizontalScale(8),
    padding: horizontalScale(4),
  },
  input: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: moderateScale(20),
    paddingHorizontal: horizontalScale(16),
    paddingVertical: verticalScale(10),
    fontSize: moderateScale(16),
    ...fonts.regular,
    color: colors.text,
    maxHeight: verticalScale(100),
    marginRight: horizontalScale(8),
    borderWidth: 0,
  },
  sendButton: {
    padding: horizontalScale(8),
  },
  micButton: {
    padding: horizontalScale(8),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageMenu: {
    backgroundColor: colors.white,
    borderRadius: moderateScale(12),
    paddingVertical: verticalScale(8),
    minWidth: horizontalScale(200),
  },
  menuItem: {
    paddingHorizontal: horizontalScale(20),
    paddingVertical: verticalScale(12),
  },
  menuItemCancel: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: verticalScale(4),
  },
  menuItemText: {
    fontSize: moderateScale(16),
    ...fonts.regular,
    color: colors.text,
  },
  deleteText: {
    color: colors.error,
  },
});

export default ChatScreen;
