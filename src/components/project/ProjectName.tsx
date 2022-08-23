import React from 'react';

import Label from '../common/label/Label';

import { Project } from '../../types';

import styles from './ProjectName.module.scss';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../enums';

interface IProps {
  project?: Project;
  asLink?: boolean;
}

const ProjectName = ({ project, asLink = false }: IProps): JSX.Element | null => {
  if (!project) {
    return null;
  }

  return (
    <div className={styles.projectName}>
      <div className={styles.labelWrapper}>
        <Label type={project.ownership_type}>{project.ownership_type}</Label>
      </div>
      <h2 className={styles.projectHousingCompany}>
        {asLink && project.uuid ? (
          <Link to={`/${ROUTES.PROJECTS}/${project.uuid}`}>{project.housing_company}</Link>
        ) : (
          project.housing_company
        )}
      </h2>
      <div>
        <strong>{project.district},</strong> {project.street_address}
      </div>
    </div>
  );
};

export default ProjectName;
