import React from 'react';
import { Button, IconAlertCircle } from 'hds-react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import { showApartmentRevaluationModal } from '../../redux/features/apartmentRevaluationModalSlice';
import { ApartmentReservationWithCustomer } from '../../types';
import formatDateTime from '../../utils/formatDateTime';

import styles from './ReservationRevaluationInfo.module.scss';

const T_PATH = 'components.revaluation.ReservationRevaluationInfo';

interface Props {
  reservationWithCustomer: ApartmentReservationWithCustomer;
}

const ReservationRevaluationInfo = ({ reservationWithCustomer }: Props): JSX.Element => {
  const dispatch = useDispatch();
  const { t: translate } = useTranslation();
  const t = (label: string) => translate(`${T_PATH}.${label}`);
  const revaluation = reservationWithCustomer.revaluation;
  if (revaluation) {
    return (
      <div className={styles.revaluationInfoRow}>
        <button
          onClick={() => {
            dispatch(
              showApartmentRevaluationModal({
                apartmentId: reservationWithCustomer.apartment_uuid,
                reservationId: reservationWithCustomer.id,
                customer: reservationWithCustomer.customer,
                revaluation: revaluation,
              })
            );
          }}
          className={styles.editButton}
        >
          {t('revaluationEdit')} {formatDateTime(revaluation.updated_at)}
        </button>
      </div>
    );
  }

  return (
    <Button
      variant="supplementary"
      onClick={() => {
        dispatch(
          showApartmentRevaluationModal({
            apartmentId: reservationWithCustomer.apartment_uuid,
            reservationId: reservationWithCustomer.id,
            customer: reservationWithCustomer.customer,
          })
        );
      }}
      size="small"
      iconLeft={<IconAlertCircle />}
    >
      {t('buttonCreate')}
    </Button>
  );
};

export default ReservationRevaluationInfo;
