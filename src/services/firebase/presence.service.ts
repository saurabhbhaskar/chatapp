import {
  setUserOnline,
  setUserOffline,
  getUserPresence,
  watchUserPresence,
} from '../../firebase/presence';
import {UserPresence} from '../../types/user';

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
  getPresence: async (uid: string): Promise<UserPresence | null> => {
    return getUserPresence(uid);
  },

  /**
   * Watch user presence for real-time updates
   */
  watchPresence: (
    uid: string,
    callback: (presence: UserPresence | null) => void,
  ): (() => void) => {
    return watchUserPresence(uid, callback);
  },
};

