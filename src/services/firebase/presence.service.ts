import {
  setUserOnline,
  setUserOffline,
  getUserPresence,
  watchUserPresence,
} from '../../firebase/presence';

export const PresenceService = {
  /**
   * Set user online
   */
  setOnline: async (uid: string): Promise<void> => {
    await setUserOnline(uid);
  },

  /**
   * Set user offline
   */
  setOffline: async (uid: string): Promise<void> => {
    await setUserOffline(uid);
  },

  /**
   * Get user presence
   */
  getPresence: async (uid: string): Promise<{online: boolean; lastSeen: number} | null> => {
    return getUserPresence(uid);
  },

  /**
   * Watch user presence for real-time updates
   */
  watchPresence: (
    uid: string,
    callback: (presence: {online: boolean; lastSeen: number} | null) => void,
  ): (() => void) => {
    return watchUserPresence(uid, callback);
  },
};

