import React from 'react';
import cx from 'classnames';
import { Button, ButtonPresetTheme, ButtonVariant, IconAngleDown, IconAngleRight } from 'hds-react';
import { useTranslation } from 'react-i18next';

import CustomerReservationRow from './CustomerReservationRow';
import Container from '../common/container/Container';
import ProjectName from '../project/ProjectName';
import Spinner from '../common/spinner/Spinner';
import StatusText from '../common/statusText/StatusText';
import useSessionStorage from '../../utils/useSessionStorage';
import { groupReservationsByProject, getReservationProjectData } from '../../utils/mapReservationData';
import { Customer, CustomerReservation } from '../../types';

import styles from './CustomerReservations.module.scss';

const T_PATH = 'components.reservations.CustomerReservations';

interface CustomerReservationsProps {
  customer: Customer;
  reservations: CustomerReservation[] | undefined;
  isLoadingInitial?: boolean;
  isLoadingMore?: boolean;
}

interface ReservationsByProjectProps {
  customer: Customer;
  reservations: CustomerReservation[];
}

const CustomerReservations = ({
  customer,
  reservations,
  isLoadingInitial,
  isLoadingMore,
}: CustomerReservationsProps): JSX.Element => {
  const { t } = useTranslation();

  if (isLoadingInitial && !reservations) {
    return (
      <Container>
        <Spinner />
      </Container>
    );
  }

  const reservationsByProject = groupReservationsByProject(reservations || []);

  if (!reservationsByProject.length) {
    if (isLoadingMore) {
      return (
        <Container>
          <Spinner />
        </Container>
      );
    }
    return (
      <div className={styles.singleProject}>
        <StatusText>{t(`${T_PATH}.noReservations`)}</StatusText>
      </div>
    );
  }

  // Sort reservation groups alphabetically by project name
  const sortedReservationsByProject = [...reservationsByProject];
  sortedReservationsByProject.sort((a, b) => a[0].project_housing_company.localeCompare(b[0].project_housing_company));

  return (
    <>
      {sortedReservationsByProject.map((projectReservations, index) => (
        <ReservationsByProject key={index} customer={customer} reservations={projectReservations} />
      ))}
      {isLoadingMore && (
        <Container>
          <Spinner />
        </Container>
      )}
    </>
  );
};

export const ReservationsByProject = ({ customer, reservations }: ReservationsByProjectProps): JSX.Element => {
  const { t } = useTranslation();
  const [projectOpen, setProjectOpen] = useSessionStorage({
    defaultValue: false,
    key: `reservationProjectRowOpen-${reservations[0].project_uuid}`,
  });
  const toggleProject = () => setProjectOpen(!projectOpen);

  return (
    <div className={cx(styles.singleProject, projectOpen && styles.open)}>
      <div className={styles.projectRow}>
        <ProjectName project={getReservationProjectData(reservations[0])} asLink />
        <Button
          variant={ButtonVariant.Secondary}
          theme={ButtonPresetTheme.Black}
          className={styles.accordionButton}
          onClick={toggleProject}
          iconStart={projectOpen ? <IconAngleDown /> : <IconAngleRight />}
        >
          {/* <span className="visually-hidden">{projectOpen ? t(`${T_PATH}.hide`) : t(`${T_PATH}.show`)}</span> */}
          {projectOpen ? t(`${T_PATH}.hide`) : t(`${T_PATH}.show`)}
        </Button>
      </div>
      {projectOpen &&
        reservations.map((reservation) => (
          <div key={reservation.id} className={styles.singleApartment}>
            <CustomerReservationRow reservation={reservation} customer={customer} />
          </div>
        ))}
    </div>
  );
};

export default CustomerReservations;
