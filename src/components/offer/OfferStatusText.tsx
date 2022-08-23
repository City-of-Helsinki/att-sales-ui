import React from 'react';
import cx from 'classnames';
import { IconAlertCircleFill, IconArrowRight, IconCheckCircleFill } from 'hds-react';

import { ApartmentReservationOffer } from '../../types';
import { OfferState } from '../../enums';
import { renderOfferDate, renderOfferState } from '../../utils/getOfferText';

import styles from './OfferStatusText.module.scss';

interface IProps {
  offer: ApartmentReservationOffer;
}

const OfferStatusText = ({ offer }: IProps) => {
  return (
    <span className={styles.offer}>
      <span className={styles.offerState}>{renderOfferState(offer)}</span>
      <span
        className={cx(
          styles.offerDate,
          offer.state === OfferState.ACCEPTED && styles.offerSuccess,
          (offer.state === OfferState.REJECTED || offer.is_expired) && styles.offerError
        )}
      >
        {offer.state === OfferState.PENDING && !offer.is_expired && (
          <IconArrowRight size="xs" aria-hidden className={styles.offerIcon} />
        )}
        {offer.state === OfferState.ACCEPTED && (
          <IconCheckCircleFill size="xs" aria-hidden className={styles.offerIcon} />
        )}
        {(offer.state === OfferState.REJECTED || offer.is_expired) && (
          <IconAlertCircleFill size="xs" aria-hidden className={styles.offerIcon} />
        )}
        <span>{renderOfferDate(offer)}</span>
      </span>
    </span>
  );
};

export default OfferStatusText;
