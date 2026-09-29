import { ApartmentState } from '../enums';
import { Apartment } from '../types';

export const ALL_APARTMENTS_STATE_FILTER = '-';
export const ACTIVE_APARTMENTS_STATE_FILTER = 'active';

export const filterApartmentsByState = (apartments: Apartment[] | undefined, selectedState: string): Apartment[] => {
  if (!apartments) {
    return [];
  }

  if (!selectedState || selectedState === ALL_APARTMENTS_STATE_FILTER) {
    return apartments;
  }

  if (selectedState === ACTIVE_APARTMENTS_STATE_FILTER) {
    return apartments.filter(
      (apartment) => apartment.state !== ApartmentState.FREE && apartment.state !== ApartmentState.SOLD
    );
  }

  return apartments.filter((apartment) => apartment.state === selectedState);
};
