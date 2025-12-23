import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import {
  signInWithEmail,
  signUpWithEmail,
  signOut,
  sendPasswordResetEmail,
} from '../../firebase/auth';
import {createUser, getUser} from '../../firebase/database';
import {User} from '../../types/user';
import {initializePresence} from '../../firebase/presence';

export const AuthService = {
  loginWithEmail: async (
    email: string,
    password: string,
  ): Promise<User | null> => {
    try {
      const credential = await signInWithEmail(email, password);
      const firebaseUser = credential.user;

      let user: User | null = null;
      
      try {
        const getUserPromise = getUser(firebaseUser.uid);
        const timeoutPromise = new Promise<User | null>((_, reject) => {
          setTimeout(() => reject(new Error('Database fetch timeout')), 5000);
        });
        
        user = await Promise.race([getUserPromise, timeoutPromise]);
      } catch (dbError) {
      }

      if (!user) {
        user = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || undefined,
          displayName: firebaseUser.displayName || undefined,
          photoURL: firebaseUser.photoURL || undefined,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        
        try {
          await Promise.race([
            createUser(user),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Create user timeout')), 5000))
          ]);
        } catch (createError) {
        }
      }

      try {
        await Keychain.setInternetCredentials(
          'chatapp',
          email,
          password,
        );
      } catch (keychainError) {
      }

      await AsyncStorage.setItem('isLoggedIn', 'Yes');
      await AsyncStorage.setItem('userData', JSON.stringify(user));

      try {
        const presencePromise = initializePresence();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Presence initialization timeout')), 5000);
        });
        
        await Promise.race([presencePromise, timeoutPromise]);
      } catch (presenceError) {
      }

      if (!user) {
        user = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || undefined,
          displayName: firebaseUser.displayName || undefined,
          photoURL: firebaseUser.photoURL || undefined,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
      }

      return user;
    } catch (error) {
      throw error;
    }
  },

  registerWithEmail: async (
    email: string,
    password: string,
    displayName?: string,
    username?: string,
    phone?: string,
  ): Promise<User | null> => {
    try {
      const credential = await signUpWithEmail(email, password);
      const firebaseUser = credential.user;

      let user: User = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || undefined,
        displayName: displayName || firebaseUser.displayName || undefined,
        username: username || undefined,
        phoneNumber: phone || undefined,
        photoURL: firebaseUser.photoURL || undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      try {
        const createUserPromise = createUser(user);
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Create user timeout')), 5000);
        });
        
        await Promise.race([createUserPromise, timeoutPromise]);
      } catch (createError) {
      }

      try {
        await Keychain.setInternetCredentials(
          'chatapp',
          email,
          password,
        );
      } catch (keychainError) {
      }

      await AsyncStorage.setItem('isLoggedIn', 'Yes');
      await AsyncStorage.setItem('userData', JSON.stringify(user));

      try {
        const presencePromise = initializePresence();
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Presence initialization timeout')), 5000);
        });
        
        await Promise.race([presencePromise, timeoutPromise]);
      } catch (presenceError) {
      }

      if (!user) {
        user = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || undefined,
          displayName: displayName || firebaseUser.displayName || undefined,
          photoURL: firebaseUser.photoURL || undefined,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
      }

      return user;
    } catch (error) {
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    try {
      await signOut();
      await Keychain.resetInternetCredentials('chatapp');
      await AsyncStorage.removeItem('isLoggedIn');
      await AsyncStorage.removeItem('userData');
    } catch (error) {
      throw error;
    }
  },

  resetPassword: async (email: string): Promise<void> => {
    try {
      await sendPasswordResetEmail(email);
    } catch (error) {
      throw error;
    }
  },

  getCurrentUserFromStorage: async (): Promise<User | null> => {
    try {
      const userData = await AsyncStorage.getItem('userData');
      if (userData) {
        return JSON.parse(userData);
      }
      return null;
    } catch {
      return null;
    }
  },

  isLoggedIn: async (): Promise<boolean> => {
    try {
      const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
      return isLoggedIn === 'Yes';
    } catch {
      return false;
    }
  },

  getStoredCredentials: async (): Promise<{
    username: string;
    password: string;
  } | null> => {
    try {
      const credentials = await Keychain.getInternetCredentials('chatapp');
      if (credentials) {
        return {
          username: credentials.username,
          password: credentials.password,
        };
      }
      return null;
    } catch {
      return null;
    }
  },
};

