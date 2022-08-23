import React from 'react';
import cx from 'classnames';
import { IconAlertCircle, IconAlertCircleFill, IconCheckCircle } from 'hds-react';

import { Apartment } from '../../types';
import { ApartmentState } from '../../enums';

import styles from './ApartmentStateIndicator.module.scss';

interface IProps {
  state: Apartment['state'];
}

const ApartmentStateIndicator = ({ state }: IProps): JSX.Element => {
  const greenDot = <span className={cx(styles.stateIncicator, styles.dot, styles.greenDot)} />;
  const orangeDot = <span className={cx(styles.stateIncicator, styles.dot, styles.orangeDot)} />;
  const blueDot = <span className={cx(styles.stateIncicator, styles.dot, styles.blueDot)} />;
  const redAlert = <IconAlertCircleFill className={cx(styles.stateIncicator, styles.icon, styles.redIcon)} />;
  const orangeAlert = <IconAlertCircle className={cx(styles.stateIncicator, styles.icon, styles.orangeIcon)} />;
  const greenCheck = <IconCheckCircle className={cx(styles.stateIncicator, styles.icon, styles.greenIcon)} />;

  switch (state) {
    case ApartmentState.ACCEPTED_BY_MUNICIPALITY:
    case ApartmentState.OFFER_ACCEPTED:
    case ApartmentState.RESERVATION_AGREEMENT:
      return greenDot;
    case ApartmentState.FREE:
      return blueDot;
    case ApartmentState.OFFERED:
      return orangeDot;
    case ApartmentState.OFFER_EXPIRED:
    case ApartmentState.REVIEW:
      return redAlert;
    case ApartmentState.RESERVED:
      return orangeAlert;
    case ApartmentState.SOLD:
      return greenCheck;
    default:
      return <span className={cx(styles.stateIncicator, styles.dot)} />;
  }
};

export default ApartmentStateIndicator;
