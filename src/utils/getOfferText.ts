import i18n from '../i18n/i18n';
import formatDateTime from './formatDateTime';
import { ApartmentReservationOffer, Offer } from '../types';
import { OfferState } from '../enums';

const T_PATH = 'utils.getOfferText';

export const renderOfferState = (offer: Offer | ApartmentReservationOffer): string => {
  let offerStatusText = i18n.t(`ENUMS.OfferState.${offer.state.toUpperCase()}`);

  if (offer.is_expired) {
    offerStatusText = i18n.t(`${T_PATH}.expired`);
  }

  return offerStatusText;
};

export const renderOfferDate = (offer: Offer | ApartmentReservationOffer): string => {
  const offerValidUntilDate = offer.valid_until ? formatDateTime(offer.valid_until, true) : '';
  const offerConclusionDate = offer.concluded_at ? formatDateTime(offer.concluded_at, false) : '';

  if (offer.is_expired || offer.state === OfferState.PENDING) {
    return offerValidUntilDate;
  }

  return offerConclusionDate;
};
