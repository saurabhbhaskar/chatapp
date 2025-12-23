import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {Chat, Message} from '../types';

interface ChatState {
  chats: Chat[];
  currentChat: Chat | null;
  messages: {[chatId: string]: Message[]};
  loading: boolean;
  error: string | null;
}

const initialState: ChatState = {
  chats: [],
  currentChat: null,
  messages: {},
  loading: false,
  error: null,
};

export const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setChats: (state, action: PayloadAction<Chat[]>) => {
      state.chats = action.payload;
    },
    addChat: (state, action: PayloadAction<Chat>) => {
      const existingIndex = state.chats.findIndex(
        chat => chat.chatId === action.payload.chatId,
      );
      if (existingIndex >= 0) {
        state.chats[existingIndex] = action.payload;
      } else {
        state.chats.push(action.payload);
      }
    },
    updateChat: (state, action: PayloadAction<Chat>) => {
      const index = state.chats.findIndex(
        chat => chat.chatId === action.payload.chatId,
      );
      if (index >= 0) {
        state.chats[index] = action.payload;
      }
      if (state.currentChat?.chatId === action.payload.chatId) {
        state.currentChat = action.payload;
      }
    },
    setCurrentChat: (state, action: PayloadAction<Chat | null>) => {
      state.currentChat = action.payload;
    },
    setMessages: (
      state,
      action: PayloadAction<{chatId: string; messages: Message[]}>,
    ) => {
      // Deduplicate messages by messageId to prevent duplicate key errors
      const messagesMap = new Map<string, Message>();
      action.payload.messages.forEach(msg => {
        messagesMap.set(msg.messageId, msg);
      });
      state.messages[action.payload.chatId] = Array.from(messagesMap.values()).sort(
        (a, b) => a.timestamp - b.timestamp
      );
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      const chatId = action.payload.chatId;
      if (!state.messages[chatId]) {
        state.messages[chatId] = [];
      }
      state.messages[chatId].push(action.payload);
    },
    updateMessage: (
      state,
      action: PayloadAction<{
        chatId: string;
        messageId: string;
        updates: Partial<Message>;
      }>,
    ) => {
      const {chatId, messageId, updates} = action.payload;
      if (state.messages[chatId]) {
        const index = state.messages[chatId].findIndex(
          msg => msg.messageId === messageId,
        );
        if (index >= 0) {
          state.messages[chatId][index] = {
            ...state.messages[chatId][index],
            ...updates,
          };
        }
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearChats: state => {
      state.chats = [];
      state.currentChat = null;
      state.messages = {};
    },
  },
});

export const {
  setChats,
  addChat,
  updateChat,
  setCurrentChat,
  setMessages,
  addMessage,
  updateMessage,
  setLoading,
  setError,
  clearChats,
} = chatSlice.actions;
export default chatSlice.reducer;

