import database from '@react-native-firebase/database';
import {getCurrentUser} from './auth';

const db = database();

export const setUserOnline = async (uid: string): Promise<void> => {
  const userStatusRef = db.ref(`presence/${uid}`);
  const isOnlineRef = db.ref(`users/${uid}/status`);

  try {
    const setOnlinePromise = Promise.all([
      isOnlineRef.set('online'),
      userStatusRef.set({
        status: 'online',
        lastSeen: Date.now(),
      }),
    ]);
    
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('setUserOnline timeout after 3 seconds')), 3000);
    });
    
    await Promise.race([setOnlinePromise, timeoutPromise]);

    try {
      userStatusRef.onDisconnect().set({
        status: 'offline',
        lastSeen: Date.now(),
      });
    } catch (disconnectError) {
    }
  } catch (error) {
    throw error;
  }
};

export const setUserOffline = async (uid: string): Promise<void> => {
  const userStatusRef = db.ref(`presence/${uid}`);
  const isOnlineRef = db.ref(`users/${uid}/status`);

  await isOnlineRef.set('offline');
  await userStatusRef.set({
    status: 'offline',
    lastSeen: Date.now(),
  });
};

export const getUserPresenceRef = (uid: string) => {
  return db.ref(`presence/${uid}`);
};

export const getUserPresence = async (uid: string): Promise<any> => {
  const snapshot = await getUserPresenceRef(uid).once('value');
  return snapshot.val();
};

export const watchUserPresence = (
  uid: string,
  callback: (presence: any) => void,
): () => void => {
  const ref = getUserPresenceRef(uid);
  const listener = ref.on('value', snapshot => {
    callback(snapshot.val());
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

