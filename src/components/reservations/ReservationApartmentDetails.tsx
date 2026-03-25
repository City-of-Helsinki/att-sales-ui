import React from 'react';

import formattedLivingArea from '../../utils/formatLivingArea';
import Label from '../common/label/Label';
import type { Apartment, Project } from '../../types';

import styles from './ReservationModal.module.scss';

type Props = {
  project: Project;
  apartment: Apartment;
};

const ReservationApartmentDetails = ({ project, apartment }: Props): JSX.Element => {
  return (
    <div className={styles.details}>
      <div className={styles.projectHousingCompany}>
        <Label type={project.ownership_type}>{project.ownership_type}</Label>
      </div>
      <div>
        <div className={styles.title}>
          <h3>{project.housing_company}</h3>
          <span>
            <strong>{project.district}, </strong>
            {project.street_address}
          </span>
        </div>
        <div className={styles.apartment}>
          <strong>{apartment.apartment_number}</strong>
          <span>&mdash;</span>
          {apartment.apartment_structure}
          <span>&mdash;</span>
          {apartment.living_area && formattedLivingArea(apartment.living_area)}
        </div>
      </div>
    </div>
  );
};

export default ReservationApartmentDetails;
