import storage from '@react-native-firebase/storage';
import {Platform} from 'react-native';

const storageRef = storage();

export const uploadFile = async (
  path: string,
  fileUri: string,
  metadata?: any,
): Promise<string> => {
  const reference = storageRef.ref(path);
  await reference.putFile(fileUri, metadata);
  return await reference.getDownloadURL();
};

export const uploadImage = async (
  path: string,
  imageUri: string,
): Promise<string> => {
  return uploadFile(path, imageUri, {
    contentType: 'image/jpeg',
  });
};

export const deleteFile = async (path: string): Promise<void> => {
  const reference = storageRef.ref(path);
  await reference.delete();
};

export const getDownloadURL = async (path: string): Promise<string> => {
  const reference = storageRef.ref(path);
  return await reference.getDownloadURL();
};

export const getFileMetadata = async (path: string): Promise<any> => {
  const reference = storageRef.ref(path);
  return await reference.getMetadata();
};

