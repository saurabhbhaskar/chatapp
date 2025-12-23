import {configureStore} from '@reduxjs/toolkit';
import authReducer from './authSlice';
import chatReducer from './chatSlice';
import presenceReducer from './presenceSlice';
import snackbarReducer from './snackbarSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    presence: presenceReducer,
    snackbar: snackbarReducer,
  },
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

