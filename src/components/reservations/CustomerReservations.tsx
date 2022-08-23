import React from 'react';
import cx from 'classnames';
import { Button, IconAngleDown, IconAngleRight } from 'hds-react';
import { useTranslation } from 'react-i18next';

import CustomerReservationRow from './CustomerReservationRow';
import ProjectName from '../project/ProjectName';
import StatusText from '../common/statusText/StatusText';
import useSessionStorage from '../../utils/useSessionStorage';
import { groupReservationsByProject, getReservationProjectData } from '../../utils/mapReservationData';
import { Customer, CustomerReservation } from '../../types';

import styles from './CustomerReservations.module.scss';

const T_PATH = 'components.reservations.CustomerReservations';

interface CustomerReservationsProps {
  customer: Customer;
}

interface ReservationsByProjectProps {
  customer: Customer;
  reservations: CustomerReservation[];
}

const CustomerReservations = ({ customer }: CustomerReservationsProps): JSX.Element => {
  const { t } = useTranslation();
  const reservationsByProject = groupReservationsByProject(customer.apartment_reservations || []);

  if (!reservationsByProject.length) {
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
          variant="secondary"
          theme="black"
          className={styles.accordionButton}
          onClick={toggleProject}
          iconLeft={projectOpen ? <IconAngleDown /> : <IconAngleRight />}
        >
          <span className="hiddenFromScreen">{projectOpen ? t(`${T_PATH}.hide`) : t(`${T_PATH}.show`)}</span>
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
