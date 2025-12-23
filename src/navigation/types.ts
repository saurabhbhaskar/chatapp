import {NavigatorScreenParams} from '@react-navigation/native';

export type RootStackParamList = {
  SplashScreen: undefined;
  LoginScreen: undefined;
  RegisterScreen: undefined;
  ForgotPasswordScreen: undefined;
  ChatListScreen: undefined;
  ChatScreen: {chatId: string};
  GroupCreateScreen: undefined;
  GroupInfoScreen: {chatId: string};
  AddMembersScreen: {chatId: string};
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

