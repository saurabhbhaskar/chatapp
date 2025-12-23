export interface Message {
  messageId: string;
  chatId: string;
  senderId: string;
  text?: string;
  imageURL?: string;
  fileURL?: string;
  fileName?: string;
  fileType?: string;
  timestamp: number;
  readBy?: {[uid: string]: number}; // uid -> timestamp
  deliveredTo?: string[];
  edited?: boolean;
  editedAt?: number;
  replyTo?: string; // messageId - for reply functionality
  deletedFor?: {[uid: string]: boolean}; // uid -> true (delete for me)
  deleted?: boolean; // delete for everyone
  forwardedFrom?: {
    chatId: string;
    messageId: string;
    senderId: string;
  }; // for forward functionality
  type: 'text' | 'image' | 'file' | 'system';
}

