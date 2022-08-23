import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Apartment, Project } from '../../types';

interface ReservationAddModalContent {
  apartment: Apartment;
  project: Project;
}

interface ReservationAddModalState {
  isOpened: boolean;
  content?: ReservationAddModalContent;
}

const initialState: ReservationAddModalState = {
  isOpened: false,
  content: undefined,
};

const reservationAddModalSlice = createSlice({
  name: 'reservationAddModal',
  initialState: initialState,
  reducers: {
    showReservationAddModal: (state, action: PayloadAction<ReservationAddModalContent>) => {
      state.isOpened = true;
      state.content = action.payload;
    },
    hideReservationAddModal: (state) => {
      state.isOpened = false;
      state.content = undefined;
    },
  },
});

export const { showReservationAddModal, hideReservationAddModal } = reservationAddModalSlice.actions;

export default reservationAddModalSlice.reducer;
