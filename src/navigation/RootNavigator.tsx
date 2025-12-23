import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { useSelector } from 'react-redux';

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

const Stack = createNativeStackNavigator();

const RootNavigator: React.FC = () => {
  const {isAuthenticated, isLoading} = useSelector((state: any) => state.auth);

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
    </NavigationContainer>
  );
};

export default RootNavigator;

