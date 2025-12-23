# ChatApp - React Native Messaging Application

A modern, real-time messaging application built with React Native, featuring direct messaging, group chats, and WhatsApp-style functionality.

## 📱 Features

### Authentication
- User registration and login
- Email/password authentication
- Secure password reset functionality
- Persistent authentication with keychain storage

### Direct Messaging
- One-on-one chat conversations
- Real-time message delivery
- Message read receipts
- Typing indicators
- Message timestamps

### Group Chat
- Create and manage group chats
- Add/remove group members
- Group roles (Owner, Admin, Member)
- Group info screen with member management
- System messages for group events (e.g., "X added Y", "X is now admin")

### Messaging Features
- **Reply to Messages**: Quote and reply to specific messages
- **Forward Messages**: Forward messages to other chats
- **Delete Messages**: 
  - Delete for me (hide message from your view)
  - Delete for everyone (remove message for all participants)
- **System Messages**: WhatsApp-style notifications for group events
- **Message Bubbles**: 
  - Different styles for sent/received messages
  - Sender name and avatar display in group chats
  - Timestamp display

### User Interface
- Modern, clean UI design
- Responsive layout with proper scaling
- Bottom navigation bar
- Profile screens for users and groups
- Contact management
- Call history screen

### Real-time Features
- Real-time message synchronization
- Live typing indicators
- Online/offline status
- Last seen timestamps

## 🛠 Tech Stack

- **Framework**: React Native 0.83.1
- **Language**: TypeScript 5.8.3
- **State Management**: Redux Toolkit
- **Navigation**: React Navigation 6.x
- **Backend**: Firebase
  - Firebase Authentication
  - Firebase Realtime Database
  - Firebase Storage
- **Real-time Communication**: Socket.IO
- **UI Components**: React Native Vector Icons
- **Storage**: AsyncStorage, React Native Keychain

## 📁 Project Structure

```
react-native-chatapp/
├── android/                 # Android native code
├── ios/                     # iOS native code
├── src/
│   ├── Components/         # Reusable components
│   │   └── Common/
│   │       ├── Avatar.tsx
│   │       ├── BottomNavBar.tsx
│   │       ├── MessageBubble.tsx
│   │       ├── SystemMessage.tsx
│   │       └── CustomTextInput.tsx
│   ├── screens/            # Screen components
│   │   ├── auth/          # Authentication screens
│   │   ├── chats/         # Chat-related screens
│   │   ├── calls/         # Call history screen
│   │   ├── contacts/      # Contacts screen
│   │   └── settings/      # Settings/profile screen
│   ├── services/          # Business logic services
│   │   ├── firebase/     # Firebase services
│   │   └── socket/       # Socket.IO services
│   ├── Redux/            # Redux store and slices
│   ├── navigation/       # Navigation configuration
│   ├── types/            # TypeScript type definitions
│   ├── Helper/           # Utility functions
│   └── firebase/         # Firebase configuration
└── package.json
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 20
- React Native development environment set up
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)
- Firebase project configured

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd react-native-chatapp
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **iOS Setup** (macOS only)
   ```bash
   cd ios
   pod install
   cd ..
   ```

4. **Firebase Configuration**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Download `google-services.json` for Android and place it in `android/app/`
   - Download `GoogleService-Info.plist` for iOS and place it in `ios/`
   - Configure Firebase Authentication (Email/Password)
   - Set up Firebase Realtime Database
   - Configure Firebase Storage

5. **Environment Setup**
   - Update Firebase configuration in `src/firebase/` directory
   - Configure Socket.IO server URL in `src/services/socket/socket.client.ts`

### Running the App

1. **Start Metro Bundler**
   ```bash
   npm start
   # or
   yarn start
   ```

2. **Run on Android**
   ```bash
   npm run android
   # or
   yarn android
   ```

3. **Run on iOS**
   ```bash
   npm run ios
   # or
   yarn ios
   ```

## 🔧 Configuration

### Firebase Setup

1. Create a Firebase project
2. Enable Authentication (Email/Password)
3. Create a Realtime Database
4. Set up Storage bucket
5. Add your app to Firebase project
6. Download configuration files

### Socket.IO Server

Update the Socket.IO server URL in `src/services/socket/socket.client.ts`:
```typescript
socket = io('YOUR_SOCKET_SERVER_URL', {
  // configuration
});
```

## 📱 Screens Overview

### Authentication Screens
- **SplashScreen**: Initial loading screen with authentication check
- **LoginScreen**: User login interface
- **RegisterScreen**: New user registration
- **ForgotPasswordScreen**: Password reset functionality

### Chat Screens
- **ChatListScreen**: List of all conversations
- **ChatScreen**: Individual chat interface with messaging
- **GroupCreateScreen**: Create new group chat
- **GroupInfoScreen**: View group information and members
- **AddMembersScreen**: Add members to group chat

### Other Screens
- **CallsScreen**: Call history
- **ContactsScreen**: User contacts list
- **SettingsScreen**: User profile and app settings

## 🎨 Key Features Implementation

### Message System
- Real-time message synchronization using Firebase Realtime Database
- Message types: text, image, file, system
- Message status: sent, delivered, read
- Reply and forward functionality
- Delete for me / Delete for everyone

### Group Management
- Create groups with name and description
- Role-based permissions (Owner, Admin, Member)
- Add/remove members
- System notifications for group events

### User Interface
- WhatsApp-inspired design
- Responsive components with proper scaling
- Smooth animations and transitions
- Keyboard-aware layouts

## 🔐 Security

- Secure authentication with Firebase
- Password storage using React Native Keychain
- API keys stored securely (not in version control)
- `google-services.json` excluded from Git (see `.gitignore`)

## 📝 Scripts

- `npm start` - Start Metro bundler
- `npm run android` - Run on Android
- `npm run ios` - Run on iOS
- `npm run lint` - Run ESLint
- `npm test` - Run tests

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 👨‍💻 Development

### Code Structure
- TypeScript for type safety
- Redux for state management
- Service layer for business logic
- Component-based architecture

### Best Practices
- Follow React Native best practices
- Use TypeScript types
- Maintain component reusability
- Keep services modular

## 🐛 Troubleshooting

### Common Issues

1. **Metro bundler issues**: Clear cache with `npm start -- --reset-cache`
2. **Android build errors**: Clean build with `cd android && ./gradlew clean`
3. **iOS pod issues**: Run `cd ios && pod install`
4. **Firebase connection**: Verify configuration files are correctly placed

## 📚 Resources

- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [Firebase Documentation](https://firebase.google.com/docs)
- [React Navigation](https://reactnavigation.org/)
- [Redux Toolkit](https://redux-toolkit.js.org/)

---

Built with ❤️ using React Native
