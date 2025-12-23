import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {UserPresence} from '../types/user';

interface PresenceState {
  presences: {[uid: string]: UserPresence};
}

const initialState: PresenceState = {
  presences: {},
};

export const presenceSlice = createSlice({
  name: 'presence',
  initialState,
  reducers: {
    setPresence: (state, action: PayloadAction<UserPresence>) => {
      state.presences[action.payload.uid] = action.payload;
    },
    setPresences: (
      state,
      action: PayloadAction<{[uid: string]: UserPresence}>,
    ) => {
      state.presences = {...state.presences, ...action.payload};
    },
    removePresence: (state, action: PayloadAction<string>) => {
      delete state.presences[action.payload];
    },
    clearPresences: state => {
      state.presences = {};
    },
  },
});

export const {
  setPresence,
  setPresences,
  removePresence,
  clearPresences,
} = presenceSlice.actions;
export default presenceSlice.reducer;

