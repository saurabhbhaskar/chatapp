import auth, {FirebaseAuthTypes} from '@react-native-firebase/auth';
import {User} from '../types/user';

const getAuthInstance = () => {
  try {
    const authInstance = auth();
    return authInstance;
  } catch (error: any) {
    if (error?.code === 'auth/configuration-not' || error?.message?.includes('CONFIGURATION_NOT_FOUND')) {
      throw new Error(
        'Firebase configuration error. Please rebuild the app:\n1. Stop Metro bundler\n2. cd android && ./gradlew clean\n3. npm run android',
      );
    }
    throw error;
  }
};

export const signInWithEmail = async (
  email: string,
  password: string,
): Promise<FirebaseAuthTypes.UserCredential> => {
  try {
    const authInstance = getAuthInstance();
    const credential = await authInstance.signInWithEmailAndPassword(email, password);
    return credential;
  } catch (error: any) {
    throw error;
  }
};

export const signUpWithEmail = async (
  email: string,
  password: string,
): Promise<FirebaseAuthTypes.UserCredential> => {
  try {
    const authInstance = getAuthInstance();
    const credential = await authInstance.createUserWithEmailAndPassword(email, password);
    return credential;
  } catch (error: any) {
    throw error;
  }
};

export const signOut = async (): Promise<void> => {
  const authInstance = getAuthInstance();
  return authInstance.signOut();
};

export const sendPasswordResetEmail = async (email: string): Promise<void> => {
  const authInstance = getAuthInstance();
  return authInstance.sendPasswordResetEmail(email);
};

export const getCurrentUser = (): FirebaseAuthTypes.User | null => {
  const authInstance = getAuthInstance();
  return authInstance.currentUser;
};

export const onAuthStateChanged = (
  callback: (user: FirebaseAuthTypes.User | null) => void,
): () => void => {
  const authInstance = getAuthInstance();
  return authInstance.onAuthStateChanged(callback);
};

export const updateProfile = async (
  updates: Partial<User>,
): Promise<void> => {
  const authInstance = getAuthInstance();
  const user = authInstance.currentUser;
  if (!user) {
    throw new Error('No user logged in');
  }

  const profileUpdates: any = {};
  if (updates.displayName) {
    profileUpdates.displayName = updates.displayName;
  }
  if (updates.photoURL) {
    profileUpdates.photoURL = updates.photoURL;
  }

  if (Object.keys(profileUpdates).length > 0) {
    await user.updateProfile(profileUpdates);
  }
};

export const updateEmail = async (newEmail: string): Promise<void> => {
  const authInstance = getAuthInstance();
  const user = authInstance.currentUser;
  if (!user) {
    throw new Error('No user logged in');
  }
  await user.updateEmail(newEmail);
};

export const updatePassword = async (newPassword: string): Promise<void> => {
  const authInstance = getAuthInstance();
  const user = authInstance.currentUser;
  if (!user) {
    throw new Error('No user logged in');
  }
  await user.updatePassword(newPassword);
};

export const deleteUser = async (): Promise<void> => {
  const authInstance = getAuthInstance();
  const user = authInstance.currentUser;
  if (!user) {
    throw new Error('No user logged in');
  }
  await user.delete();
};

