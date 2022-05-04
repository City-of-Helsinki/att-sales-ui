import React, { useState } from 'react';
import axios from 'axios';
import cx from 'classnames';
import { Button, IconArrowRight } from 'hds-react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import formattedLivingArea from '../../utils/formatLivingArea';
import getApiBaseUrl from '../../utils/getApiBaseUrl';
import { ApartmentReservationStates } from '../../enums';
import { showOfferModal } from '../../redux/features/offerModalSlice';
import { Customer, CustomerReservation } from '../../types';
import { getReservationApartmentData, getReservationProjectData } from '../../utils/mapReservationData';
import { useDownloadFile } from '../../utils/useDownloadFile';
import { toast } from '../common/toast/ToastManager';

import styles from './CustomerReservationRow.module.scss';

const T_PATH = 'components.reservations.CustomerReservationRow';

interface IProps {
  customer: Customer;
  reservation: CustomerReservation;
}

const CustomerReservationRow = ({ customer, reservation }: IProps): JSX.Element => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [isLoadingContract, setIsLoadingContract] = useState<boolean>(false);
  const apartment = getReservationApartmentData(reservation);
  const project = getReservationProjectData(reservation);
  const isCanceled = reservation.state === ApartmentReservationStates.CANCELED;

  const preContractDownloading = () => setIsLoadingContract(true);
  const postContractDownloading = () => setIsLoadingContract(false);

  const onContractLoadError = () => {
    setIsLoadingContract(false);
    toast.show({ type: 'error' });
  };

  const getContractFileName = (): string => {
    const projectName = reservation.project_housing_company.replace(/\s/g, '-').toLocaleLowerCase();
    const apartmentNumber = reservation.apartment_number.replace(/\s/g, '').toLocaleLowerCase();
    let prefix = '';

    if (reservation.project_ownership_type.toLowerCase() === 'haso') {
      prefix = 'sopimus';
    } else {
      prefix = 'kauppakirja';
    }

    // Example output: "kauppakirja_as-oy-project-x_a01_2022-01-01.pdf"
    return `${prefix}${JSON.stringify(projectName + '_' + apartmentNumber)}${new Date().toJSON().slice(0, 10)}.pdf`;
  };

  const downloadContract = () => {
    const apiBaseUrl = getApiBaseUrl();

    return axios.get(`${apiBaseUrl}/apartment_reservations/${reservation.id}/contract/`, {
      responseType: 'blob',
      // TODO: auth token in headers
      // headers: {
      //   Authorization: `Bearer ${apiToken}`,
      // }
    });
  };

  const {
    download,
    ref: fileRef,
    url: fileUrl,
    name: fileName,
  } = useDownloadFile({
    apiDefinition: downloadContract,
    getFileName: getContractFileName,
    onError: onContractLoadError,
    postDownloading: postContractDownloading,
    preDownloading: preContractDownloading,
  });

  const renderQueuePosition = (): string => {
    if (reservation.queue_position === null) {
      return t(`${T_PATH}.lotteryUncompleted`);
    }
    return `${reservation.queue_position}. ` + t(`${T_PATH}.position`);
  };

  return (
    <div className={styles.row}>
      <div className={cx(styles.apartmentRow, isCanceled && styles.disabledRow)}>
        <div className={styles.apartmentRowLeft}>
          <div className={styles.apartmentStructure}>
            <span className={styles.emphasized}>{apartment.apartment_number}</span>
            <span>
              {apartment.apartment_structure} ({formattedLivingArea(apartment.living_area)})
            </span>
          </div>
          {isCanceled ? (
            // TODO: Add cancellation reason and cancel dates
            <div>{t(`${T_PATH}.canceled`)}</div>
          ) : (
            <div>{renderQueuePosition()}</div>
          )}
          <div>{t(`${T_PATH}.priority`)}: TODO</div>
        </div>
        <div className={styles.apartmentRowRight}>
          {!isCanceled && (
            <div className={styles.offer}>
              <span className={styles.offerTitle}>{t(`${T_PATH}.offerDueDate`)}</span>{' '}
              <IconArrowRight className={styles.offerArrowIcon} size="xs" aria-hidden /> <span>TODO</span>
            </div>
          )}
        </div>
      </div>
      {!isCanceled && reservation.queue_position === 1 && (
        <div className={styles.buttons}>
          <Button
            variant="secondary"
            size="small"
            onClick={() =>
              dispatch(
                showOfferModal({
                  project: project,
                  apartment: apartment,
                  customer: customer,
                })
              )
            }
          >
            {t(`${T_PATH}.createOffer`)}
          </Button>
          <Button variant="secondary" size="small" onClick={download} disabled={isLoadingContract}>
            {reservation.project_ownership_type.toLowerCase() === 'haso'
              ? t(`${T_PATH}.createContract`)
              : t(`${T_PATH}.createDeedOfSale`)}
          </Button>
          <a href={fileUrl} download={fileName} className="hiddenFromScreen" ref={fileRef}>
            {t(`${T_PATH}.download`)}
          </a>
        </div>
      )}
    </div>
  );
};

export default CustomerReservationRow;
