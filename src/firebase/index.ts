export const initializeFirebase = (): void => {
};

export const checkFirebaseConfiguration = (): boolean => {
  try {
    const appModule = require('@react-native-firebase/app').default;
    const appObj = appModule as any;
    const options = appObj.options || {};
    const hasProjectId = !!options?.projectId;
    const hasAppId = !!options?.appId;
    
    if (!hasProjectId || !hasAppId) {
      return false;
    }
    
    return true;
  } catch (error) {
    return true;
  }
};

export const isFirebaseReady = (): boolean => {
  try {
    const appModule = require('@react-native-firebase/app').default;
    const appObj = appModule as any;
    const options = appObj.options || {};
    const {projectId, appId} = options;
    return !!projectId && !!appId;
  } catch (error) {
    return true;
  }
};

