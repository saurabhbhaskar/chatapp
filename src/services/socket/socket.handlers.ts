import {Socket} from 'socket.io-client';
import {SocketEvents} from './socket.events';
import {Message, Chat} from '../../types';
import {AppDispatch} from '../../Redux/store';
import {addMessage, updateChat, addChat} from '../../Redux/chatSlice';
import {setPresence} from '../../Redux/presenceSlice';

export const setupSocketHandlers = (
  socket: Socket,
  dispatch: AppDispatch,
): (() => void) => {
  // Message handlers
  socket.on(SocketEvents.MESSAGE_RECEIVED, (message: Message) => {
    dispatch(addMessage(message));
  });

  socket.on(SocketEvents.MESSAGE_READ, (data: {chatId: string; messageId: string; userId: string}) => {
  });

  // Chat handlers
  socket.on(SocketEvents.CHAT_CREATED, (chat: Chat) => {
    dispatch(addChat(chat));
  });

  socket.on(SocketEvents.CHAT_UPDATED, (chat: Chat) => {
    dispatch(updateChat(chat));
  });

  // Presence handlers
  socket.on(SocketEvents.PRESENCE_ONLINE, (data: {uid: string; lastSeen: number}) => {
    dispatch(
      setPresence({
        uid: data.uid,
        status: 'online',
        lastSeen: data.lastSeen,
      }),
    );
  });

  socket.on(SocketEvents.PRESENCE_OFFLINE, (data: {uid: string; lastSeen: number}) => {
    dispatch(
      setPresence({
        uid: data.uid,
        status: 'offline',
        lastSeen: data.lastSeen,
      }),
    );
  });

  return () => {
    socket.off(SocketEvents.MESSAGE_RECEIVED);
    socket.off(SocketEvents.MESSAGE_READ);
    socket.off(SocketEvents.CHAT_CREATED);
    socket.off(SocketEvents.CHAT_UPDATED);
    socket.off(SocketEvents.PRESENCE_ONLINE);
    socket.off(SocketEvents.PRESENCE_OFFLINE);
  };
};

