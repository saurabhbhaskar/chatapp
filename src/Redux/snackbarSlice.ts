import {createSlice, PayloadAction} from '@reduxjs/toolkit';

export enum SnackbarType {
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

interface Snackbar {
  id: string;
  message: string;
  type: SnackbarType;
  duration?: number;
}

interface SnackbarState {
  snackbars: Snackbar[];
}

const initialState: SnackbarState = {
  snackbars: [],
};

export const snackbarSlice = createSlice({
  name: 'snackbar',
  initialState,
  reducers: {
    addSnackbar: (state, action: PayloadAction<Omit<Snackbar, 'id'>>) => {
      const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      state.snackbars.push({
        ...action.payload,
        id,
        duration: action.payload.duration || 3000,
      });
    },
    removeSnackbar: (state, action: PayloadAction<string>) => {
      state.snackbars = state.snackbars.filter(
        snackbar => snackbar.id !== action.payload,
      );
    },
    clearSnackbars: state => {
      state.snackbars = [];
    },
  },
});

export const {addSnackbar, removeSnackbar, clearSnackbars} =
  snackbarSlice.actions;
export default snackbarSlice.reducer;

