import {getUser, updateUser, createUser, searchUser as searchUserInDB} from '../../firebase/database';
import {updateProfile} from '../../firebase/auth';
import {uploadImage} from '../../firebase/storage';
import {User} from '../../types/user';

export const UserService = {
  getUser: async (uid: string): Promise<User | null> => {
    return getUser(uid);
  },

  searchUser: async (query: string): Promise<User | null> => {
    try {
      const foundUser = await searchUserInDB(query);
      return foundUser;
    } catch (error) {
      return null;
    }
  },

  searchUsers: async (query: string): Promise<User[]> => {
    try {
      if (!query || query.trim().length < 2) {
        return [];
      }

      const trimmedQuery = query.trim().toLowerCase();
      const results: User[] = [];
      const seenUids = new Set<string>();

      // First try exact match
      const exactMatch = await searchUserInDB(trimmedQuery);
      if (exactMatch && !seenUids.has(exactMatch.uid)) {
        results.push(exactMatch);
        seenUids.add(exactMatch.uid);
      }

      // Then do partial search for multiple results
      if (trimmedQuery.length >= 2) {
        const {getDatabase} = await import('../../firebase/database');
        const db = getDatabase();
        const snapshot = await db.ref('users').once('value');
        const users = snapshot.val();
        
        if (users) {
          for (const userId in users) {
            if (seenUids.has(userId)) continue;
            
            const user = users[userId];
            if (!user) continue;
            
            // Check email partial match
            if (user.email) {
              const userEmail = user.email.toLowerCase().trim();
              if (userEmail.includes(trimmedQuery) || trimmedQuery.includes(userEmail.split('@')[0])) {
                results.push(user);
                seenUids.add(userId);
                continue;
              }
            }
            
            // Check username partial match
            if (user.username) {
              const username = user.username.toLowerCase().trim();
              if (username.includes(trimmedQuery) || trimmedQuery.includes(username)) {
                results.push(user);
                seenUids.add(userId);
                continue;
              }
            }
            
            // Check displayName partial match
            if (user.displayName) {
              const displayName = user.displayName.toLowerCase().trim();
              if (displayName.includes(trimmedQuery)) {
                results.push(user);
                seenUids.add(userId);
                continue;
              }
            }
          }
        }
      }

      return results;
    } catch (error) {
      return [];
    }
  },

  updateProfile: async (
    uid: string,
    updates: Partial<User>,
  ): Promise<void> => {
    // Update Firebase Auth profile if displayName or photoURL changed
    if (updates.displayName || updates.photoURL) {
      await updateProfile(updates);
    }

    // Update user in database
    await updateUser(uid, updates);
  },

  uploadProfilePicture: async (
    uid: string,
    imageUri: string,
  ): Promise<string> => {
    const path = `users/${uid}/profile.jpg`;
    const photoURL = await uploadImage(path, imageUri);
    await updateUser(uid, {photoURL});
    return photoURL;
  },

  createUser: async (user: User): Promise<void> => {
    await createUser(user);
  },
};

