import { createSlice, PayloadAction } from '@reduxjs/toolkit';

import { Apartment, ApartmentReservation, ApartmentReservationCustomer, ApartmentRevaluationWithId } from '../../types';

interface ApartmentRevaluationModalContent {
  customer: ApartmentReservationCustomer;
  reservationId: ApartmentReservation['id'];
  revaluation?: ApartmentRevaluationWithId;
  apartmentId: Apartment['uuid'];
}

interface ApartmentRevaluationModalState {
  isOpened: boolean;
  isEditing: boolean;
  content?: ApartmentRevaluationModalContent;
}

const initialState: ApartmentRevaluationModalState = {
  isOpened: false,
  isEditing: false,
  content: undefined,
};

const apartmentRevaluationModalSlice = createSlice({
  name: 'apartmentRevaluationModal',
  initialState: initialState,
  reducers: {
    showApartmentRevaluationModal: (state, action: PayloadAction<ApartmentRevaluationModalContent>) => {
      state.isOpened = true;
      state.content = action.payload;
      state.isEditing = !action.payload.revaluation;
    },
    hideApartmentRevaluationModal: (state) => {
      state.isOpened = false;
      state.content = undefined;
    },
    startEditing: (state) => {
      state.isEditing = true;
    },
    stopEditing: (state) => {
      state.isEditing = false;
    },
  },
});

export const { showApartmentRevaluationModal, hideApartmentRevaluationModal, startEditing, stopEditing } =
  apartmentRevaluationModalSlice.actions;

export default apartmentRevaluationModalSlice.reducer;
