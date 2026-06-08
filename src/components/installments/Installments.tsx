import React from 'react';
import { useTranslation } from 'react-i18next';

import Container from '../common/container/Container';
import InstallmentsItem from './InstallmentsItem';
import ProjectName from '../project/ProjectName';
import Spinner from '../common/spinner/Spinner';
import StatusText from '../common/statusText/StatusText';
import {
  getReservationApartmentData,
  getReservationProjectData,
  groupReservationsByProject,
} from '../../utils/mapReservationData';
import { CustomerReservation } from '../../types';
import { ApartmentReservationStates } from '../../enums';

import styles from './Installments.module.scss';

const T_PATH = 'components.installments.Installments';

interface IProps {
  reservations: CustomerReservation[] | undefined;
  isLoadingInitial?: boolean;
  isLoadingMore?: boolean;
}

const Installments = ({ reservations, isLoadingInitial, isLoadingMore }: IProps): JSX.Element => {
  const { t } = useTranslation();

  if (isLoadingInitial && !reservations) {
    return (
      <Container>
        <Spinner />
      </Container>
    );
  }

  // Filter reservations:
  // 1. All reservations that have saved installments
  // Or
  // 2. Reservation's state is not in a state "REVIEW" AND lottery is completed AND reservation's queue position is 1
  const visibleReservations =
    reservations?.filter(
      (reservation) =>
        !!reservation.apartment_installments?.length ||
        (reservation.state !== ApartmentReservationStates.REVIEW &&
          reservation.project_lottery_completed &&
          reservation.queue_position === 1)
    ) || [];

  const reservationsByProject = groupReservationsByProject(visibleReservations);

  if (!reservationsByProject.length) {
    if (isLoadingMore) {
      return (
        <Container>
          <Spinner />
        </Container>
      );
    }
    return <StatusText>{t(`${T_PATH}.noReservations`)}</StatusText>;
  }

  // Sort reservation groups alphabetically by project name
  const sortedReservationsByProject = [...reservationsByProject];
  sortedReservationsByProject.sort((a, b) => a[0].project_housing_company.localeCompare(b[0].project_housing_company));

  return (
    <>
      {sortedReservationsByProject.map((projectReservations, index) => (
        <div className={styles.singleProject} key={index}>
          <ProjectName project={getReservationProjectData(projectReservations[0])} asLink />
          {projectReservations.map((reservation) => (
            <div key={reservation.id} className={styles.singleApartment}>
              <InstallmentsItem
                apartment={getReservationApartmentData(reservation)}
                project={getReservationProjectData(reservation)}
                reservationId={reservation.id}
                isCanceled={reservation.state === ApartmentReservationStates.CANCELED}
              />
            </div>
          ))}
        </div>
      ))}
      {isLoadingMore && (
        <Container>
          <Spinner />
        </Container>
      )}
    </>
  );
};

export default Installments;
