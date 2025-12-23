export interface User {
  uid: string;
  email?: string;
  username?: string;
  phoneNumber?: string;
  displayName?: string;
  photoURL?: string;
  avatar?: string;
  about?: string;
  name?: string;
  phone?: string;
  status?: 'online' | 'offline' | 'away';
  lastSeen?: number;
  createdAt: number;
  updatedAt: number;
}

export interface UserPresence {
  uid: string;
  online: boolean;
  lastSeen: number;
}

