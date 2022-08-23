import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Apartment, ApartmentReservationCustomer, OfferModalReservationData, Project } from '../../types';

interface OfferModalContent {
  apartment: Apartment;
  customer: ApartmentReservationCustomer;
  isNewOffer: boolean;
  project: Project;
  reservation: OfferModalReservationData;
}

interface OfferModalState {
  isOpened: boolean;
  content?: OfferModalContent;
}

const initialState: OfferModalState = {
  isOpened: false,
  content: undefined,
};

const offerModalSlice = createSlice({
  name: 'offerModal',
  initialState: initialState,
  reducers: {
    showOfferModal: (state, action: PayloadAction<OfferModalContent>) => {
      state.isOpened = true;
      state.content = action.payload;
    },
    hideOfferModal: (state) => {
      state.isOpened = false;
      state.content = undefined;
    },
  },
});

export const { showOfferModal, hideOfferModal } = offerModalSlice.actions;

export default offerModalSlice.reducer;
