import React from 'react';
import { IconAngleRight, IconSize } from 'hds-react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import styles from './Breadcrumbs.module.scss';

const T_PATH = 'components.common.breadcrumbs.Breadcrumbs';

export interface BreadcrumbItem {
  label: string;
  path: string;
}

interface IProps {
  current: string;
  ancestors: BreadcrumbItem[];
}

const Breadcrumbs = ({ current, ancestors }: IProps): JSX.Element => {
  const { t } = useTranslation();

  const renderBreadcrumbs = () => (
    <ul>
      {ancestors.map((ancestor, key) => (
        <li key={key}>
          <Link to={ancestor.path}>{ancestor.label}</Link>{' '}
          <IconAngleRight className={styles.arrowIcon} size={IconSize.ExtraSmall} />
        </li>
      ))}
      <li>{current}</li>
    </ul>
  );

  return (
    <nav className={styles.breadcrumbs} aria-label={t(`${T_PATH}.ariaLabel`)}>
      {renderBreadcrumbs()}
    </nav>
  );
};

export default Breadcrumbs;
