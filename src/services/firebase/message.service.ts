import {
  sendMessage,
  getMessages,
  markMessageAsRead,
  getMessagesRef,
  setTyping,
  clearTyping,
  watchTyping,
  deleteMessageForMe,
  deleteMessageForEveryone,
  forwardMessage,
} from '../../firebase/database';
import {Message} from '../../types/message';
import {getDatabase} from '../../firebase/database';

export const MessageService = {
  sendTextMessage: async (
    chatId: string,
    senderId: string,
    text: string,
  ): Promise<Message> => {
    const message: Message = {
      messageId: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      chatId,
      senderId,
      text,
      timestamp: Date.now(),
      type: 'text',
      readBy: {},
      deliveredTo: [],
    };

    await sendMessage(message);
    return message;
  },

  sendImageMessage: async (
    chatId: string,
    senderId: string,
    imageURL: string,
  ): Promise<Message> => {
    const message: Message = {
      messageId: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      chatId,
      senderId,
      imageURL,
      timestamp: Date.now(),
      type: 'image',
      readBy: {},
      deliveredTo: [],
    };

    await sendMessage(message);
    return message;
  },

  sendFileMessage: async (
    chatId: string,
    senderId: string,
    fileURL: string,
    fileName: string,
    fileType: string,
  ): Promise<Message> => {
    const message: Message = {
      messageId: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      chatId,
      senderId,
      fileURL,
      fileName,
      fileType,
      timestamp: Date.now(),
      type: 'file',
      readBy: {},
      deliveredTo: [],
    };

    await sendMessage(message);
    return message;
  },

  getMessages: async (chatId: string, limit: number = 50): Promise<Message[]> => {
    return getMessages(chatId, limit);
  },

  markAsRead: async (
    chatId: string,
    messageId: string,
    uid: string,
  ): Promise<void> => {
    await markMessageAsRead(chatId, messageId, uid);
  },

  watchMessages: (
    chatId: string,
    callback: (messages: Message[]) => void,
    limit: number = 50,
  ): (() => void) => {
    const ref = getMessagesRef(chatId);
    const listener = ref
      .orderByChild('timestamp')
      .limitToLast(limit)
      .on('value', snapshot => {
        const data = snapshot.val();
        const messages = data ? Object.values(data).reverse() as Message[] : [];
        callback(messages);
      });

    return () => ref.off('value', listener);
  },

  sendReplyMessage: async (
    chatId: string,
    senderId: string,
    text: string,
    replyToMessageId: string,
  ): Promise<Message> => {
    const message: Message = {
      messageId: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      chatId,
      senderId,
      text,
      timestamp: Date.now(),
      type: 'text',
      replyTo: replyToMessageId,
      readBy: {},
      deliveredTo: [],
    };

    await sendMessage(message);
    return message;
  },

  deleteForMe: async (
    chatId: string,
    messageId: string,
    uid: string,
  ): Promise<void> => {
    await deleteMessageForMe(chatId, messageId, uid);
  },

  deleteForEveryone: async (
    chatId: string,
    messageId: string,
  ): Promise<void> => {
    await deleteMessageForEveryone(chatId, messageId);
  },

  forwardToChat: async (
    originalMessage: Message,
    targetChatId: string,
    senderId: string,
  ): Promise<Message> => {
    return await forwardMessage(originalMessage, targetChatId, senderId);
  },

  setTyping: async (chatId: string, uid: string): Promise<void> => {
    await setTyping(chatId, uid);
  },

  clearTyping: async (chatId: string, uid: string): Promise<void> => {
    await clearTyping(chatId, uid);
  },

  watchTyping: (
    chatId: string,
    callback: (typingUsers: {[uid: string]: boolean}) => void,
  ): (() => void) => {
    return watchTyping(chatId, callback);
  },
};

