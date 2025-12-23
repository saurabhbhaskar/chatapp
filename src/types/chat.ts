import {User} from './user';
import {Message} from './message';

export interface Chat {
  chatId: string;
  type: 'direct' | 'group';
  participants: string[]; // User UIDs
  participantDetails?: User[]; // Full user objects
  lastMessage?: Message;
  lastMessageTime?: number;
  unreadCount?: {[uid: string]: number};
  createdAt: number;
  updatedAt: number;
  groupInfo?: GroupInfo;
}

export interface GroupInfo {
  name: string;
  description?: string;
  photoURL?: string;
  createdBy: string;
  admins: string[];
  members: string[];
}

