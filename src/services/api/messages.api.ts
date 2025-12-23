import { Message } from '../../types/message';
import { getMessagesRef, sendMessage } from '../../firebase/database';

export interface FetchMessagesParams {
  pageParam?: number;
  chatId: string;
}

export interface MessagesResponse {
  messages: Message[];
  nextPage: number | undefined;
  hasMore: boolean;
}

const PAGE_SIZE = 20;

/**
 * Fetch paginated messages for a chat
 * Uses Firebase Realtime Database with pagination
 */
export async function fetchMessages({
  pageParam = 0,
  chatId,
}: FetchMessagesParams): Promise<MessagesResponse> {
  const ref = getMessagesRef(chatId);
  
  // For the first page (pageParam === 0), get the most recent messages
  // But we want them sorted oldest to newest (so newest is at bottom)
  if (pageParam === 0) {
    const snapshot = await ref
      .orderByChild('timestamp')
      .limitToLast(PAGE_SIZE)
      .once('value');
    
    const data = snapshot.val();
    if (!data) {
      return {
        messages: [],
        nextPage: undefined,
        hasMore: false,
      };
    }
    
    // Get messages and sort by timestamp (oldest first, newest last)
    const messages = (Object.values(data) as Message[]).sort((a, b) => a.timestamp - b.timestamp);
    
    return {
      messages,
      nextPage: messages.length === PAGE_SIZE ? 1 : undefined,
      hasMore: messages.length === PAGE_SIZE,
    };
  }

  // For subsequent pages, we need to get messages before the last message timestamp
  // First, get all messages up to the current page to find the oldest message timestamp
  const allMessagesSnapshot = await ref
    .orderByChild('timestamp')
    .limitToLast(PAGE_SIZE * (pageParam + 1))
    .once('value');
  
  const allMessagesData = allMessagesSnapshot.val();
  if (!allMessagesData) {
    return {
      messages: [],
      nextPage: undefined,
      hasMore: false,
    };
  }

  const allMessages = Object.values(allMessagesData) as Message[];
  const sortedMessages = allMessages.sort((a, b) => a.timestamp - b.timestamp);
  
  // Get the oldest timestamp from the previous pages
  const oldestTimestamp = sortedMessages[0]?.timestamp;
  
  if (!oldestTimestamp) {
    return {
      messages: [],
      nextPage: undefined,
      hasMore: false,
    };
  }

  // Get messages before this timestamp (exclusive)
  const snapshot = await ref
    .orderByChild('timestamp')
    .endAt(oldestTimestamp - 1)
    .limitToLast(PAGE_SIZE)
    .once('value');
  
  const data = snapshot.val();
  if (!data) {
    return {
      messages: [],
      nextPage: undefined,
      hasMore: false,
    };
  }
  
  // Sort messages by timestamp (oldest first, newest last)
  const messages = (Object.values(data) as Message[]).sort((a, b) => a.timestamp - b.timestamp);
  
  return {
    messages,
    nextPage: messages.length === PAGE_SIZE ? pageParam + 1 : undefined,
    hasMore: messages.length === PAGE_SIZE,
  };
}

export interface SendMessageParams {
  chatId: string;
  senderId: string;
  text: string;
  tempId: string;
  replyTo?: string;
}

/**
 * Send a new message
 * Returns the created message with the actual messageId from Firebase
 */
export async function sendMessageAPI({
  chatId,
  senderId,
  text,
  replyTo,
}: SendMessageParams): Promise<Message> {
  const message: Message = {
    messageId: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    chatId,
    senderId,
    text,
    timestamp: Date.now(),
    type: 'text',
    readBy: {},
    deliveredTo: [],
    replyTo,
  };

  await sendMessage(message);
  return message;
}

