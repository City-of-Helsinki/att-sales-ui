import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { ApartmentReservationWithCustomer, Project } from '../../types';

interface ReservationEditModalContent {
  reservation: ApartmentReservationWithCustomer;
  projectId: Project['uuid'];
}

interface ReservationEditModalState {
  isOpened: boolean;
  content?: ReservationEditModalContent;
}

const initialState: ReservationEditModalState = {
  isOpened: false,
  content: undefined,
};

const reservationEditModalSlice = createSlice({
  name: 'reservationEditModal',
  initialState: initialState,
  reducers: {
    showReservationEditModal: (state, action: PayloadAction<ReservationEditModalContent>) => {
      state.isOpened = true;
      state.content = action.payload;
    },
    hideReservationEditModal: (state) => {
      state.isOpened = false;
      state.content = undefined;
    },
  },
});

export const { showReservationEditModal, hideReservationEditModal } = reservationEditModalSlice.actions;

export default reservationEditModalSlice.reducer;
