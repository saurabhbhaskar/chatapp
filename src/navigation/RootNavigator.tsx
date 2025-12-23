import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React, {useEffect, useRef} from 'react';
import {AppState, AppStateStatus} from 'react-native';
import {useSelector} from 'react-redux';
import {PresenceService} from '../services';

import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import SplashScreen from '../screens/auth/SplashScreen';
import ChatListScreen from '../screens/chats/ChatListScreen';
import ChatScreen from '../screens/chats/ChatScreen';
import GroupCreateScreen from '../screens/chats/GroupCreateScreen';
import GroupInfoScreen from '../screens/chats/GroupInfoScreen';
import AddMembersScreen from '../screens/chats/AddMembersScreen';
import CallsScreen from '../screens/calls/CallsScreen';
import SettingsScreen from '../screens/settings/SettingsScreen';
import Snackbar from '../Components/Common/Snackbar';

const Stack = createNativeStackNavigator();

const RootNavigator: React.FC = () => {
  const {user} = useSelector((state: any) => state.auth);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!user?.uid) return;

    // Initialize presence when user is available
    PresenceService.setOnline(user.uid).catch(() => {
      // Silently fail if presence update fails
    });

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground
        PresenceService.setOnline(user.uid).catch(() => {
          // Silently fail if presence update fails
        });
      } else if (
        appState.current === 'active' &&
        nextAppState.match(/inactive|background/)
      ) {
        // App has gone to the background
        PresenceService.setOffline(user.uid).catch(() => {
          // Silently fail if presence update fails
        });
      }

      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [user]);

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="SplashScreen"
        screenOptions={{
          headerShown: false,
        }}>
        <Stack.Screen name="SplashScreen" component={SplashScreen} />
        <Stack.Screen name="LoginScreen" component={LoginScreen} />
        <Stack.Screen name="RegisterScreen" component={RegisterScreen} />
        <Stack.Screen
          name="ForgotPasswordScreen"
          component={ForgotPasswordScreen}
        />
        <Stack.Screen name="ChatListScreen" component={ChatListScreen} />
        <Stack.Screen name="ChatScreen" component={ChatScreen} />
        <Stack.Screen
          name="GroupCreateScreen"
          component={GroupCreateScreen}
        />
        <Stack.Screen
          name="GroupInfoScreen"
          component={GroupInfoScreen}
        />
        <Stack.Screen
          name="AddMembersScreen"
          component={AddMembersScreen}
        />
        <Stack.Screen name="CallsScreen" component={CallsScreen} />
        <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
      </Stack.Navigator>
      <Snackbar />
    </NavigationContainer>
  );
};

export default RootNavigator;

