import { ApartmentReservationWithCustomer } from '../types';
import { getRightOfResidenceText } from './getRightOfResidenceText';

describe('getRightOfResidenceText', () => {
  it('should render old batch numbers correctly', () => {
    const apartmentReservation = {
      right_of_residence: 12345,
      right_of_residence_is_old_batch: true,
    } as ApartmentReservationWithCustomer;
    const rightOfResidenceText = getRightOfResidenceText(apartmentReservation);

    expect(rightOfResidenceText).toEqual('12345 (vanha)');
  });

  it('should render new batch numbers correctly', () => {
    const apartmentReservation = {
      right_of_residence: 12345,
      right_of_residence_is_old_batch: false,
    } as ApartmentReservationWithCustomer;
    const rightOfResidenceText = getRightOfResidenceText(apartmentReservation);

    expect(rightOfResidenceText).toEqual('12345');
  });

  it('should render non-haso instances correctly', () => {
    const apartmentReservation = {
      right_of_residence: null,
      right_of_residence_is_old_batch: null,
    } as ApartmentReservationWithCustomer;
    const rightOfResidenceText = getRightOfResidenceText(apartmentReservation);

    expect(rightOfResidenceText).toEqual('-');
  });
});
