import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { store } from './src/Redux/store';
import { initializeFirebase } from './src/firebase';
import RootNavigator from './src/navigation/RootNavigator';

initializeFirebase();

// Create a QueryClient instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <RootNavigator />
        </SafeAreaProvider>
      </QueryClientProvider>
    </Provider>
  );
};

export default App;
