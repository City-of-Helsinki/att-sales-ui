import React from 'react';
import { StatusLabel } from 'hds-react';
import { useTranslation } from 'react-i18next';

import ApartmentStateIndicator from './ApartmentStateIndicator';
import formattedLivingArea from '../../utils/formatLivingArea';
import { Apartment } from '../../types';
import { fullURL } from '../../utils/fullURL';

import styles from './ApartmentBaseDetails.module.scss';

const T_PATH = 'components.apartment.ApartmentBaseDetails';

interface IProps {
  apartment: Apartment;
  isLotteryResult: boolean;
  showState: boolean;
}

const ApartmentBaseDetails = ({ apartment, isLotteryResult, showState }: IProps): JSX.Element => {
  const { t } = useTranslation();
  const { apartment_number, apartment_structure, living_area, url } = apartment;

  const renderDetails = () => (
    <div className={styles.details}>
      {isLotteryResult && <ApartmentStateIndicator state={apartment.state} />}
      <strong className={styles.apartmentNumber}>
        <span className="hiddenFromScreen">{t(`${T_PATH}.apartment`)}: </span>
        {apartment_number}
      </strong>
      <span className={styles.apartmentExtra}>
        <span className="hiddenFromScreen">{t(`${T_PATH}.ariaApartmentStructure`)}: </span>
        {apartment_structure}{' '}
        {living_area && <span className={styles.apartmentLivingArea}>({formattedLivingArea(living_area)})</span>}
      </span>
    </div>
  );

  const renderState = () => (
    <StatusLabel className={styles.label}>{t(`ENUMS.ApartmentState.${apartment.state}`)}</StatusLabel>
  );

  if (url) {
    return (
      <>
        <a href={fullURL(url)} target="_blank" rel="noreferrer" className={styles.apartmentLink}>
          {renderDetails()}
        </a>
        {showState && renderState()}
      </>
    );
  }

  return (
    <>
      {renderDetails()}
      {showState && renderState()}
    </>
  );
};

export default ApartmentBaseDetails;
