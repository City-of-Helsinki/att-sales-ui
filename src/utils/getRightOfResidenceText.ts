import i18n from '../i18n/i18n';
import { ApartmentReservationWithCustomer, Customer, OfferModalReservationData } from '../types';

const T_PATH = 'utils.getRightOfResidenceText';

export const getRightOfResidenceText = (
  instance: ApartmentReservationWithCustomer | OfferModalReservationData | Customer
): string => {
  if (!instance.right_of_residence) {
    return '-';
  }
  return (
    instance.right_of_residence.toString() +
    (instance.right_of_residence_is_old_batch ? ` (${i18n.t(T_PATH + '.old')})` : '')
  );
};
