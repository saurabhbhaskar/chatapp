import database from '@react-native-firebase/database';
import {Chat, Message, User} from '../types';
import {ValidationUtils} from '../Helper/ValidationUtils';

const db = database();

export const getDatabase = () => db;

// User operations
// Helper function to encode email for Firebase paths
// Firebase paths cannot contain ".", "#", "$", "[", or "]"
const encodeEmailForPath = (email: string): string => {
  return email
    .toLowerCase()
    .trim()
    .replace(/\./g, '_DOT_')
    .replace(/@/g, '_AT_')
    .replace(/#/g, '_HASH_')
    .replace(/\$/g, '_DOLLAR_')
    .replace(/\[/g, '_LBRACKET_')
    .replace(/\]/g, '_RBRACKET_');
};

export const getUserRef = (uid: string) => {
  return db.ref(`users/${uid}`);
};

export const getUser = async (uid: string): Promise<User | null> => {
  try {
    const snapshotPromise = getUserRef(uid).once('value');
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('getUser timeout after 5 seconds')), 5000);
    });
    
    const snapshot = await Promise.race([snapshotPromise, timeoutPromise]) as any;
    const userData = snapshot.val();
    return userData;
  } catch (error) {
    return null;
  }
};

export const updateUser = async (uid: string, updates: Partial<User>): Promise<void> => {
  await getUserRef(uid).update({
    ...updates,
    updatedAt: Date.now(),
  });
};

export const createUser = async (user: User): Promise<void> => {
  try {
    const setPromise = getUserRef(user.uid).set({
      ...user,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('createUser timeout after 5 seconds')), 5000);
    });
    
    await Promise.race([setPromise, timeoutPromise]);

    const updates: any = {};
    
    if (user.username) {
      updates[`usernames/${user.username}`] = user.uid;
    }
    
    if (user.phoneNumber) {
      const normalizedPhone = user.phoneNumber.replace(/[\s\-()]/g, '');
      updates[`phones/${normalizedPhone}`] = user.uid;
    }
    
    if (user.email) {
      const encodedEmail = encodeEmailForPath(user.email);
      updates[`emails/${encodedEmail}`] = user.uid;
    }
    
    if (Object.keys(updates).length > 0) {
      try {
        await db.ref().update(updates);
      } catch (lookupError) {
      }
    }
  } catch (error) {
    throw error;
  }
};

// Chat operations
export const getChatRef = (chatId: string) => {
  return db.ref(`chats/${chatId}`);
};

export const getChat = async (chatId: string): Promise<Chat | null> => {
  const snapshot = await getChatRef(chatId).once('value');
  const chatData = snapshot.val();
  if (!chatData) return null;

  // Convert participants object back to array for TypeScript compatibility
  if (chatData.participants && typeof chatData.participants === 'object' && !Array.isArray(chatData.participants)) {
    chatData.participants = Object.keys(chatData.participants);
  }

  return chatData;
};

export const getUserChatsRef = (uid: string) => {
  return db.ref(`userChats/${uid}`);
};

export const getUserChats = async (uid: string): Promise<string[]> => {
  const snapshot = await getUserChatsRef(uid).once('value');
  const data = snapshot.val();
  return data ? Object.keys(data) : [];
};

