import {
  createChat,
  getChat,
  getUserChats,
  updateChat,
  getChatRef,
} from '../../firebase/database';
import {Chat, GroupInfo} from '../../types';
import {getDatabase} from '../../firebase/database';

export const ChatService = {
  /**
   * Create a direct chat
   */
  createDirectChat: async (
    participantIds: string[],
  ): Promise<Chat | null> => {
    try {
      const chatId = participantIds.sort().join('_');
      const existingChat = await getChat(chatId);

      if (existingChat) {
        return existingChat;
      }

      const chat: Chat = {
        chatId,
        type: 'direct',
        participants: participantIds,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await createChat(chat);
      return chat;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Create a group chat
   */
  createGroupChat: async (
    participantIds: string[],
    groupInfo: GroupInfo,
    createdBy: string,
  ): Promise<Chat> => {
    try {
      const chatId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const chat: Chat = {
        chatId,
        type: 'group',
        participants: participantIds,
        groupInfo: {
          ...groupInfo,
          createdBy,
          admins: [createdBy],
          members: participantIds,
        },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await createChat(chat);
      return chat;
    } catch (error) {
      throw error;
    }
  },

  /**
   * Get chat by ID
   */
  getChat: async (chatId: string): Promise<Chat | null> => {
    return getChat(chatId);
  },

  /**
   * Get user's chats
   */
  getUserChats: async (uid: string): Promise<string[]> => {
    return getUserChats(uid);
  },

  /**
   * Update chat
   */
  updateChat: async (chatId: string, updates: Partial<Chat>): Promise<void> => {
    await updateChat(chatId, updates);
  },

  /**
   * Watch chat for real-time updates
   */
  watchChat: (
    chatId: string,
    callback: (chat: Chat | null) => void,
  ): (() => void) => {
    const ref = getChatRef(chatId);
    const listener = ref.on('value', snapshot => {
      const chatData = snapshot.val();
      if (chatData) {
        // Convert participants object back to array for TypeScript compatibility
        if (chatData.participants && typeof chatData.participants === 'object' && !Array.isArray(chatData.participants)) {
          chatData.participants = Object.keys(chatData.participants);
        }
      }
      callback(chatData);
    });

    return () => ref.off('value', listener);
  },

  /**
   * Watch user chats for real-time updates
   */
  watchUserChats: (
    uid: string,
    callback: (chatIds: string[]) => void,
  ): (() => void) => {
    const db = getDatabase();
    const ref = db.ref(`userChats/${uid}`);
    const listener = ref.on('value', snapshot => {
      const data = snapshot.val();
      const chatIds = data ? Object.keys(data) : [];
      callback(chatIds);
    });

    return () => ref.off('value', listener);
  },
};

