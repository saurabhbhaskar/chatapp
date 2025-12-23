import database from '@react-native-firebase/database';
import {getCurrentUser} from './auth';

const db = database();

/**
 * Set user online status
 * According to schema: presence/uid/online (boolean) and lastSeen (timestamp)
 */
export const setUserOnline = async (uid: string): Promise<void> => {
  const presenceRef = db.ref(`presence/${uid}`);

  try {
    const setOnlinePromise = presenceRef.set({
      online: true,
      lastSeen: Date.now(),
    });
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('setUserOnline timeout after 3 seconds')), 3000);
    });
    
    await Promise.race([setOnlinePromise, timeoutPromise]);

    // Set up disconnect handler to mark offline when connection is lost
    try {
      presenceRef.onDisconnect().set({
        online: false,
        lastSeen: Date.now(),
      });
    } catch (disconnectError) {
      // Ignore disconnect setup errors
    }
  } catch (error) {
    throw error;
  }
};

/**
 * Set user offline status
 * According to schema: presence/uid/online (boolean) and lastSeen (timestamp)
 */
export const setUserOffline = async (uid: string): Promise<void> => {
  const presenceRef = db.ref(`presence/${uid}`);

  await presenceRef.set({
    online: false,
    lastSeen: Date.now(),
  });
};

export const getUserPresenceRef = (uid: string) => {
  return db.ref(`presence/${uid}`);
};

/**
 * Get user presence (one-time fetch)
 * Returns: { online: boolean, lastSeen: number } | null
 */
export const getUserPresence = async (uid: string): Promise<{online: boolean; lastSeen: number} | null> => {
  const snapshot = await getUserPresenceRef(uid).once('value');
  const data = snapshot.val();
  if (!data) return null;
  return {
    online: data.online === true,
    lastSeen: data.lastSeen || 0,
  };
};

/**
 * Watch user presence for real-time updates
 * Returns unsubscribe function
 */
export const watchUserPresence = (
  uid: string,
  callback: (presence: {online: boolean; lastSeen: number} | null) => void,
): () => void => {
  const ref = getUserPresenceRef(uid);
  const listener = ref.on('value', snapshot => {
    const data = snapshot.val();
    if (!data) {
      callback(null);
      return;
    }
    callback({
      online: data.online === true,
      lastSeen: data.lastSeen || 0,
    });
  });

  return () => ref.off('value', listener);
};

export const initializePresence = async (): Promise<void> => {
  const user = getCurrentUser();
  if (user) {
    try {
      const presencePromise = setUserOnline(user.uid);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('initializePresence timeout after 5 seconds')), 5000);
      });
      
      await Promise.race([presencePromise, timeoutPromise]);
    } catch (error) {
      throw error;
    }
  }
};