export const createChat = async (chat: Chat): Promise<void> => {
  // Convert participants array to object for Firebase rules (hasChild works with objects)
  const participantsObj: {[uid: string]: boolean} = {};
  chat.participants.forEach(uid => {
    participantsObj[uid] = true;
  });

  // Use multi-path update for atomicity (all or nothing)
  const updates: any = {
    [`chats/${chat.chatId}`]: {
      ...chat,
      participants: participantsObj, // Store as object for rules compatibility
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  };

  // Add chat to each participant's userChats
  for (const participantId of chat.participants) {
    updates[`userChats/${participantId}/${chat.chatId}`] = true;
  }

  // Execute all updates atomically
  await db.ref().update(updates);
};

export const updateChat = async (chatId: string, updates: Partial<Chat>): Promise<void> => {
  await getChatRef(chatId).update({
    ...updates,
    updatedAt: Date.now(),
  });
};

// Message operations
export const getMessagesRef = (chatId: string) => {
  return db.ref(`messages/${chatId}`);
};

export const getMessages = async (chatId: string, limit: number = 50): Promise<Message[]> => {
  const snapshot = await getMessagesRef(chatId)
    .orderByChild('timestamp')
    .limitToLast(limit)
    .once('value');
  const data = snapshot.val();
  if (!data) return [];
  return Object.values(data).reverse() as Message[];
};

export const sendMessage = async (message: Message): Promise<void> => {
  await getMessagesRef(message.chatId).child(message.messageId).set(message);
  
  // Update chat's last message
  await updateChat(message.chatId, {
    lastMessage: message,
    lastMessageTime: message.timestamp,
  });
};

export const markMessageAsRead = async (
  chatId: string,
  messageId: string,
  uid: string,
): Promise<void> => {
  await getMessagesRef(chatId)
    .child(messageId)
    .child('readBy')
    .child(uid)
    .set(Date.now());
};

// Typing indicator operations
export const getTypingRef = (chatId: string) => {
  return db.ref(`typing/${chatId}`);
};

export const setTyping = async (chatId: string, uid: string): Promise<void> => {
  await getTypingRef(chatId).child(uid).set(true);
  // Auto-clear after 3 seconds
  setTimeout(() => {
    getTypingRef(chatId).child(uid).remove().catch(() => {});
  }, 3000);
};

export const clearTyping = async (chatId: string, uid: string): Promise<void> => {
  await getTypingRef(chatId).child(uid).remove();
};

// Watch typing indicators
export const watchTyping = (
  chatId: string,
  callback: (typingUsers: {[uid: string]: boolean}) => void,
): (() => void) => {
  const ref = getTypingRef(chatId);
  const listener = ref.on('value', snapshot => {
    const data = snapshot.val();
    callback(data || {});
  });
  return () => ref.off('value', listener);
};

// Delete message operations
export const deleteMessageForMe = async (
  chatId: string,
  messageId: string,
  uid: string,
): Promise<void> => {
  await getMessagesRef(chatId)
    .child(messageId)
    .child('deletedFor')
    .child(uid)
    .set(true);
};

export const deleteMessageForEveryone = async (
  chatId: string,
  messageId: string,
): Promise<void> => {
  await getMessagesRef(chatId)
    .child(messageId)
    .update({
      deleted: true,
      text: 'Message deleted',
    });
};

// Forward message - creates a new message with forward metadata
export const forwardMessage = async (
  originalMessage: Message,
  targetChatId: string,
  senderId: string,
): Promise<Message> => {
  const forwardedMessage: Message = {
    ...originalMessage,
    messageId: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    chatId: targetChatId,
    senderId,
    timestamp: Date.now(),
    forwardedFrom: {
      chatId: originalMessage.chatId,
      messageId: originalMessage.messageId,
      senderId: originalMessage.senderId,
    },
    readBy: {},
    deliveredTo: [],
  };

  await sendMessage(forwardedMessage);
  return forwardedMessage;
};

export const searchUserByUsername = async (username: string): Promise<User | null> => {
  try {
    const normalizedUsername = username.toLowerCase().trim();
    const snapshot = await db.ref(`usernames/${normalizedUsername}`).once('value');
    
    const uid = snapshot.val();
    if (uid) {
      return await getUser(uid);
    }
    return null;
  } catch (error: any) {
    return null;
  }
};

export const searchUserByPhone = async (phone: string): Promise<User | null> => {
  try {
    const normalizedPhone = phone.replace(/[\s\-()]/g, '');
    const snapshot = await db.ref(`phones/${normalizedPhone}`).once('value');
    
    const uid = snapshot.val();
    if (uid) {
      return await getUser(uid);
    }
    return null;
  } catch (error: any) {
    return null;
  }
};

export const searchUserByEmail = async (email: string): Promise<User | null> => {
  const normalizedEmail = email.toLowerCase().trim();
  const encodedEmail = encodeEmailForPath(normalizedEmail);
  
  try {
    const emailsSnapshot = await db.ref(`emails/${encodedEmail}`).once('value');
    
    const uid = emailsSnapshot.val();
    if (uid) {
      const user = await getUser(uid);
      if (user) {
        return user;
      }
    }
    
    const snapshot = await db.ref('users').once('value');
    const users = snapshot.val();
    
    if (users) {
      for (const userId in users) {
        const user = users[userId];
        if (!user?.email) continue;
        
        const userEmail = user.email.toLowerCase().trim();
        if (userEmail === normalizedEmail) {
          try {
            await db.ref(`emails/${encodedEmail}`).set(userId);
          } catch (lookupError: any) {
          }
          return user;
        }
      }
    }
    
    return null;
  } catch (error: any) {
    return null;
  }
};

export const searchUser = async (query: string): Promise<User | null> => {
  if (!query || !query.trim()) {
    return null;
  }

  const trimmedQuery = query.trim().toLowerCase();
  
  if (ValidationUtils.isValidEmail(trimmedQuery)) {
    const user = await searchUserByEmail(trimmedQuery);
    if (user) {
      return user;
    }
  }
  
  if (ValidationUtils.isValidUsername(trimmedQuery)) {
    const user = await searchUserByUsername(trimmedQuery);
    if (user) {
      return user;
    }
  }
  
  if (ValidationUtils.isValidPhoneNumber(trimmedQuery)) {
    const user = await searchUserByPhone(trimmedQuery);
    if (user) {
      return user;
    }
  }
  
  if (trimmedQuery.length >= 3) {
    try {
      const snapshot = await db.ref('users').once('value');
      const users = snapshot.val();
      
      if (users) {
        for (const userId in users) {
          const user = users[userId];
          if (!user) continue;
          
          if (user.email) {
            const userEmail = user.email.toLowerCase().trim();
            const emailPrefix = userEmail.split('@')[0];
            if (userEmail.includes(trimmedQuery) || emailPrefix.includes(trimmedQuery) || trimmedQuery.includes(emailPrefix)) {
              return user;
            }
          }
          
          if (user.username) {
            const username = user.username.toLowerCase().trim();
            if (username.includes(trimmedQuery) || trimmedQuery.includes(username)) {
              return user;
            }
          }
        }
      }
    } catch (error: any) {
    }
  }
  
  const [emailResult, usernameResult, phoneResult] = await Promise.allSettled([
    searchUserByEmail(trimmedQuery),
    searchUserByUsername(trimmedQuery),
    searchUserByPhone(trimmedQuery),
  ]);
  
  if (emailResult.status === 'fulfilled' && emailResult.value) {
    return emailResult.value;
  }
  if (usernameResult.status === 'fulfilled' && usernameResult.value) {
    return usernameResult.value;
  }
  if (phoneResult.status === 'fulfilled' && phoneResult.value) {
    return phoneResult.value;
  }
  
  return null;
};

