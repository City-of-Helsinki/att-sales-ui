import { createSlice } from '@reduxjs/toolkit';

interface AuthSessionExpiringState {
  isOpened: boolean;
}

const initialState: AuthSessionExpiringState = {
  isOpened: false,
};

const authSessionExpiringModalSlice = createSlice({
  name: 'authSessionExpiringModal',
  initialState: initialState,
  reducers: {
    showAuthSessionExpiringModal: (state) => {
      state.isOpened = true;
    },
    hideAuthSessionExpiringModal: (state) => {
      state.isOpened = false;
    },
  },
});

export const { showAuthSessionExpiringModal, hideAuthSessionExpiringModal } = authSessionExpiringModalSlice.actions;

export default authSessionExpiringModalSlice.reducer;
